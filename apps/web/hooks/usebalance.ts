import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";




export function useBalance(){
    const [balance, setBalance] = useState<number>(0);
    const {publicKey, connected} = useWallet();
    const {connection} = useConnection();

    useEffect(() => {
        const fetchBalance = async () => {
            if (connected && publicKey) {
        try {
          const lamports = await connection.getBalance(new PublicKey(publicKey));
          const sol = lamports / 1e9; // convert lamports to SOL
          setBalance(sol);
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance(0);
        }
      }
        }

        fetchBalance();
    }, [])

    return {
        publicKey,
        balance
    }

}