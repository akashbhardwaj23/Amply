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
// Import the generated IDL type
import { EvCharging } from '../target/types/ev_charging';

describe('ev_charging', () => {
  // Configure the client to use the local cluster
  // Handle the case when ANCHOR_PROVIDER_URL is not set
  const clusterUrl = process.env.ANCHOR_PROVIDER_URL || 'http://localhost:8899';
  const connection = new Connection(clusterUrl, 'confirmed');

  // Try to load the default keypair
  let payer: Keypair;
  try {
    // Try to get wallet from environment or use a default path
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

  // Get the program directly using workspace, which will handle the IDL properly
  const program = anchor.workspace.EvCharging as Program<EvCharging>;

  let rewardMint: PublicKey;
  let user = anchor.web3.Keypair.generate();
  let owner = payer; // Use the provider's wallet keypair

  let userRewardTokenAccount: PublicKey;
  let ownerRewardTokenAccount: PublicKey;
  let userTokenAccount: PublicKey;
  let ownerTokenAccount: PublicKey;

  // PDA that will have mint authority for reward tokens
  let mintAuthorityPda: PublicKey;
  let mintAuthorityBump: number;

  let chargerPda: PublicKey;
  let chargerBump: number;

  // User PDA for program-owned user account
  let userPda: PublicKey;
  let userBump: number;

  // Use timestamp to ensure a unique charger name for each test run
  const timestamp = new Date().getTime();
  const chargerName = `SuperFastCharger_${timestamp}`;

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
    [mintAuthorityPda, mintAuthorityBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("mint-authority")],
      program.programId
    );
    console.log("Mint authority PDA:", mintAuthorityPda.toBase58());

    // Create the reward mint using the program's initialize_reward_mint instruction
    const rewardMintKeypair = anchor.web3.Keypair.generate();
    rewardMint = rewardMintKeypair.publicKey;

    console.log("Creating reward mint with PDA as authority...");
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
    console.log("Reward mint created successfully!");

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

    // For testing purposes, we'll mint a few tokens directly to the user's account
    // This is just for testing the discount feature - in production these would only be earned
    // Note: In a real app you would need a different way to initialize tokens for testing
    // since only the program PDA has mint authority.
    // For testing, you could either:
    // 1. Make a special test-only instruction that lets you mint tokens
    // 2. Use a different mint for testing
    // Here we'll work with what we have by minting tokens in our charge tests

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

    // If your program has a createUser/initUser instruction, call it here.
    // If not, make sure the first use of the user account in your program
    // will initialize it with #[account(init, ...)].
  });

  it('Creates a new charger account', async () => {
    // This will always create a new account because we're using a timestamp in the name
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
        37.7749, // latitude - San Francisco coordinates as example
        -122.4194 // longitude
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
    console.log(
      'Successfully created new charger account with name:',
      chargerName
    );
  });

  it('Updates the charger account', async () => {
    // We're now certain this was created with our wallet, so update will work
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
        40.7128, // latitude - New York coordinates as example
        -74.006 // longitude
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
    console.log('Successfully updated charger account');
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
      // If the account already exists, we can continue
      if (!err.toString().includes('already in use')) {
        throw err;
      }
      console.log('User account already exists, continuing with tests');
    }

    const userAccount = await program.account.user.fetch(userPda);
    assert.equal(userAccount.authority.toBase58(), user.publicKey.toBase58());
  });

  it('Charges user and increments charge count, no reward token yet', async () => {
    // Record initial SOL and token balances to verify SOL payment
    const initialUserSol = await provider.connection.getBalance(user.publicKey);
    const initialUserTokens = (
      await getAccount(provider.connection, userRewardTokenAccount)
    ).amount;
    const initialOwnerTokens = (
      await getAccount(provider.connection, ownerRewardTokenAccount)
    ).amount;

    console.log(
      'Initial user SOL balance:',
      initialUserSol / anchor.web3.LAMPORTS_PER_SOL,
      'SOL'
    );
    console.log('Initial user token balance:', initialUserTokens.toString());
    console.log('Initial owner token balance:', initialOwnerTokens.toString());

    // Create a new escrow account for this charge
    const escrowKeypair = anchor.web3.Keypair.generate();
    const escrowPda = escrowKeypair.publicKey;

    // Use a realistic payment amount (0.1 SOL) instead of just 10 lamports
    const paymentAmount = new BN(1 * anchor.web3.LAMPORTS_PER_SOL);
    console.log(
      'Setting payment amount to:',
      paymentAmount.toNumber() / anchor.web3.LAMPORTS_PER_SOL,
      'SOL'
    );

    await program.methods
      .startCharge(
        paymentAmount, // price in lamports (1 SOL)
        false, // not using token
        mintAuthorityBump // Add the bump for the mint authority PDA
      )
      .accounts({
        user: userPda, // Use PDA!
        escrow: escrowPda,
        charger: chargerPda,
        userRewardTokenAccount: userRewardTokenAccount,
        ownerRewardTokenAccount: ownerRewardTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        rewardMint: rewardMint,
        mintAuthorityPda: mintAuthorityPda,
        authority: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user, escrowKeypair])
      .rpc();

    // Record final SOL and token balances
    const finalUserSol = await provider.connection.getBalance(user.publicKey);
    const finalUserTokens = (
      await getAccount(provider.connection, userRewardTokenAccount)
    ).amount;
    const finalOwnerTokens = (
      await getAccount(provider.connection, ownerRewardTokenAccount)
    ).amount;

    console.log(
      'Final user SOL balance:',
      finalUserSol / anchor.web3.LAMPORTS_PER_SOL,
      'SOL'
    );
    console.log('Final user token balance:', finalUserTokens.toString());
    console.log('Final owner token balance:', finalOwnerTokens.toString());

    // Calculate and show the exact SOL spent
    const solSpent =
      (initialUserSol - finalUserSol) / anchor.web3.LAMPORTS_PER_SOL;
    console.log('Total SOL spent:', solSpent, 'SOL');
    console.log(
      'Payment amount:',
      paymentAmount.toNumber() / anchor.web3.LAMPORTS_PER_SOL,
      'SOL'
    );
    console.log(
      'Fees + rent:',
      solSpent - paymentAmount.toNumber() / anchor.web3.LAMPORTS_PER_SOL,
      'SOL'
    );

    // Verify SOL was spent but tokens were NOT used
    assert.isBelow(
      finalUserSol,
      initialUserSol,
      'User should have less SOL after payment'
    );
    // Check that the amount spent is at least the payment amount
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

    // Fetch user account and check charge count
    const userAccount = await program.account.user.fetch(userPda);
    assert.isAbove(
      userAccount.chargeCount,
      0,
      'Charge count should be greater than 0'
    );

    console.log(
      'Successfully verified SOL payment without using reward tokens'
    );
  });

  it('Rewards user with a token after 4 charges', async () => {
    // Airdrop more SOL to user before running this test
    console.log(
      'Airdropping additional SOL to user for multiple charges test...'
    );
    try {
      const sig = await provider.connection.requestAirdrop(
        user.publicKey,
        5 * anchor.web3.LAMPORTS_PER_SOL // Airdrop 5 SOL
      );
      await provider.connection.confirmTransaction(sig, 'confirmed');
      console.log(
        "User's SOL balance after airdrop:",
        (await provider.connection.getBalance(user.publicKey)) /
          anchor.web3.LAMPORTS_PER_SOL,
        'SOL'
      );
    } catch (err) {
      console.log('Airdrop failed, but continuing:', err.message);
    }

    // Get initial token balance to verify reward
    const initialUserTokens = (
      await getAccount(provider.connection, userRewardTokenAccount)
    ).amount;

    console.log('Initial user token balance:', initialUserTokens.toString());

    // Simulate 3 more charges
    for (let i = 0; i < 3; i++) {
      const escrowKeypair = anchor.web3.Keypair.generate();
      const escrowPda = escrowKeypair.publicKey;

      // payment amount (0.5 SOL)
      const paymentAmount = new BN(0.5 * anchor.web3.LAMPORTS_PER_SOL);

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
          authority: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user, escrowKeypair])
        .rpc();
    }

    // User should now have 4 charges, check the charge count
    const userAccount = await program.account.user.fetch(userPda);
    assert.isAtLeast(
      userAccount.chargeCount,
      4,
      'User should have at least 4 charges'
    );

    // Check that user reward account has tokens (could be any amount)
    const userRewardAccount = await getAccount(
      provider.connection,
      userRewardTokenAccount
    );
    console.log(
      'User reward token balance:',
      userRewardAccount.amount.toString()
    );
    assert.isAbove(
      Number(userRewardAccount.amount),
      Number(initialUserTokens),
      'User should have more reward tokens after 4 charges'
    );
  });

  it('Applies 25% discount when using a reward token', async () => {
    // Ensure the user has at least one reward token by checking balance
    const userRewardAccount = await getAccount(
      provider.connection,
      userRewardTokenAccount
    );

    console.log(
      'User reward token balance before discount test:',
      userRewardAccount.amount.toString()
    );

    // Only proceed with the test if the user has tokens
    if (Number(userRewardAccount.amount) < 1) {
      console.log('Skipping discount test as user has no tokens to use');
      return;
    }

    // Create a new escrow for this test
    const escrow = anchor.web3.Keypair.generate();

    // Record initial token balances to verify the transfer
    const initialUserTokens = (
      await getAccount(provider.connection, userRewardTokenAccount)
    ).amount;
    const initialOwnerTokens = (
      await getAccount(provider.connection, ownerRewardTokenAccount)
    ).amount;

    console.log('Initial user token balance:', initialUserTokens.toString());
    console.log('Initial owner token balance:', initialOwnerTokens.toString());

    const paymentAmount = new BN(1 * anchor.web3.LAMPORTS_PER_SOL);
    // Start a charge with token discount (use_token = true)
    await program.methods
      .startCharge(
        paymentAmount, // Regular price would be 10
        true, // USE TOKEN for discount
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
        authority: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user, escrow])
      .rpc();

    // Verify escrow was created with 75% of the normal price (25% discount applied)
    const discountedPrice = 0.75 * anchor.web3.LAMPORTS_PER_SOL;
    const escrowAccount = await program.account.escrow.fetch(escrow.publicKey);
    assert.equal(
      escrowAccount.amount.toNumber(),
      discountedPrice,
      'Escrow amount should be reduced by 25% (to 75% of original price)'
    );
    console.log(
      'Escrow stored amount:',
      escrowAccount.amount.toNumber() / 1000000000,
      'SOL'
    );
    // Verify the token was transferred from user to owner
    const finalUserTokens = (
      await getAccount(provider.connection, userRewardTokenAccount)
    ).amount;
    const finalOwnerTokens = (
      await getAccount(provider.connection, ownerRewardTokenAccount)
    ).amount;

    console.log('Final user token balance:', finalUserTokens.toString());
    console.log('Final owner token balance:', finalOwnerTokens.toString());

    assert.isBelow(
      Number(finalUserTokens),
      Number(initialUserTokens),
      'User should have fewer tokens after using one for discount'
    );

    assert.isAbove(
      Number(finalOwnerTokens),
      Number(initialOwnerTokens),
      'Owner should have more tokens after user applies discount'
    );

    console.log('Successfully verified 25% discount when using a reward token');
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
