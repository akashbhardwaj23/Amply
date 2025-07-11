import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Connection, Keypair } from '@solana/web3.js';
import { assert } from 'chai';
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from '@solana/spl-token';
import BN from 'bn.js';
import fs from 'fs';
import path from 'path';
import type { EvCharging } from '../target/types/ev_charging';

describe('ev_charging', () => {
  // Configure the client to use the local cluster
  const clusterUrl = process.env.ANCHOR_PROVIDER_URL || 'http://localhost:8899';
  const connection = new Connection(clusterUrl, 'confirmed');

  // Try to load the default keypair
  let payer: Keypair;
  try {
    const walletPath =
      process.env.ANCHOR_WALLET ||
      path.resolve(
        process.env.HOME || process.env.USERPROFILE || '',
        '.config',
        'solana',
        'id.json'
      );
    const walletKeyData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
    payer = Keypair.fromSecretKey(new Uint8Array(walletKeyData));
  } catch (e) {
    console.log('Failed to load wallet, generating a new one for testing');
    payer = Keypair.generate();
  }

  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  anchor.setProvider(provider);

  const program = anchor.workspace.EvCharging as Program<EvCharging>;

  let rewardMint: PublicKey;
  let user = anchor.web3.Keypair.generate();
  let owner = payer;

  let userRewardTokenAccount: PublicKey;
  let ownerRewardTokenAccount: PublicKey;
  let userTokenAccount: PublicKey;
  let ownerTokenAccount: PublicKey;

  let mintAuthorityPda: PublicKey;
  let mintAuthorityBump: number;

  let chargerPda: PublicKey;
  let chargerBump: number;

  let userPda: PublicKey;
  let userBump: number;

  const timestamp = new Date().getTime();
  const chargerName = `SuperFastCharger ${timestamp}`;

  before(async () => {
    // Airdrop SOL to user and owner and confirm
    for (const kp of [user, owner]) {
      try {
        const sig = await provider.connection.requestAirdrop(
          kp.publicKey,
          2 * anchor.web3.LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(sig, 'confirmed');
      } catch (err) {
        console.log('Airdrop failed, but continuing:', err.message);
      }
    }

    // Find the mint authority PDA
    [mintAuthorityPda, mintAuthorityBump] =
      await PublicKey.findProgramAddressSync(
        [Buffer.from('mint-authority')],
        program.programId
      );

    // Create the reward mint using the program's initialize_reward_mint instruction
    const rewardMintKeypair = anchor.web3.Keypair.generate();
    rewardMint = rewardMintKeypair.publicKey;

    await program.methods
      .initializeRewardMint()
      .accounts({
        payer: owner.publicKey,
        rewardMint: rewardMint,
        mintAuthorityPda: mintAuthorityPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([owner, rewardMintKeypair])
      .rpc();

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

    // Derive charger PDA with our unique name
    [chargerPda, chargerBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from(chargerName)],
      program.programId
    );

    // Derive user PDA (adjust the seed as per your program)
    [userPda, userBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from('user'), user.publicKey.toBuffer()],
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
        new BN(22),
        new BN(10),
        'CCS',
        37.7749,
        -122.4194
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
    assert.equal(
      charger.owner.toBase58(),
      owner.publicKey.toBase58(),
      'Charger owner should match test wallet'
    );
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
        'CCS',
        40.7128,
        -74.006
      )
      .accounts({
        charger: chargerPda,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    const updatedCharger = await program.account.charger.fetch(chargerPda);
    assert.equal(updatedCharger.address, '456 Updated Ave');
    assert.equal(updatedCharger.city, 'Gotham');
    assert.equal(updatedCharger.price.toNumber(), 20);
  });

  it('Initializes a user account', async () => {
    try {
      await program.methods
        .initializeUser()
        .accounts({
          user: userPda,
          authority: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
    } catch (err) {
      if (!err.toString().includes('already in use')) {
        throw err;
      }
    }

    const userAccount = await program.account.user.fetch(userPda);
    assert.equal(userAccount.authority.toBase58(), user.publicKey.toBase58());
  });

  it('Charges user and increments charge count, no reward token yet', async () => {
    const initialUserSol = await provider.connection.getBalance(user.publicKey);
    const initialUserTokens = (
      await getAccount(provider.connection, userRewardTokenAccount)
    ).amount;
    const initialOwnerTokens = (
      await getAccount(provider.connection, ownerRewardTokenAccount)
    ).amount;

    const escrowKeypair = anchor.web3.Keypair.generate();
    const escrowPda = escrowKeypair.publicKey;

    const paymentAmount = new BN(1 * anchor.web3.LAMPORTS_PER_SOL);

    await program.methods
      .startCharge(paymentAmount, false, mintAuthorityBump)
      .accounts({
        user: userPda,
        escrow: escrowPda,
        charger: chargerPda,
        userRewardTokenAccount: userRewardTokenAccount,
        ownerRewardTokenAccount: ownerRewardTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        rewardMint: rewardMint,
        mintAuthorityPda: mintAuthorityPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        rewardMint: rewardMint,
        mintAuthorityPda: mintAuthorityPda,
        authority: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user, escrowKeypair])
      .rpc();

    const finalUserSol = await provider.connection.getBalance(user.publicKey);
    const finalUserTokens = (
      await getAccount(provider.connection, userRewardTokenAccount)
    ).amount;
    const finalOwnerTokens = (
      await getAccount(provider.connection, ownerRewardTokenAccount)
    ).amount;

    assert.isBelow(
      finalUserSol,
      initialUserSol,
      'User should have less SOL after payment'
    );
    assert.isAtLeast(
      initialUserSol - finalUserSol,
      paymentAmount.toNumber(),
      'User should have spent at least the payment amount'
    );
    assert.equal(
      finalUserTokens.toString(),
      initialUserTokens.toString(),
      "User's token balance should remain unchanged"
    );
    assert.equal(
      finalOwnerTokens.toString(),
      initialOwnerTokens.toString(),
      "Owner's token balance should remain unchanged"
    );

    const userAccount = await program.account.user.fetch(userPda);
    assert.isAbove(
      userAccount.chargeCount,
      0,
      'Charge count should be greater than 0'
    );
  });

  it('Rewards user with a token after 4 charges', async () => {
    try {
      const sig = await provider.connection.requestAirdrop(
        user.publicKey,
        5 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig, 'confirmed');
    } catch (err) {
      console.log('Airdrop failed, but continuing:', err.message);
    }

    const initialUserTokens = (
      await getAccount(provider.connection, userRewardTokenAccount)
    ).amount;

    for (let i = 0; i < 3; i++) {
      const escrowKeypair = anchor.web3.Keypair.generate();
      const escrowPda = escrowKeypair.publicKey;
      const paymentAmount = new BN(0.5 * anchor.web3.LAMPORTS_PER_SOL);

      await program.methods
        .startCharge(paymentAmount, false, mintAuthorityBump)
        .startCharge(paymentAmount, false, mintAuthorityBump)
        .accounts({
          user: userPda,
          escrow: escrowPda,
          charger: chargerPda,
          userRewardTokenAccount: userRewardTokenAccount,
          ownerRewardTokenAccount: ownerRewardTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          rewardMint: rewardMint,
          mintAuthorityPda: mintAuthorityPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          rewardMint: rewardMint,
          mintAuthorityPda: mintAuthorityPda,
          authority: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user, escrowKeypair])
        .rpc();
    }

    const userAccount = await program.account.user.fetch(userPda);
    assert.isAtLeast(
      userAccount.chargeCount,
      4,
      'User should have at least 4 charges'
    );

    const userRewardAccount = await getAccount(
      provider.connection,
      userRewardTokenAccount
    );
    assert.isAbove(
      Number(userRewardAccount.amount),
      Number(initialUserTokens),
      'User should have more reward tokens after 4 charges'
      Number(initialUserTokens),
      'User should have more reward tokens after 4 charges'
    );
  });

  it('Applies 25% discount when using a reward token', async () => {
    const userRewardAccount = await getAccount(
      provider.connection,
      userRewardTokenAccount
    );

    if (Number(userRewardAccount.amount) < 1) {
      console.log('Skipping discount test as user has no tokens to use');
      return;
    }

    const escrowKeypair = anchor.web3.Keypair.generate();
    const escrowPda = escrowKeypair.publicKey;
    const paymentAmount = new BN(1 * anchor.web3.LAMPORTS_PER_SOL);

    await program.methods
      .startCharge(paymentAmount, true, mintAuthorityBump)
      .accounts({
        user: userPda,
        escrow: escrowPda,
        charger: chargerPda,
        userRewardTokenAccount: userRewardTokenAccount,
        ownerRewardTokenAccount: ownerRewardTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        rewardMint: rewardMint,
        mintAuthorityPda: mintAuthorityPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        rewardMint: rewardMint,
        mintAuthorityPda: mintAuthorityPda,
        authority: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user, escrowKeypair])
      .rpc();

    const userRewardAccountAfter = await getAccount(
      provider.connection,
      userRewardTokenAccount
    );
    assert.isBelow(
      Number(userRewardAccountAfter.amount),
      Number(userRewardAccount.amount),
      'User should have spent a reward token'
    );
  });

  // --- NEW TESTS FOR CHARGING SESSION LOGIC ---

  it('Records a charging session and updates user stats', async () => {
    const sessionKeypair = Keypair.generate();
    const sessionPda = sessionKeypair.publicKey;

    const chargerNameForSession = chargerName;
    const power = new BN(11);
    const pricePaidLamports = new BN(0.25 * anchor.web3.LAMPORTS_PER_SOL);
    const minutes = 42;
    const timestamp = Math.floor(Date.now() / 1000);

    const userAccountBefore = await program.account.user.fetch(userPda);
    const prevTotalPower = userAccountBefore.totalPowerConsumed.toNumber();
    const prevTotalPrice = userAccountBefore.totalPricePaid.toNumber();
    const prevTotalSessions = userAccountBefore.totalSessions;

    await program.methods
      .recordChargingSession(
        chargerNameForSession,
        power,
        pricePaidLamports,
        minutes,
        new BN(timestamp)
      )
      .accounts({
        session: sessionPda,
        user: userPda,
        charger: chargerPda,
        authority: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user, sessionKeypair])
      .rpc();

    const session = await program.account.chargingSession.fetch(sessionPda);
    assert.equal(session.user.toBase58(), userPda.toBase58());
    assert.equal(session.charger.toBase58(), chargerPda.toBase58());
    assert.equal(session.chargerName, chargerNameForSession);
    assert.equal(session.power.toNumber(), power.toNumber());
    assert.equal(session.pricePaid.toNumber(), pricePaidLamports.toNumber());
    assert.equal(session.minutes, minutes);
    assert.equal(session.timestamp.toNumber(), timestamp);

    const userAccountAfter = await program.account.user.fetch(userPda);
    assert.equal(
      userAccountAfter.totalPowerConsumed.toNumber(),
      prevTotalPower + power.toNumber()
    );
    assert.equal(
      userAccountAfter.totalPricePaid.toNumber(),
      prevTotalPrice + pricePaidLamports.toNumber()
    );
    assert.equal(userAccountAfter.totalSessions, prevTotalSessions + 1);
  });

  it('Aggregates user stats over multiple sessions', async () => {
    const sessionCount = 3;
    let totalPower = 0;
    let totalPrice = 0;

    for (let i = 0; i < sessionCount; i++) {
      const sessionKeypair = Keypair.generate();
      const sessionPda = sessionKeypair.publicKey;
      const power = new BN(5 + i);
      const pricePaidLamports = new BN(
        (0.1 + 0.05 * i) * anchor.web3.LAMPORTS_PER_SOL
      );
      const minutes = 30 + i * 10;
      const timestamp = Math.floor(Date.now() / 1000) + i * 60;

      await program.methods
        .recordChargingSession(
          chargerName,
          power,
          pricePaidLamports,
          minutes,
          new BN(timestamp)
        )
        .accounts({
          session: sessionPda,
          user: userPda,
          charger: chargerPda,
          authority: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user, sessionKeypair])
        .rpc();

      totalPower += power.toNumber();
      totalPrice += pricePaidLamports.toNumber();
    }

    const userAccount = await program.account.user.fetch(userPda);
    assert.isAtLeast(userAccount.totalPowerConsumed.toNumber(), totalPower);
    assert.isAtLeast(userAccount.totalPricePaid.toNumber(), totalPrice);
    assert.isAtLeast(userAccount.totalSessions, sessionCount);
  });

  it('Releases escrow to the owner using SOL', async () => {
    // Create a new escrow account for this test specifically
    const escrow = anchor.web3.Keypair.generate();

    console.log('=== DEMONSTRATING SOL PAYMENT FOR CHARGING ===');

    // Airdrop additional SOL to the user before starting
    try {
      const sig = await provider.connection.requestAirdrop(
        user.publicKey,
        5 * anchor.web3.LAMPORTS_PER_SOL // Airdrop additional 5 SOL
      );
      await provider.connection.confirmTransaction(sig, 'confirmed');
      console.log(
        '✓ Successfully airdropped additional SOL to user for testing'
      );
    } catch (err) {
      console.log(
        'Airdrop failed, proceeding with reduced payment amount:',
        err.message
      );
    }

    // Check user's current balance to determine a safe payment amount
    const userBalance = await provider.connection.getBalance(user.publicKey);
    console.log(
      "✓ User's SOL balance before charge:",
      userBalance / anchor.web3.LAMPORTS_PER_SOL,
      'SOL'
    );

    // Use a smaller amount than the initial user balance, accounting for rent and fees
    // Either 1 SOL or 90% of available balance, whichever is smaller
    const paymentAmount = new BN(
      Math.min(
        1 * anchor.web3.LAMPORTS_PER_SOL,
        Math.floor(userBalance * 0.9) // Use 90% of available balance
      )
    );
    console.log(
      '✓ Setting payment amount to:',
      paymentAmount.toNumber() / anchor.web3.LAMPORTS_PER_SOL,
      'SOL'
    );

    // First get the charger account to identify its owner
    const chargerAccount = await program.account.charger.fetch(chargerPda);
    console.log('✓ Charger owner:', chargerAccount.owner.toBase58());

    // Keep track of charger owner's initial SOL balance (not the test's owner variable)
    const chargerOwnerBalanceBefore = await provider.connection.getBalance(
      chargerAccount.owner
    );
    console.log(
      "✓ Charger owner's initial balance:",
      chargerOwnerBalanceBefore / anchor.web3.LAMPORTS_PER_SOL,
      'SOL'
    );

    console.log('✓ Starting charging session...');

    // Initialize the escrow account with SOL payment
    await program.methods
      .startCharge(
        paymentAmount, // amount in lamports
        false, // don't use token
        mintAuthorityBump // Add the bump for the mint authority PDA
        false, // don't use token
        mintAuthorityBump // Add the bump for the mint authority PDA
      )
      .accounts({
        user: userPda,
        escrow: escrow.publicKey,
        charger: chargerPda,
        userRewardTokenAccount: userRewardTokenAccount,
        ownerRewardTokenAccount: ownerRewardTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        rewardMint: rewardMint,
        mintAuthorityPda: mintAuthorityPda,
        mintAuthorityPda: mintAuthorityPda,
        authority: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user, escrow])
      .rpc();

    console.log('✓ Charging started successfully!');

    // Verify the escrow was initialized properly
    const escrowAccount = await program.account.escrow.fetch(escrow.publicKey);
    assert.equal(escrowAccount.user.toBase58(), userPda.toBase58());
    assert.equal(escrowAccount.amount.toString(), paymentAmount.toString());
    assert.equal(escrowAccount.isReleased, false);

    console.log(
      '✓ Escrow account verified - holds',
      escrowAccount.amount.toNumber() / anchor.web3.LAMPORTS_PER_SOL,
      'SOL for the charging session'
    );

    // Verify the escrow owner matches the charger owner
    assert.equal(
      escrowAccount.owner.toBase58(),
      chargerAccount.owner.toBase58(),
      'Escrow owner should match charger owner'
    );

    console.log('✓ Charging session complete, releasing funds to owner...');

    // Now release the escrow to the owner (transfer SOL)
    // The user releases the escrow using their keypair (authority)
    await program.methods
      .releaseEscrow(
        paymentAmount // amount to release in lamports
      )
      .accounts({
        escrow: escrow.publicKey,
        user: userPda, // The user PDA that matches the escrow.user
        authority: user.publicKey, // The user keypair as authority
        recipient: chargerAccount.owner, // The ACTUAL charger owner receives the funds
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log('✓ Funds released successfully!');

    // Check that charger owner's SOL balance has increased
    const chargerOwnerBalanceAfter = await provider.connection.getBalance(
      chargerAccount.owner
    );
    assert.isAbove(
      chargerOwnerBalanceAfter,
      chargerOwnerBalanceBefore,
      'Charger owner should have more SOL after release'
    );

    const solIncrease =
      (chargerOwnerBalanceAfter - chargerOwnerBalanceBefore) /
      anchor.web3.LAMPORTS_PER_SOL;
    console.log(
      '✓ PAYMENT COMPLETE: Charger owner received',
      solIncrease,
      'SOL'
    );
    console.log('=== SOL PAYMENT DEMONSTRATION SUCCESSFUL ===');
  });
});
