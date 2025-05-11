'use client';

import { useEffect, useState } from 'react';
import {
  web3,
  BN,
  Program,
  AnchorProvider,
  setProvider,
  getProvider,
} from '@coral-xyz/anchor';
// import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { PlugZap } from 'lucide-react';
import idl from '@/idl/ev_charging.json';

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: web3.PublicKey;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  on: (event: string, handler: (args: any) => void) => void;
  request: (method: string, params: any) => Promise<any>;
}

const PROGRAM_ID = new web3.PublicKey(idl.address);
const TOKEN_PROGRAM_ID = new web3.PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
);

const getPhantomProvider = (): PhantomProvider | undefined => {
  if (typeof window !== 'undefined' && 'solana' in window) {
    const provider = (window as any).solana as PhantomProvider;
    if (provider.isPhantom) return provider;
  }
  window.open('https://phantom.app/', '_blank');
  return undefined;
};

export function ChargeButton({
  charger,
  setSelectedCharger,
}: {
  charger: any;
  setSelectedCharger: any;
}) {
  const [isCharging, setIsCharging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phantom, setPhantom] = useState<PhantomProvider | undefined>();
  const [program, setProgram] = useState<Program | null>(null);
  const [escrowKeypair, setEscrowKeypair] = useState<web3.Keypair | null>(null);

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
    if (!program || !phantom || !phantom.publicKey) {
      // toast.error('Wallet not connected');
      return;
    }
    setSelectedCharger(charger);
    setIsCharging(true);

    try {
      // Derive user PDA (adjust seeds as per your program)
      const [userPDA] = await web3.PublicKey.findProgramAddress(
        [Buffer.from('user'), phantom.publicKey.toBuffer()],
        program.programId
      );

      // Generate escrow keypair for this charge session
      const escrow = web3.Keypair.generate();
      setEscrowKeypair(escrow);
      console.log('charger:', charger);
      // charger.forEach((charger) => console.log(charger.publicKey));
      // Charger public key from props (adjust if needed)
      //   const chargerPubkey = new web3.PublicKey(charger.publicKey);
      let chargerPubkey: web3.PublicKey;

      try {
        chargerPubkey = new web3.PublicKey(charger.publicKey || charger.id);
      } catch (e) {
        console.error(
          'Invalid charger public key:',
          charger.publicKey || charger.id
        );
        //   toast.error('Invalid charger public key');
        return;
      }

      // Amount to charge (example: 1 SOL)
      const amountInLamports = new BN(1 * web3.LAMPORTS_PER_SOL);

      // Call start_charge instruction
      await program.methods
        .startCharge(amountInLamports, false)
        .accounts({
          user: userPDA,
          escrow: escrow.publicKey,
          charger: chargerPubkey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([escrow])
        .rpc();

      //   toast.success('Funds transferred to escrow!');
      startChargingTimer();
    } catch (err) {
      console.error('Charge failed', err);
      //   toast.error('Failed to transfer funds to escrow');
      setIsCharging(false);
    }
  };

  // Charging timer to track progress and release escrow at 90%
  const startChargingTimer = () => {
    const totalDuration = 5 * 60 * 1000; // 5 minutes for demo
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
    if (!program || !phantom || !phantom.publicKey || !escrowKeypair) {
      toast.error('Missing required data to release escrow');
      setIsCharging(false);
      return;
    }

    try {
      // Derive user PDA again
      const [userPDA] = await web3.PublicKey.findProgramAddress(
        [Buffer.from('user'), phantom.publicKey.toBuffer()],
        program.programId
      );

      // Charger owner public key (adjust as needed)
      const chargerOwnerPubkey = new web3.PublicKey(
        charger.owner || phantom.publicKey
      );

      // Amount to release (same as charged amount)
      const amountInLamports = new BN(1 * web3.LAMPORTS_PER_SOL);

      await program.methods
        .releaseEscrow(amountInLamports)
        .accounts({
          escrow: escrowKeypair.publicKey,
          user: userPDA,
          authority: phantom.publicKey,
          recipient: chargerOwnerPubkey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      toast.success('Escrow released successfully!');
      setIsCharging(false);
      setProgress(100);
    } catch (err) {
      console.error('Failed to release escrow', err);
      toast.error('Failed to release escrow');
      setIsCharging(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleCharge}
        variant="default"
        className="px-8"
        disabled={isCharging}
      >
        <PlugZap className="mr-2 h-4 w-4" />
        <span>{isCharging ? 'Charging...' : 'Charge'}</span>
      </Button>

      {isCharging && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div
            className="bg-green-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          />
          <p className="text-sm text-gray-500 mt-1">
            {progress.toFixed(0)}% complete
          </p>
        </div>
      )}
    </div>
  );
}
