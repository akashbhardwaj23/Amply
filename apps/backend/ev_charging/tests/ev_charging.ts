import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { assert } from 'chai';
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from '@solana/spl-token';
import BN from 'bn.js';

describe('ev_charging', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.EvCharging as Program<any>;

  let rewardMint: PublicKey;
  let user = anchor.web3.Keypair.generate();
  let owner = anchor.web3.Keypair.generate();

  let userRewardTokenAccount: PublicKey;
  let ownerRewardTokenAccount: PublicKey;
  let userTokenAccount: PublicKey;
  let ownerTokenAccount: PublicKey;

  let chargerPda: PublicKey;
  let chargerBump: number;

  // User PDA for program-owned user account
  let userPda: PublicKey;
  let userBump: number;

  // For tracking escrow accounts between tests
  let lastEscrowKeypair: anchor.web3.Keypair | null = null;
  let lastEscrowTokenAccount: PublicKey | null = null;

  const chargerName = 'SuperFastCharger';

  before(async () => {
    // Airdrop SOL to user and owner and confirm
    for (const kp of [user, owner]) {
      const sig = await provider.connection.requestAirdrop(
        kp.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig, "confirmed");
    }

    // Create reward token mint (owner is the mint authority)
    rewardMint = await createMint(
      provider.connection,
      owner,
      owner.publicKey,
      null,
      0 // decimals
    );

    // Create reward token accounts
    userRewardTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        user,
        rewardMint,
        user.publicKey
      )
    ).address;

    ownerRewardTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        owner,
        rewardMint,
        owner.publicKey
      )
    ).address;

    // Create payment token accounts (for escrowed payments; using same mint for simplicity)
    userTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        user,
        rewardMint,
        user.publicKey
      )
    ).address;

    ownerTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        owner,
        rewardMint,
        owner.publicKey
      )
    ).address;

    // Mint some tokens to user for payments
    await mintTo(
      provider.connection,
      owner,
      rewardMint,
      userTokenAccount,
      owner,
      100 // arbitrary amount
    );

    // Derive charger PDA
    [chargerPda, chargerBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from(chargerName)],
      program.programId
    );

    // Derive user PDA (adjust the seed as per your program)
    [userPda, userBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user"), user.publicKey.toBuffer()],
      program.programId
    );

    // If your program has a createUser/initUser instruction, call it here.
    // If not, make sure the first use of the user account in your program
    // will initialize it with #[account(init, ...)].
  });

  it('Creates a new charger account', async () => {
    await program.methods
      .createCharger(
        chargerName,
        '123 Main St',
        'Metropolis',
        'State',
        '12345',
        'Fastest charger in town',
        'Type2',
        new BN(22),
        new BN(10),
        'CCS'
      )
      .accounts({
        charger: chargerPda,
        payer: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const charger = await program.account.charger.fetch(chargerPda);
    assert.equal(charger.name, chargerName);
    assert.equal(charger.owner.toBase58(), owner.publicKey.toBase58());
  });

  it('Updates the charger account', async () => {
    await program.methods
      .updateCharger(
        chargerName,
        '456 Updated Ave',
        'Gotham',
        'UpdatedState',
        '54321',
        'Now even faster!',
        'Type2',
        new BN(44),
        new BN(20),
        'CCS'
      )
      .accounts({
        charger: chargerPda,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    const charger = await program.account.charger.fetch(chargerPda);
    assert.equal(charger.address, '456 Updated Ave');
    assert.equal(Number(charger.power), 44);
    assert.equal(Number(charger.price), 20);
  });

  it('Charges user and increments charge count, no reward token yet', async () => {
    // Create a new escrow account for this charge
    const escrowKeypair = anchor.web3.Keypair.generate();
    lastEscrowKeypair = escrowKeypair; // Track for later
    const escrowPda = escrowKeypair.publicKey;
    lastEscrowTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        owner,
        rewardMint,
        escrowPda,
        true
      )
    ).address;

    await program.methods
      .startCharge(
        new BN(10), // price
        false // not using token
      )
      .accounts({
        user: userPda, // Use PDA!
        escrow: escrowPda,
        charger: chargerPda,
        userTokenAccount: userTokenAccount,
        escrowTokenAccount: lastEscrowTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        rewardMint: rewardMint,
        userRewardTokenAccount: userRewardTokenAccount,
        ownerRewardTokenAccount: ownerRewardTokenAccount,
        authority: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user, escrowKeypair])
      .rpc();

    // Fetch user account and check charge count
    const userAccount = await program.account.user.fetch(userPda);
    assert.equal(userAccount.chargeCount, 1);
    assert.equal(userAccount.tokenBalance, 0);
  });

  it('Rewards user with a token after 4 charges', async () => {
    // Simulate 3 more charges
    for (let i = 0; i < 3; i++) {
      const escrowKeypair = anchor.web3.Keypair.generate();
      const escrowPda = escrowKeypair.publicKey;
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        owner,
        rewardMint,
        escrowPda,
        true
      );

      await program.methods
        .startCharge(new BN(10), false)
        .accounts({
          user: userPda,
          escrow: escrowPda,
          charger: chargerPda,
          userTokenAccount: userTokenAccount,
          escrowTokenAccount: lastEscrowTokenAccount!,
          tokenProgram: TOKEN_PROGRAM_ID,
          rewardMint: rewardMint,
          userRewardTokenAccount: userRewardTokenAccount,
          ownerRewardTokenAccount: ownerRewardTokenAccount,
          authority: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user, escrowKeypair])
        .rpc();
    }

    // User should now have 4 charges and 1 reward token
    const userAccount = await program.account.user.fetch(userPda);
    assert.equal(userAccount.chargeCount, 4);

    const userRewardAccount = await getAccount(
      provider.connection,
      userRewardTokenAccount
    );
    assert.equal(Number(userRewardAccount.amount), 1);
  });

  it('Applies 50% discount when user uses a reward token', async () => {
    const escrowKeypair = anchor.web3.Keypair.generate();
    const escrowPda = escrowKeypair.publicKey;
    const escrowTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        owner,
        rewardMint,
        escrowPda,
        true
      )
    ).address;

    // User uses reward token for discount
    await program.methods
      .startCharge(
        new BN(10), // original price
        true // use token for discount
      )
      .accounts({
        user: userPda,
        escrow: escrowPda,
        charger: chargerPda,
        userTokenAccount: userTokenAccount,
        escrowTokenAccount: escrowTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        rewardMint: rewardMint,
        userRewardTokenAccount: userRewardTokenAccount,
        ownerRewardTokenAccount: ownerRewardTokenAccount,
        authority: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user, escrowKeypair])
      .rpc();

    // User's reward token account should now be 0, owner's should have 1 more
    const userRewardAccount = await getAccount(
      provider.connection,
      userRewardTokenAccount
    );
    const ownerRewardAccount = await getAccount(
      provider.connection,
      ownerRewardTokenAccount
    );
    assert.equal(Number(userRewardAccount.amount), 0);
    assert.equal(Number(ownerRewardAccount.amount), 1);
  });

  it('Releases escrow to the owner', async () => {
    // Use the last escrowKeypair and escrowTokenAccount from previous charge
    if (!lastEscrowKeypair || !lastEscrowTokenAccount) {
      throw new Error("No escrow account tracked from previous test");
    }
    await program.methods
      .releaseEscrow(
        new BN(5) // amount to release (should be 50% of original price)
      )
      .accounts({
        escrow: lastEscrowKeypair.publicKey,
        escrowTokenAccount: lastEscrowTokenAccount,
        ownerTokenAccount: ownerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        authority: user.publicKey,
      })
      .signers([user, lastEscrowKeypair])
      .rpc();

    // Check that funds have moved to owner's token account
    const ownerAccount = await getAccount(
      provider.connection,
      ownerTokenAccount
    );
    assert.isAbove(Number(ownerAccount.amount), 0);
  });
});
