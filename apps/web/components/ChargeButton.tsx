"use client";

import { useEffect, useState, useRef, Dispatch, SetStateAction } from "react";
import {
  web3,
  BN,
  Program,
  AnchorProvider,
  setProvider,
  getProvider,
} from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { PublicKey, Connection, clusterApiUrl, Keypair } from "@solana/web3.js";
// import { toast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";
import { PlugZap, Zap } from "lucide-react";
import idl from "@/idl/ev_charging.json";
import { Card, CardContent } from "./ui/card";
import { ChargerType } from "@/types";
import { Label } from "./ui/label";
import { toast } from "./ui/use-toast";

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: web3.PublicKey;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  on: (event: string, handler: (args: any) => void) => void;
  request: (method: string, params: any) => Promise<any>;
}

const PROGRAM_ID = new web3.PublicKey(idl.address);
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const SYSTEM_PROGRAM_ID = web3.SystemProgram.programId;
const TOKEN_PROGRAM_ID = new web3.PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
const REWARD_MINT = new web3.PublicKey(
  "DoEB6x9GozTZTbvN63pk8F5yrQChosm7aRA37eKPjwCH"
);

const getPhantomProvider = (): PhantomProvider | undefined => {
  if (typeof window !== "undefined" && "solana" in window) {
    const provider = (window as any).solana as PhantomProvider;
    if (provider.isPhantom) return provider;
  }
  window.open("https://phantom.app/", "_blank");
  return undefined;
};

