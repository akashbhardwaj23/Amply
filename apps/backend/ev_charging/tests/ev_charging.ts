import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { assert } from 'chai';
import {
  Token,
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from '@solana/spl-token';

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
  let escrowTokenAccount: PublicKey;

  let chargerPda: PublicKey;
  let chargerBump: number;
  let escrowPda: PublicKey;

  const chargerName = 'SuperFastCharger';
  const chargerSeed = Buffer.from(chargerName);

  before(async () => {
    // Fund user and owner
    for (const kp of [user, owner]) {
      await provider.connection.requestAirdrop(
        kp.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
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

    // Create payment token (for escrowed payments; using same mint for simplicity)
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
        new anchor.BN(22),
        new anchor.BN(10),
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
        new anchor.BN(44),
        new anchor.BN(20),
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
    escrowPda = anchor.web3.Keypair.generate().publicKey;
    escrowTokenAccount = (
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
        new anchor.BN(10), // price
        false // not using token
      )
      .accounts({
        user: user.publicKey,
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
      .signers([user])
      .rpc();

    // Fetch user account and check charge count
    const userAccount = await program.account.user.fetch(user.publicKey);
    assert.equal(userAccount.chargeCount, 1);
    assert.equal(userAccount.tokenBalance, 0);
  });

  it('Rewards user with a token after 4 charges', async () => {
    // Simulate 3 more charges
    for (let i = 0; i < 3; i++) {
      let escrowPda = anchor.web3.Keypair.generate().publicKey;
      let escrowTokenAccount = (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          owner,
          rewardMint,
          escrowPda,
          true
        )
      ).address;

      await program.methods
        .startCharge(new anchor.BN(10), false)
        .accounts({
          user: user.publicKey,
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
        .signers([user])
        .rpc();
    }

    // User should now have 4 charges and 1 reward token
    const userAccount = await program.account.user.fetch(user.publicKey);
    assert.equal(userAccount.chargeCount, 4);

    const userRewardAccount = await getAccount(
      provider.connection,
      userRewardTokenAccount
    );
    assert.equal(Number(userRewardAccount.amount), 1);
  });

  it('Applies 50% discount when user uses a reward token', async () => {
    let escrowPda = anchor.web3.Keypair.generate().publicKey;
    let escrowTokenAccount = (
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
        new anchor.BN(10), // original price
        true // use token for discount
      )
      .accounts({
        user: user.publicKey,
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
      .signers([user])
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
    // Assume escrowPda and escrowTokenAccount from previous test
    // For a real test, you'd track and reuse these
    await program.methods
      .releaseEscrow(
        new anchor.BN(5) // amount to release (should be 50% of original price)
      )
      .accounts({
        escrow: escrowPda,
        escrowTokenAccount: escrowTokenAccount,
        ownerTokenAccount: ownerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        authority: user.publicKey,
      })
      .signers([user])
      .rpc();

    // Check that funds have moved to owner's token account
    const ownerAccount = await getAccount(
      provider.connection,
      ownerTokenAccount
    );
    assert.isAbove(Number(ownerAccount.amount), 0);
  });
});
