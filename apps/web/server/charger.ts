import {
  web3,
  AnchorProvider,
  Program,
  setProvider,
  getProvider,
  Wallet,
} from '@coral-xyz/anchor';
import idl from '@/idl/ev_charging.json';
import { getPhantomProvider } from '@/utils/utils';
import { ChargerType } from '@/types';

const network = 'https://api.devnet.solana.com';

const phantom = getPhantomProvider();

export async function fetchChargerData() {
  // Create a connection (no wallet needed for read-only)
  const connection = new web3.Connection(network, 'confirmed');
  const provider = new AnchorProvider(
    connection,
    phantom! as unknown as Wallet,
    AnchorProvider.defaultOptions()
  );
  setProvider(provider);
  console.log('555');
  const anchorProvider = getProvider();

  const program = new Program(idl, anchorProvider);
  console.log('programddmm', program);

  //@ts-ignore
  // Fetch all chargers (read-only, no wallet needed)
  const chargers = await program.account.charger.all();
  return chargers as ChargerType[];
}
