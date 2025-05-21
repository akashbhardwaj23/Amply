import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

/**
 * Fetches the SPL token balance for a user.
 * @param {Connection} connection - Solana connection object.
 * @param {string|PublicKey} userPublicKey - The user's wallet public key.
 * @param {string|PublicKey} mintAddress - The token mint address.
 * @returns {Promise<{ uiAmount: number|null, rawAmount: string }>}
 */
export async function getTokenBal(connection, userPublicKey, mintAddress) {
  const mint = new PublicKey(mintAddress);
  const user = new PublicKey(userPublicKey);

  // Find the associated token account for this user and mint
  const ata = await getAssociatedTokenAddress(mint, user);

  // Fetch the balance
  const tokenAccountInfo = await connection.getTokenAccountBalance(ata);

  return {
    uiAmount: tokenAccountInfo.value.uiAmount,
    rawAmount: tokenAccountInfo.value.amount,
  };
}
