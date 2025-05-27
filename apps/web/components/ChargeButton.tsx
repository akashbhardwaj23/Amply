'use client';

import { useEffect, useState, useRef, Dispatch, SetStateAction } from 'react';
import {
  web3,
  BN,
  Program,
  AnchorProvider,
  setProvider,
  getProvider,
} from '@coral-xyz/anchor';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import {
  PublicKey,
  Connection,
  clusterApiUrl,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
// import { toast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";
import { PlugZap, Zap } from "lucide-react";
import idl from "@/idl/ev_charging.json";
import { Card, CardContent } from "./ui/card";
import { ChargerType } from "@/types";
import { Label } from "./ui/label";
import { toast } from "./ui/use-toast";
import { getTokenBal } from "@/utils/TokenBal";
import { getPhantomProvider } from "@/utils/utils";

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: web3.PublicKey;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  on: (event: string, handler: (args: any) => void) => void;
  request: (method: string, params: any) => Promise<any>;
}

const PROGRAM_ID = new web3.PublicKey(idl.address);
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const SYSTEM_PROGRAM_ID = web3.SystemProgram.programId;
const TOKEN_PROGRAM_ID = new web3.PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
);
const REWARD_MINT = new web3.PublicKey(
  'HYbi3JvAQNDawVmndhqaDQfBaZYzW8FxsAEpTae3mzrm'
);

// No Need for this functions


// const getPhantomProvider = (): PhantomProvider | undefined => {
//   if (typeof window !== "undefined" && "solana" in window) {
//     const provider = (window as any).solana as PhantomProvider;
//     if (provider.isPhantom) return provider;
//   }
//   window.open("https://phantom.app/", "_blank");
//   return undefined;
// };

async function createAtaWithRetry(
  payer: web3.PublicKey,
  ataAddress: web3.PublicKey,
  owner: web3.PublicKey,
  mint: web3.PublicKey,
  connection: web3.Connection,
  wallet: PhantomProvider,
  maxRetries = 1
) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const tx = new web3.Transaction().add(
        createAssociatedTokenAccountInstruction(payer, ataAddress, owner, mint)
      );
      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = latestBlockhash.blockhash;
      tx.feePayer = payer;
      const signedTx = await wallet.signTransaction(tx);
      const signature = await connection.sendRawTransaction(
        signedTx.serialize()
      );
      await connection.confirmTransaction(signature, 'confirmed');
      return signature;
    } catch (err) {
      attempt++;
      console.error(`ATA creation attempt ${attempt} failed:`, err);
      if (attempt >= maxRetries) throw err;
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
}

