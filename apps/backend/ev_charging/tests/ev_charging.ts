import * as dotenv from 'dotenv';
dotenv.config();

import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import * as evCharging from '../target/types/ev_charging.ts';
import BN from 'bn.js';
import { assert } from 'chai';

describe('ev_charging', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.EvCharging as Program<evCharging.EvCharging>;

  const chargerName = 'Charger ' + Date.now();
  let chargerPda: anchor.web3.PublicKey;
  let bump: number;

  it('Creates a charger account', async () => {
    [chargerPda, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(chargerName)],
      program.programId
    );

    await program.methods
      .createCharger(
        chargerName,
        '1234 Street',
        'CityName',
        'StateName',
        '12345',
        'Fast charging station',
        'Type1',
        new BN(5000), // power
        new BN(2000), // price in cents (e.g., $20.00)
        'TypeA, TypeB'
      )
      .accounts({
        charger: chargerPda,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const chargerAccount = await program.account.charger.fetch(chargerPda);
    // console.log(typeof chargerAccount.price, chargerAccount.price);

    assert.equal(
      chargerAccount.owner.toBase58(),
      provider.wallet.publicKey.toBase58()
    );
    assert.equal(chargerAccount.name, chargerName);
    assert.equal(chargerAccount.power.toNumber(), 5000);
    assert.equal(chargerAccount.price, 2000); // cents
  });

  // Uncomment and implement this only if you add updateCharger to your Rust program

  it('Updates the charger account', async () => {
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
        new BN(2550), // $25.50
        'TypeC, TypeD'
      )
      .accounts({
        charger: chargerPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    const updatedCharger = await program.account.charger.fetch(chargerPda);

    assert.equal(updatedCharger.address, '5678 New Street');
    assert.equal(updatedCharger.city, 'NewCity');
    assert.equal(updatedCharger.power.toNumber(), 6000);
    assert.equal(updatedCharger.price, 2550);
  });
});
