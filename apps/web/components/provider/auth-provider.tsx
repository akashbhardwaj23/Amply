"use client";

import { CivicAuthProvider } from "@civic/auth-web3/nextjs";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useMemo } from "react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {

    const walletModalProps = useMemo(
        () => ({
          featuredWallets: 5, // Show more wallets in the featured section
          showAllWallets: true, // Always show all available wallets in the modal
        }),
        []
      );

  

  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider {...walletModalProps}>
          <CivicAuthProvider>{children}</CivicAuthProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
