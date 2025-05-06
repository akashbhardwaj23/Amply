"use client"

import { CivicAuthProvider } from "@civic/auth-web3/nextjs"
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
    WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';

export default function AuthProvider({
    children
}: {
    children : React.ReactNode
}){
    return (
        <ConnectionProvider endpoint="https://api.devnet.solana.com">
           <WalletProvider wallets={[]} autoConnect>
            <WalletModalProvider>
            <CivicAuthProvider>
            {children}
        </CivicAuthProvider>
            </WalletModalProvider>
           </WalletProvider>
        </ConnectionProvider>
    )
}