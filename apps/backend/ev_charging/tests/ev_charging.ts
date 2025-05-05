import * as dotenv from 'dotenv';
dotenv.config();

import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import * as evCharging from '../target/types/ev_charging.ts';
import BN from 'bn.js';

import { assert } from 'chai';

describe('ev_charging', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.EvCharging as Program<evCharging.EvCharging>;

  // PDA seeds and bump will be derived from charger name
  const chargerName = 'Charger 1';

  // PDA for the charger account
  let chargerPda: anchor.web3.PublicKey;
  let bump: number;

  it('Creates a charger account', async () => {
    [chargerPda, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(chargerName)],
      program.programId
    );

    // Call create_charger instruction
    await program.methods
      .createCharger(
        chargerName,
        '1234 Street',
        'CityName',
        'StateName',
        '12345',
        'Fast charging station',
        'Type1',
        new BN(5000),
        20.0,
        'TypeA, TypeB'
      )
      .accounts({
        charger: chargerPda,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Fetch the account and verify data
    const chargerAccount = await program.account.charger.fetch(chargerPda);

    assert.equal(
      chargerAccount.owner.toBase58(),
      provider.wallet.publicKey.toBase58()
    );
    assert.equal(chargerAccount.name, chargerName);
    assert.equal(chargerAccount.power.toNumber(), 5000);
    assert.equal(chargerAccount.price, 20.0);
  });

  it('Updates the charger account', async () => {
    // Call update_charger instruction
    await program.methods
      .updateCharger(
        chargerName,
        '5678 New Street',
        'NewCity',
        'NewState',
        '67890',
        'Updated description',
        'Type2',
        new BN(6000),
        25.5,
        'TypeC, TypeD'
      )
      .accounts({
        charger: chargerPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Fetch the updated account and verify changes
    const updatedCharger = await program.account.charger.fetch(chargerPda);

    assert.equal(updatedCharger.address, '5678 New Street');
    assert.equal(updatedCharger.city, 'NewCity');
    assert.equal(updatedCharger.power.toNumber(), 6000);
    assert.equal(updatedCharger.price, 25.5);
  });
});
