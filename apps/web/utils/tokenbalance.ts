import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { web3 } from '@coral-xyz/anchor';

/**
 * Fetches the SPL token balance for a user.
 * @param {Connection} connection - Solana connection object.
 * @param {string|PublicKey} userPublicKey - The user's wallet public key.
 * @param {string|PublicKey} mintAddress - The token mint address.
 * @returns {Promise<{ uiAmount: number|null, rawAmount: string }>}
 */
export async function getTokenBal(connection : Connection, userPublicKey : {
    toBase58: () => string;
} | undefined, mintAddress : web3.PublicKey) {
  if (!userPublicKey ) {
    throw new Error('userPublicKey are required');
  }
  if ( !mintAddress) {
    throw new Error(' mintAddress are required');
  }
  
  const mint = new PublicKey(mintAddress);
  const user = new PublicKey(userPublicKey);

  // Find the associated token account for this user and mint
  const ata = await getAssociatedTokenAddress(mint, user);

  console.log("ata is ", ata)

  // Fetch the balance
  const tokenAccountInfo = await connection.getTokenAccountBalance(ata);

  return {
    uiAmount: tokenAccountInfo.value.uiAmount,
    rawAmount: tokenAccountInfo.value.amount,
  };
}