export function ChargeButton({
  isCharging,
  charger,
  setIsCharging,
  onSessionRecorded,
  useToken,
  amountInLamports,
  fetchBalance,
}: {
  isCharging: boolean;
  charger: ChargerType;
  setIsCharging: Dispatch<SetStateAction<boolean>>;
  onSessionRecorded: any;
  useToken: boolean;
  amountInLamports: number;
  fetchBalance: Promise<void>;
}) {
  const [progress, setProgress] = useState(0);
  const [phantom, setPhantom] = useState<PhantomProvider | undefined>();
  const [program, setProgram] = useState<Program | null>(null);

  // console.log('charger ', charger);

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
          'https://api.devnet.solana.com',
          'confirmed'
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
        console.error('Wallet connection failed', err);
        toast({
          title: 'Wallet Not Connected',
          variant: 'destructive',
        });
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (isCharging) {
      const chargingStart = Number(localStorage.getItem('chargingStart'));
      const chargingDuration = Number(localStorage.getItem('chargingDuration'));
      const escrowPDAString = localStorage.getItem('escrowPDA');
      const chargerPubkeyString = localStorage.getItem('chargerPubkey');
      const amountInLamportsString = localStorage.getItem('amountInLamports');

      if (
        !chargingStart ||
        !chargingDuration ||
        !escrowPDAString ||
        !chargerPubkeyString ||
        !amountInLamportsString
      ) {
        setProgress(0);
        return;
      }

      const escrowPDA = new web3.PublicKey(escrowPDAString);
      const chargerPubkey = new web3.PublicKey(chargerPubkeyString);
      const amountInLamports = new BN(amountInLamportsString);

      const updateProgress = () => {
        const elapsed = Date.now() - chargingStart;
        const newProgress = Math.min(100, (elapsed / chargingDuration) * 100);
        setProgress(newProgress);

        if (newProgress >= 90) {
          handleReleaseEscrow(escrowPDA, chargerPubkey, amountInLamports);
        }
      };

      updateProgress();
      const interval = setInterval(updateProgress, 1000);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
      localStorage.removeItem('chargingStart');
      localStorage.removeItem('chargingDuration');
      localStorage.removeItem('escrowPDA');
      localStorage.removeItem('chargerPubkey');
      localStorage.removeItem('amountInLamports');
    }
  }, [isCharging]);

  // Main charge handler
  const MAX_RETRIES = 1;
  const RETRY_DELAY_MS = 2000; // 2 seconds

  // const discountLamports = 0.0000001 * LAMPORTS_PER_SOL; // 0.1 SOL discount
  // const discountLamports = 0.1 * LAMPORTS_PER_SOL; // 0.1 SOL discount

  const handleCharge = async () => {
    if (isCharging) return;
    if (!program || !phantom || !phantom.publicKey) {
      console.error('Wallet not connected');
      return;
    }

    setIsCharging(true);
    localStorage.setItem('isCharging', 'true');

    const userPublicKey = phantom.publicKey;

    // Calculate discounted amount in lamports
    const originalPriceLamports = charger.account.price;

    // Wrap amount in BN for Anchor
    const amountInLamports = new BN(originalPriceLamports);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // 1. Derive user PDA
        const [userPDA] = await web3.PublicKey.findProgramAddress(
          [Buffer.from('user'), phantom.publicKey.toBuffer()],
          program.programId
        );

        // 2. Ensure user PDA is initialized
        let userAccount = null;
        try {
          userAccount = await program.account.user.fetchNullable(userPDA);
        } catch {
          userAccount = null;
        }
        if (!userAccount) {
          await program.methods
            .initializeUser()
            .accounts({
              user: userPDA,
              authority: phantom.publicKey,
              systemProgram: SYSTEM_PROGRAM_ID,
            })
            .rpc();
        }

        // 3. Charger public key
        const chargerPubkey = charger.publicKey;

        // 4. Owner public key
        const ownerPubkey = new web3.PublicKey(charger.account.owner);

        // 5. Derive user reward token account (ATA)
        const userRewardTokenAccount = await getAssociatedTokenAddress(
          REWARD_MINT,
          phantom.publicKey
        );
        let userRewardAccountInfo = await connection.getAccountInfo(
          userRewardTokenAccount
        );
        if (!userRewardAccountInfo) {
          await createAtaWithRetry(
            phantom.publicKey,
            userRewardTokenAccount,
            phantom.publicKey,
            REWARD_MINT,
            connection,
            phantom
          );
        }

        // 6. Derive owner reward token account (ATA)
        const ownerRewardTokenAccount = await getAssociatedTokenAddress(
          REWARD_MINT,
          ownerPubkey
        );
        let ownerRewardAccountInfo = await connection.getAccountInfo(
          ownerRewardTokenAccount
        );
        if (!ownerRewardAccountInfo) {
          await createAtaWithRetry(
            phantom.publicKey,
            ownerRewardTokenAccount,
            ownerPubkey,
            REWARD_MINT,
            connection,
            phantom
          );
        }

        // 7. Derive mint authority PDA and bump
        const [mintAuthorityPda, mintAuthorityBump] =
          await web3.PublicKey.findProgramAddress(
            [Buffer.from('mint-authority')],
            program.programId
          );

        // 8. Generate sessionId once as BN
        const sessionId = new BN(Date.now());
        const sessionIdLeBuffer = sessionId.toArrayLike(Buffer, 'le', 8);

        // 9. Derive escrow PDA
        const [escrowPDA] = await web3.PublicKey.findProgramAddress(
          [
            Buffer.from('escrow'),
            phantom.publicKey.toBuffer(),
            chargerPubkey.toBuffer(),
            sessionIdLeBuffer,
          ],
          program.programId
        );

        // 10. Check if escrow already exists
        const escrowAccount = await connection.getAccountInfo(escrowPDA);
        if (escrowAccount) {
          toast({
            variant: 'default',
            title: 'Already charged escrow',
            description: 'This charge has already been processed.',
          });
          setIsCharging(false);
          return;
        }

        // 11. Call startCharge with BN amount and useToken flag
        const signature = await program.methods
          .startCharge(amountInLamports, useToken, mintAuthorityBump, sessionId)
          .accounts({
            user: userPDA,
            escrow: escrowPDA,
            charger: chargerPubkey,
            userRewardTokenAccount,
            ownerRewardTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            rewardMint: REWARD_MINT,
            mintAuthorityPda,
            authority: phantom.publicKey,
            systemProgram: SYSTEM_PROGRAM_ID,
          })
          .rpc();

        // console.log('Transaction signature:', signature);

        // 12. Derive session PDA
        const [sessionPDA] = await web3.PublicKey.findProgramAddress(
          [
            Buffer.from('session'),
            phantom.publicKey.toBuffer(),
            sessionIdLeBuffer,
          ],
          program.programId
        );

        // 13. Record charging session
        await program.methods
          .recordChargingSession(
            charger.account.name,
            new BN(charger.account.power),
            amountInLamports,
            new BN(1),
            sessionId,
            new BN(charger.account.price),
            useToken
          )
          .accounts({
            session: sessionPDA,
            user: userPDA,
            charger: chargerPubkey,
            authority: phantom.publicKey,
            systemProgram: SYSTEM_PROGRAM_ID,
          })
          .rpc();


          console.log("prgram accounts ", program.account)

        const sessionAccount =
          await program.account.chargingSession.fetchNullable(sessionPDA);
        if (onSessionRecorded) {
          onSessionRecorded({
            publicKey: sessionPDA,
            account: sessionAccount,
          });
        }

        // 14. Start charging timer
        startChargingTimer(escrowPDA, chargerPubkey, amountInLamports);

        setIsCharging(true);
        break;
      } catch (err) {
        console.error(`Charge attempt ${attempt} failed`, err);
        setIsCharging(false);
        if (
          err?.message?.includes('already been processed') ||
          err?.transactionMessage?.includes('already been processed')
        ) {
          toast({
            variant: 'default',
            title: 'Transaction already processed',
            description: 'This transaction was already confirmed on-chain.',
          });
          setIsCharging(false);
          break;
        }

        if (attempt === MAX_RETRIES) {
          toast({
            variant: 'destructive',
            title: 'Charge failed',
            //@ts-ignore
            description: err.message || 'An error occurred during charging.',
          });
          setIsCharging(false);
          return;
        }

        await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      }
    }
  };

  // Charging timer to track progress and release escrow at 90%
  const startChargingTimer = (escrowPDA, chargerPubkey, amountInLamports) => {
    setProgress(0);
    const totalDuration = 1 * 60 * 1000;
    const chargingStart = Date.now();
    localStorage.setItem('chargingStart', chargingStart.toString());
    localStorage.setItem('chargingDuration', totalDuration.toString());
    const interval = 1000;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const newProgress = (elapsed / totalDuration) * 100;
      setProgress(newProgress);

      if (newProgress >= 90) {
        clearInterval(timer);
        handleReleaseEscrow(escrowPDA, chargerPubkey, amountInLamports);
      }
    }, interval);
  };

  // Release escrow when charging is 90% complete
  const handleReleaseEscrow = async (
    escrowPDA : web3.PublicKey,
    amountInLamports : string
  ) => {
    if (!program || !phantom || !phantom.publicKey) {
      setIsCharging(false);
      return;
    }

    try {
      // Derive user PDA again
      const [userPDA] = await web3.PublicKey.findProgramAddress(
        [Buffer.from('user'), phantom.publicKey.toBuffer()],
        program.programId
      );

      // Charger owner public key
      const chargerOwnerPubkey = new web3.PublicKey(
        charger.account.owner || phantom.publicKey
      );

      // Wrap amount in BN if needed
      const amountBN = BN.isBN(amountInLamports)
        ? amountInLamports
        : new BN(amountInLamports);

      await program.methods
        .releaseEscrow(amountBN)
        .accounts({
          escrow: escrowPDA,
          user: userPDA,
          authority: phantom.publicKey,
          recipient: chargerOwnerPubkey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      localStorage.setItem('isCharging', 'false');

      toast({
        variant: 'default',
        title: 'Escrow Released',
        description: 'Escrow Released Successfully',
      });
      setIsCharging(false);
      setProgress(100);
      await fetchBalance();
      setTimeout(() => setProgress(0), 1000);
    } catch (err) {
      console.error('Failed to release escrow', err);
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: 'Failed To release Escrow',
      });
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
        <span>{isCharging ? 'Charging...' : 'Start Charging'}</span>
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
