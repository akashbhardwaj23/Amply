import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import { Borsh } from 'borsh';
import fs from 'fs';
import path from 'path';

const CHARGER_PROGRAM_ID = new PublicKey('YourProgramIdHere'); // Replace with your program ID
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const payer = Keypair.generate();
const chargerAccount = Keypair.generate();

// Define the Charger struct based on your smart contract
class Charger {
  owner: PublicKey;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  description: string;
  charger_type: string;
  power: number;
  price: number;
  connector_types: string;

  constructor(
    owner: PublicKey,
    name: string,
    address: string,
    city: string,
    state: string,
    zip: string,
    description: string,
    charger_type: string,
    power: number,
    price: number,
    connector_types: string
  ) {
    this.owner = owner;
    this.name = name;
    this.address = address;
    this.city = city;
    this.state = state;
    this.zip = zip;
    this.description = description;
    this.charger_type = charger_type;
    this.power = power;
    this.price = price;
    this.connector_types = connector_types;
  }
}

const chargerSchema = new Map([
  [Charger, {
    kind: 'struct',
    fields: [
      ['owner', 'pubkey'],
      ['name', 'string'],
      ['address', 'string'],
      ['city', 'string'],
      ['state', 'string'],
      ['zip', 'string'],
      ['description', 'string'],
      ['charger_type', 'string'],
      ['power', 'u64'],
      ['price', 'f64'],
      ['connector_types', 'string']
    ]
  }]
]);

// Serialize Charger data to send to the Solana program
function serializeCharger(charger: Charger): Buffer {
  const chargerBuffer = Borsh.serialize(chargerSchema, charger);
  return chargerBuffer;
}

// Create a new Charger account
async function createCharger() {
  const program = await loadProgram();
  const payerAccount = payer.publicKey;

  const charger = new Charger(
    payerAccount,
    'Charger 1',
    '1234 Street',
    'CityName',
    'StateName',
    '12345',
    'Fast charging station',
    'Type1',
    5000,
    20.0,
    'TypeA, TypeB'
  );

  const serializedCharger = serializeCharger(charger);
  
  const createChargerInstruction = new web3.TransactionInstruction({
    programId: CHARGER_PROGRAM_ID,
    keys: [
      { pubkey: payerAccount, isSigner: true, isWritable: false },
      { pubkey: chargerAccount.publicKey, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([Buffer.from([0]), serializedCharger])  // 0 indicates the "create" action
  });

  const transaction = new Transaction().add(createChargerInstruction);
  await sendTransaction(transaction);
}

// Update an existing Charger account
async function updateCharger() {
  const program = await loadProgram();
  const payerAccount = payer.publicKey;

  const updatedCharger = new Charger(
    payerAccount,
    'Updated Charger 1',
    '5678 Avenue',
    'NewCity',
    'NewState',
    '67890',
    'Updated fast charging station',
    'Type2',
    7000,
    25.0,
    'TypeC, TypeD'
  );

  const serializedCharger = serializeCharger(updatedCharger);

  const updateChargerInstruction = new web3.TransactionInstruction({
    programId: CHARGER_PROGRAM_ID,
    keys: [
      { pubkey: payerAccount, isSigner: true, isWritable: false },
      { pubkey: chargerAccount.publicKey, isSigner: false, isWritable: true },
    ],
    data: Buffer.concat([Buffer.from([1]), serializedCharger])  // 1 indicates the "update" action
  });

  const transaction = new Transaction().add(updateChargerInstruction);
  await sendTransaction(transaction);
}

// Send transaction and handle commitment
async function sendTransaction(transaction: Transaction) {
  const blockhash = await connection.getRecentBlockhash();
  transaction.recentBlockhash = blockhash.blockhash;
  transaction.feePayer = payer.publicKey;

  const signedTransaction = await payer.signTransaction(transaction);
  const transactionSignature = await connection.sendRawTransaction(signedTransaction.serialize());
  await connection.confirmTransaction(transactionSignature);
  console.log('Transaction confirmed:', transactionSignature);
}

// Load the program
async function loadProgram() {
  const wallet = new web3.Account(payer.secretKey);
  const provider = new Provider(connection, wallet, { commitment: 'confirmed' });
  return new Program(CHARGER_PROGRAM_ID, provider);
}

(async () => {
  // Airdrop some SOL to the payer for testing
  await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);

  // Wait for the airdrop to complete
  await connection.confirmTransaction(await connection.getLatestBlockhash());

  // Create charger
  await createCharger();
  
  // Update charger
  await updateCharger();
})();
