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
import { PublicKey, Connection, clusterApiUrl, Keypair } from '@solana/web3.js';
// import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { PlugZap, Zap } from 'lucide-react';
import idl from '@/idl/ev_charging.json';
import { Card, CardContent } from './ui/card';
import { ChargerType } from '@/types';
import { Label } from './ui/label';
import { toast } from './ui/use-toast';

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

const getPhantomProvider = (): PhantomProvider | undefined => {
  if (typeof window !== 'undefined' && 'solana' in window) {
    const provider = (window as any).solana as PhantomProvider;
    if (provider.isPhantom) return provider;
  }
  window.open('https://phantom.app/', '_blank');
  return undefined;
};

async function createAtaWithRetry(
  payer,
  ataAddress,
  owner,
  mint,
  connection,
  wallet,
  maxRetries = 3
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
  charger,
  onSessionRecorded,
}: {
  charger: ChargerType;
}) {
  const [isCharging, setIsCharging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phantom, setPhantom] = useState<PhantomProvider | undefined>();
  const [program, setProgram] = useState<Program | null>(null);
  const [escrowKeypair, setEscrowKeypair] = useState<web3.Keypair | null>(null);

  const escrowKeypairRef = useRef<web3.Keypair | null>(null);

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
        // toast.error('Failed to connect Phantom wallet');
      }
    };
    init();
  }, []);

  // Main charge handler
  const handleCharge = async () => {
    console.log('runn');
    if (isCharging) return; // Prevent double submission
    if (!program || !phantom || !phantom.publicKey) {
      console.error('Wallet not connected');
      return;
    }

    setIsCharging(true);

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
      } catch (e) {
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
      const chargerPubkey = charger.publicKey || charger.account.publicKey;

      // 4. Owner public key (from charger account)
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

      // 8. Derive escrow PDA (NO Keypair, NO .signers)
      const [escrowPDA] = await web3.PublicKey.findProgramAddress(
        [
          Buffer.from('escrow'),
          phantom.publicKey.toBuffer(),
          chargerPubkey.toBuffer(),
        ],
        program.programId
      );

      // 9. Amount to charge
      const amountInLamports = charger.account.price;

      // 10. Call startCharge instruction (NO .signers)
      await program.methods
        .startCharge(amountInLamports, false, mintAuthorityBump)
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

      // 11. Record the charging session on-chain
      const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
      const [sessionPDA] = await web3.PublicKey.findProgramAddress(
        [
          Buffer.from('session'),
          phantom.publicKey.toBuffer(),
          Buffer.from(new BN(now).toArray('le', 8)),
        ],
        program.programId
      );

      await program.methods
        .recordChargingSession(
          charger.account.name,
          new BN(charger.account.power),
          new BN(amountInLamports),
          new BN(1),
          new BN(now)
        )
        .accounts({
          session: sessionPDA,
          user: userPDA,
          charger: chargerPubkey,
          authority: phantom.publicKey,
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .rpc();
      const sessionAccount =
        await program.account.chargingSession.fetch(sessionPDA);
      if (onSessionRecorded) {
        onSessionRecorded(sessionAccount);
      }
      console.log('recordChargingSession - Session Account:', sessionAccount);
      toast({
        variant: 'default',
        title: 'Funds transferred',
        description: 'Funds transferred to escrow account!',
      });

      startChargingTimer(escrowPDA, chargerPubkey, amountInLamports);
    } catch (err) {
      console.error('Charge failed', err);
      toast({
        variant: 'destructive',
        title: 'Charge failed',
        description: err.message || 'An error occurred during charging.',
      });
    }
  };

  // Charging timer to track progress and release escrow at 90%
  const startChargingTimer = (escrowPDA, chargerPubkey, amountInLamports) => {
    setProgress(0); // Reset at start
    const totalDuration = 1 * 60 * 1000;
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
    escrowPDA,
    chargerPubkey,
    amountInLamports
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

      await program.methods
        .releaseEscrow(amountInLamports)
        .accounts({
          escrow: escrowPDA,
          user: userPDA,
          authority: phantom.publicKey,
          recipient: chargerOwnerPubkey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      toast({
        variant: 'default',
        title: 'Escrow Released',
        description: 'Escrow Released Successfully',
      });
      setIsCharging(false);
      setProgress(100);
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