export function ChargeButton({ charger }: { charger: ChargerType }) {
  const [isCharging, setIsCharging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phantom, setPhantom] = useState<PhantomProvider | undefined>();
  const [program, setProgram] = useState<Program | null>(null);
  const [escrowKeypair, setEscrowKeypair] = useState<web3.Keypair | null>(null);

  const escrowKeypairRef = useRef<web3.Keypair | null>(null);

  console.log("charger ", charger);

  // Initialize Phantom and Anchor program on mount
  useEffect(() => {
    const init = async () => {
      const phantomProvider = getPhantomProvider();
      if (!phantomProvider) {
        // toast.error('Phantom wallet not found, please install it.');
        return;
      }
      setPhantom(phantomProvider);

      try {
        await phantomProvider.connect();

        const connection = new web3.Connection(
          "https://api.devnet.solana.com",
          "confirmed"
        );
        const anchorProvider = new AnchorProvider(
          connection,
          phantomProvider as any,
          AnchorProvider.defaultOptions()
        );

        setProvider(anchorProvider); // sets global provider for Anchor
        const programInstance = new Program(idl, anchorProvider);
        setProgram(programInstance);
      } catch (err) {
        console.error("Wallet connection failed", err);
        // toast.error('Failed to connect Phantom wallet');
      }
    };
    init();
  }, []);

  // Main charge handler
  const handleCharge = async () => {
    if (!program || !phantom || !phantom.publicKey) {
      console.error("Wallet not connected");
      return;
    }

    setIsCharging(true);

    try {
      // 1. Derive user PDA
      const [userPDA] = await web3.PublicKey.findProgramAddress(
        [Buffer.from("user"), phantom.publicKey.toBuffer()],
        program.programId
      );

      // 2. Ensure user PDA is initialized
      let userAccount = null;
      try {
        userAccount = await program.account.user.fetchNullable(userPDA);
      } catch (e) {
        userAccount = null;
      }
      if (!userAccount) {
        console.log("User PDA not found, creating...");
        await program.methods
          .initializeUser()
          .accounts({
            user: userPDA,
            authority: phantom.publicKey,
            systemProgram: SYSTEM_PROGRAM_ID,
          })
          .rpc();
        console.log("User PDA created");
      }

      // 3. Generate escrow keypair for this charge session
      const escrow = web3.Keypair.generate();
      setEscrowKeypair(escrow);
      escrowKeypairRef.current = escrow;

      console.log("escow", escrow);
      console.log("escrowKeypair", escrowKeypairRef.current);

      // 4. Charger public key
      const chargerPubkey = charger.publicKey || charger.account.publicKey;

      // 5. Owner public key (from charger account)
      const ownerPubkey = new web3.PublicKey(charger.account.owner);

      // 6. Derive user reward token account (ATA)
      const userRewardTokenAccount = await getAssociatedTokenAddress(
        REWARD_MINT,
        phantom.publicKey
      );

      // Check if user ATA exists, create if missing
      const userRewardAccountInfo = await connection.getAccountInfo(
        userRewardTokenAccount
      );
      if (!userRewardAccountInfo) {
        console.log("User reward token account missing, creating...");
        const tx = new web3.Transaction().add(
          createAssociatedTokenAccountInstruction(
            phantom.publicKey, // payer
            userRewardTokenAccount, // ATA to create
            phantom.publicKey, // owner of ATA
            REWARD_MINT // mint
          )
        );

        // Fetch recent blockhash and set fee payer
        const latestBlockhash =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = latestBlockhash.blockhash;
        tx.feePayer = phantom.publicKey;

        // Sign transaction
        const signedTx = await phantom.signTransaction(tx);

        // Send transaction
        const signature = await connection.sendRawTransaction(
          signedTx.serialize()
        );

        // Confirm transaction
        await connection.confirmTransaction(signature, "confirmed");

        console.log("User reward token account created");
      }

      // 7. Derive owner reward token account (ATA)
      const ownerRewardTokenAccount = await getAssociatedTokenAddress(
        REWARD_MINT,
        ownerPubkey
      );

      // Check if owner ATA exists, create if missing
      const ownerRewardAccountInfo = await connection.getAccountInfo(
        ownerRewardTokenAccount
      );
      if (!ownerRewardAccountInfo) {
        console.log("Owner reward token account missing, creating...");
        const tx = new web3.Transaction().add(
          createAssociatedTokenAccountInstruction(
            phantom.publicKey, // payer (your wallet pays fees)
            ownerRewardTokenAccount, // ATA to create
            ownerPubkey, // owner of ATA
            REWARD_MINT // mint
          )
        );

        // Fetch recent blockhash and set fee payer
        const latestBlockhash =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = latestBlockhash.blockhash;
        tx.feePayer = phantom.publicKey;

        // Sign transaction
        const signedTx = await phantom.signTransaction(tx);

        // Send transaction
        const signature = await connection.sendRawTransaction(
          signedTx.serialize()
        );

        // Confirm transaction
        await connection.confirmTransaction(signature, "confirmed");

        console.log("Owner reward token account created");
      }

      // 8. Derive mint authority PDA and bump
      const [mintAuthorityPda, mintAuthorityBump] =
        await web3.PublicKey.findProgramAddress(
          [Buffer.from("mint-authority")],
          program.programId
        );

      // 9. Amount to charge (example: 1 SOL)
      const amountInLamports = new BN(
        Number(charger.account.price) * web3.LAMPORTS_PER_SOL
      );

      // 10. Call startCharge instruction
      await program.methods
        .startCharge(amountInLamports, false, mintAuthorityBump)
        .accounts({
          user: userPDA,
          escrow: escrow.publicKey,
          charger: chargerPubkey,
          userRewardTokenAccount,
          ownerRewardTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          rewardMint: REWARD_MINT,
          mintAuthorityPda,
          authority: phantom.publicKey,
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .signers([escrow])
        .rpc();

      // 11. Alert user that funds are transferred to escrow
      toast({
        variant: "default",
        title: "Funds transferred",
        description: "Funds transferred to escrow account!",
      });

      // 12. Start charging timer or any post-charge logic
      startChargingTimer();
    } catch (err) {
      console.error("Charge failed", err);
      setIsCharging(false);
    }
  };

  // Charging timer to track progress and release escrow at 90%
  const startChargingTimer = () => {
    const totalDuration = 1 * 60 * 1000; // 1 minute for demo
    const interval = 1000;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const newProgress = (elapsed / totalDuration) * 100;
      setProgress(newProgress);

      if (newProgress >= 90) {
        clearInterval(timer);
        handleReleaseEscrow();
      }
    }, interval);
  };

  // Release escrow when charging is 90% complete
  const handleReleaseEscrow = async () => {
    if (!program) {
      console.error("no program");
    }
    if (!phantom) {
      console.error("no phantom");
    }
    if (!phantom.publicKey) {
      console.error("no phantom.publicKey");
    }
    if (!escrowKeypairRef.current) {
      console.error("no escrowKeypair");
    }
    if (
      !program ||
      !phantom ||
      !phantom.publicKey ||
      !escrowKeypairRef.current
    ) {
      // toast.error('Missing required data to release escrow');
      console.error("error");
      setIsCharging(false);
      return;
    }
    try {
      // Derive user PDA again
      const [userPDA] = await web3.PublicKey.findProgramAddress(
        [Buffer.from("user"), phantom.publicKey.toBuffer()],
        program.programId
      );

      // Charger owner public key (adjust as needed)
      const chargerOwnerPubkey = new web3.PublicKey(
        charger.account.owner || phantom.publicKey
      );

      // Amount to release (same as charged amount)
      const amountInLamports = new BN(
        Number(charger.account.price) * web3.LAMPORTS_PER_SOL
      );

      await program.methods
        .releaseEscrow(amountInLamports)
        .accounts({
          escrow: escrowKeypairRef.current.publicKey,
          user: userPDA,
          authority: phantom.publicKey,
          recipient: chargerOwnerPubkey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      console.log("escrow realsed success");
      toast({
        variant: "default",
        title: "Escrow Released",
        description: "Escrow Released Successfully",
      });
      // toast.success('Escrow released successfully!');
      setIsCharging(false);
      setProgress(100);
    } catch (err) {
      console.error("Failed to release escrow", err);
      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: "Failed To release Escrow",
      });
      // toast.error('Failed to release escrow');
      setIsCharging(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleCharge}
        variant="default"
        className="px-8 w-full"
        disabled={isCharging}
      >
        <Zap className="mr-2 h-4 w-full" />
        <span>{isCharging ? "Charging..." : "Start Charging"}</span>
      </Button>

      {isCharging && (
        <div className="w-full bg-secondary rounded-full h-2.5 my-4">
          <div
            className="bg-green-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          />
          <p className="text-sm text-gray-500 mt-1">
            {progress.toFixed(0)}% complete
          </p>
        </div>
      )}
    </>
  );
}
