import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";




<<<<<<< HEAD
export function useBalance() {
  const [balance, setBalance] = useState<number>(0);
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  console.log("public key is ", publicKey)
  console.log("connected is ", connected)
  console.log("balance is ", balance)

  useEffect(() => {
    const fetchBalance = async () => {
      if (connected && publicKey) {
=======
export function useBalance(){
    const [balance, setBalance] = useState<number>(0);
    const {publicKey, connected} = useWallet();
    const {connection} = useConnection();

    useEffect(() => {
        const fetchBalance = async () => {
            if (connected && publicKey) {
>>>>>>> 63a5bdc0a0e226096a9976b7fb5173b8de9fb92b
        try {
          const lamports = await connection.getBalance(new PublicKey(publicKey));
          const sol = lamports / 1e9; // convert lamports to SOL
          setBalance(sol);
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance(0);
        }
      }
<<<<<<< HEAD
    }

    fetchBalance();
  }, [])

  return {
    publicKey,
    balance
  }

=======
        }

        fetchBalance();
    }, [])

    return {
        publicKey,
        balance
    }

>>>>>>> 63a5bdc0a0e226096a9976b7fb5173b8de9fb92b
}