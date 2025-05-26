'use client';

import { useEffect, useState } from 'react';
import { ChargeButton } from '@/components/ChargeButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Battery,
  Calendar,
  ChartCandlestick,
  Clock,
  CreditCard,
  History,
  MapPin,
  Zap,
} from 'lucide-react';
import { useUser } from '@civic/auth-web3/react';
import { fetchChargerData } from '@/app/server/charger';
import { Loader } from '@/components/ui/loader';
import { ChargerType, PhantomProvider } from '@/types';
import SelectChargeButton from '@/components/select-charger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useBalance } from '@/hooks/usebalance';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { redirect, useRouter } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  AnchorProvider,
  Program,
  setProvider,
  web3,
  BN,
  Idl,
} from '@coral-xyz/anchor';
import idl from '@/idl/ev_charging.json';
import { getTokenBal } from '@/utils/TokenBal';
import Image from "next/image";
import { PublicKey } from '@solana/web3.js';

const getPhantomProvider = (): PhantomProvider | undefined => {
  if (typeof window !== 'undefined' && 'solana' in window) {
    const provider = (window as any).solana as PhantomProvider;
    if (provider.isPhantom) return provider;
  }
  window.open('https://phantom.app/', '_blank');
  return undefined;
};
const mintAddress = new web3.PublicKey(
  'HYbi3JvAQNDawVmndhqaDQfBaZYzW8FxsAEpTae3mzrm'
);
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

const DashBoardPage = () => {
  const [cData, setCData] = useState<ChargerType[]>();
  const [selectedCharger, setSelectedCharger] = useState<ChargerType>();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [viewAll, setViewAll] = useState(false);
  const [isCharging, setIsCharging] = useState(() => {
    return localStorage.getItem('isCharging') === 'true';
  });
  const [tokenBalance, setTokenBalance] = useState(null);
  const { balance } = useBalance();
  const [program, setProgram] = useState<Program<Idl> | null>(null);
  const [phantom, setPhantom] = useState<PhantomProvider | undefined>();
  const [totals, setTotals] = useState({
    totalEnergy: 0,
    totalSpent: 0,
    totalSessions: 0,
  });
  const [useToken, setUseToken] = useState(false);
  const userPublicKey = phantom?.publicKey;

  useEffect(() => {
    if (!sessions) return;

    let totalEnergy = 0;
    let totalSpent = 0;

    sessions.forEach(({ account }) => {
      totalEnergy += account.power.toNumber(); // e.g., in kWh
      totalSpent += account.pricePaid.toNumber() / 1e9; // if solSpent is in lamports, convert to SOL
    });

    setTotals({
      totalEnergy,
      totalSpent,
      totalSessions: sessions.length,
    });
  }, [sessions]);

  const router = useRouter();

  const handleSessionRecorded = (session: any) => {
    setSessions((prev) => [...prev, session]);
  };

  useEffect(() => {
    const getCharger = async () => {
      setLoading(true);
      const chargerData = await fetchChargerData();
      setCData(chargerData);
      setLoading(false);
    };
    getCharger();
  }, []);

  useEffect(() => {
    if (!cData) return;
    const storedKey = localStorage.getItem('selectedCharger');
    if (storedKey) {
      const found = cData.find((c) => c.publicKey.toBase58() === storedKey);
      if (found) setSelectedCharger(found);
    }
  }, [cData]);

  useEffect(() => {
    if (!isCharging) {
      setSelectedCharger(undefined);
      localStorage.removeItem('selectedCharger');
    }
  }, [isCharging]);

  // useEffect(() => {
  //   localStorage.setItem('isCharging', JSON.stringify(isCharging));
  // }, [isCharging]);

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

  useEffect(() => {
    const fetchSessions = async () => {
      if (!program || !phantom?.publicKey) return;
      // Fetch all sessions for this wallet
      const allSessions = await program.account.chargingSession.all([
        {
          memcmp: {
            offset: 8, // user is first field after discriminator
            bytes: phantom.publicKey.toBase58(),
          },
        },
      ]);
      // console.log('allSessio', allSessions);
      setSessions(allSessions);
    };

    fetchSessions();
  }, [program, phantom]);

  const handleSelectCharger = (charger: ChargerType) => {
    setSelectedCharger(charger);
    localStorage.setItem('selectedCharger', charger.publicKey.toBase58());
  };

  // async function showBalance() {
  //   const { uiAmount, rawAmount } = await getTokenBal(
  //     connection,
  //     phantom?.publicKey,
  //     'REWARD_MINT'
  //   );
  //   console.log('Token balance:', uiAmount, 'Raw:', rawAmount);
  // }
  // showBalance();
  const fetchBalance = async () => {
    if (!phantom?.publicKey || !mintAddress) return;
    const result = await getTokenBal(connection, userPublicKey, mintAddress);
    setTokenBalance(result.uiAmount || 0);
  };

  useEffect(() => {
    fetchBalance();
  }, [userPublicKey, mintAddress]);

  useEffect(() => {
    if ((tokenBalance ?? 0) < 1 && useToken) {
      setUseToken(false);
    }
  }, [tokenBalance, useToken]);

  // console.log('cData', cData);
  const { user, isLoading } = useUser();

  // if (!user) {
  //   return <div>User Not Found</div>;
  // }

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center h-72">
        <Loader />
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <span>Please Connect Your Wallet</span>
        <Button onClick={() => router.push('/')}>Go Back</Button>
      </div>
    );
  }

  // console.log('session is ', session);
function mapSessionToUI(session) {
  let timestampNum = 0;
  if (session.timestamp) {
    if (typeof session.timestamp.toNumber === 'function') {
      timestampNum = session.timestamp.toNumber();
    } else if (typeof session.timestamp === 'number') {
      timestampNum = session.timestamp;
    } else {
      timestampNum = Number(session.timestamp);
    }
  }
  // Always use .toString() and BigInt for u64 fields
  const originalPriceLamports = BigInt(session.originalPrice?.toString?.() || session.originalPrice || "0");
  const usedToken = !!session.usedToken;
  const power = session.power?.toString?.() || String(session.power || 0);
  const discountLamports = BigInt(0.1 * LAMPORTS_PER_SOL);

  // Calculate discounted price in frontend if token used
  const discountedPriceLamports = usedToken
    ? (originalPriceLamports > discountLamports
        ? originalPriceLamports - discountLamports
        : BigInt(0))
    : originalPriceLamports;

  return {
    id: timestampNum.toString(),
    location: session.chargerName || '',
    date: new Date(timestampNum).toLocaleString(),
    duration: `${session.minutes ?? ''} min`,
    cost: `${Number(discountedPriceLamports) / LAMPORTS_PER_SOL} SOL`,
    originalCost: usedToken
      ? `${Number(originalPriceLamports) / LAMPORTS_PER_SOL} SOL`
      : undefined,
    discounted: usedToken,
    energy: `${power} Wh`,
  };
}




  const originalPriceLamports = selectedCharger?.account.price || 0;
  const discountLamports = 0.1 * LAMPORTS_PER_SOL;
  const discountedPriceLamports = useToken
    ? Math.max(0, originalPriceLamports - discountLamports)
    : originalPriceLamports;

  const originalPriceSOL = originalPriceLamports / LAMPORTS_PER_SOL;
  const discountedPriceSOL = discountedPriceLamports / LAMPORTS_PER_SOL;
  const amountInLamports = new BN(selectedCharger?.account.price);

  return (
    <div className="p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <Button variant="outline" size="sm">
              <History className="mr-2 h-4 w-4" />
              View All Activity
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback><Image className="backdrop-blur-md inset-2" src={"/avatar.svg"} width={50} height={50} alt={user?.name?.slice(0,2) || "An"} /></AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{user?.name}</CardTitle>
                    <CardDescription>{user?.email}</CardDescription>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3">
                    Edit Profile
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-3xl">Profile</DialogTitle>
                    </DialogHeader>

                    <div className="flex items-center space-x-2">
                      <div className="grid flex-1 gap-2">
                        <label htmlFor="name">Name : </label>
                        <Input id="name" defaultValue={user?.name} readOnly />
                        <label htmlFor="email">Email : </label>
                        <Input id="email" defaultValue={user?.email} readOnly />

                        <div className="flex justify-end mt-4">
                          <Button variant={'outline'}>Save</Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="mr-4 rounded-full bg-rose-100 p-2 dark:bg-rose-900">
                    <CreditCard className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Token Balance</p>
                    <p className="text-2xl font-bold">
                      {/* {{balance ?? "Loading..."} || 0} SOL */}
                      {/* {tokenBalance ?? 'Loading...'} SOL */}
                      {tokenBalance?.toLocaleString(undefined, {
                        maximumFractionDigits: 9,
                      })}{' '}
                      APT
                    </p>
                  </div>

                  <div className="p-2 flex flex-col justify-between items-start gap-2">
                    <Label className="text-[10px]">Use the Token Balance</Label>
                    <Switch
                      className="text-primary bg-white"
                      checked={useToken}
                      onCheckedChange={setUseToken}
                      disabled={(tokenBalance ?? 0) < 1 || isCharging}
                    />
                  </div>
                </div>

                <div>
                  <Button
                    size="sm"
                    onClick={() => alert('Still in development!')}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Add Tokens
                  </Button>

                  {/* <p>
                    Price: {originalPriceSOL.toFixed(4)} SOL
                    {useToken && (
                      <>
                        {' '}
                        | With 1 token:{' '}
                        <strong>
                          {discountedPriceSOL.toFixed(4)} SOL
                        </strong>{' '}
                        (0.1 SOL discount)
                      </>
                    )}
                  </p> */}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="mr-4 rounded-full bg-rose-100 p-2 dark:bg-rose-900">
                    <ChartCandlestick className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Solana Balance</p>
                    <p className="text-2xl font-bold">{balance} SOL</p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="text-lg font-medium mb-3">
                  Previous Charging Sessions
                </h3>
                <div className="space-y-3">
                  {sessions
                    .sort(
                      (a, b) =>
                        (b.account.timestamp?.toNumber?.() ??
                          Number(b.account.timestamp)) -
                        (a.account?.timestamp?.toNumber?.() ??
                          Number(a.account.timestamp))
                    )
                    .slice(0, 4)
                    .map((s, i) => {
                      const uiSession = mapSessionToUI(s.account);
                      return (
                        <div
                          key={s.publicKey.toBase58()}
                          className="flex items-center justify-between bg-muted/50 p-3 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{uiSession.location}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="mr-1 h-3 w-3" />
                              <span>{uiSession.date}</span>
                              <span className="mx-2">•</span>
                              <Clock className="mr-1 h-3 w-3" />
                              <span>{uiSession.duration}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            {/* <p className="font-medium">{uiSession.cost}</p> */}
                            <p className="font-medium">
                              {uiSession.cost}
                              {uiSession.discounted && (
                                <span className="ml-2 text-xs text-green-600">(discounted)</span>
                              )}
                            </p>
                            {uiSession.discounted && uiSession.originalCost && (
                              <p className="text-xs text-muted-foreground line-through">
                                {uiSession.originalCost}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {uiSession.energy}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Charging Statistics</CardTitle>
              <CardDescription>
                Your charging activity over the past month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Energy
                  </p>
                  <p className="text-2xl font-bold">
                    {totals.totalEnergy.toFixed(2)} kWh
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Spent
                  </p>
                  <p className="text-2xl font-bold">
                    {totals.totalSpent.toFixed(2)} SOL
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Sessions</p>
                  <p className="text-2xl font-bold">{totals.totalSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nearby Charger</CardTitle>
              <CardDescription>
                Currently closest to your location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCharger ? (
                <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-lg border border-rose-200 dark:border-rose-800">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg overflow-wrap break-word">
                      {selectedCharger.account.name}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {/* {chargerData.status} */}
                      available
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <MapPin className="mr-1 h-4 w-4" />
                    <span>{selectedCharger.account.address}</span>
                    <span className="mx-2">•</span>
                    <span>{cData.distance || 0.3}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Power Output
                      </p>
                      <p className="font-medium">
                        {selectedCharger.account.power.toString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-medium">
                        {(
                          discountedPriceLamports / LAMPORTS_PER_SOL
                        ).toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        })}{' '}
                        SOL
                        {useToken && (
                          <span className="ml-2 text-xs text-green-600">
                            (discounted)
                          </span>
                        )}
                      </p>
                      {useToken && (
                        <p className="text-xs text-muted-foreground line-through">
                          {(
                            originalPriceLamports / LAMPORTS_PER_SOL
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })}{' '}
                          SOL
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Connector Types
                      </p>
                      <p className="font-medium">
                        {selectedCharger.account.chargerType}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Availability
                      </p>
                      <p className="font-medium">
                        {/* {chargerData.currentUsers}/{chargerData.maxUsers} in use */}
                      </p>
                    </div>
                  </div>

                  <ChargeButton
                    isCharging={isCharging}
                    charger={selectedCharger}
                    onSessionRecorded={handleSessionRecorded}
                    setIsCharging={setIsCharging}
                    useToken={useToken}
                    amountInLamports={amountInLamports}
                    fetchBalance={fetchBalance}
                  />
                </div>
              ) : (
                <div className="bg-rose-50 text-primary dark:bg-rose-950/20 p-4 rounded-lg border border-rose-200 dark:border-rose-800">
                  No Selected Charger
                </div>
              )}
            </CardContent>

            <div className="space-y-6">
              <CardContent>
                {cData &&
                  cData.map((charger, idx) =>
                    viewAll ? (
                      <SelectChargeButton
                        key={idx}
                        charger={charger}
                        isCharging={isCharging}
                        setSelectedCharger={handleSelectCharger}
                      />
                    ) : (
                      idx < 4 && (
                        <SelectChargeButton
                          key={idx}
                          charger={charger}
                          isCharging={isCharging}
                          setSelectedCharger={handleSelectCharger}
                        />
                      )
                    )
                  )}
                <div className="flex justify-end items-center p-4">
                  <Button
                    variant={'ghost'}
                    onClick={() => setViewAll((prev) => !prev)}
                  >
                    {viewAll ? 'View Less' : 'View All'}
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Charging Rewards</CardTitle>
              <CardDescription>
                Earn tokens with every charge. Coming Soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Battery className="mr-2 h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">Next Reward</span>
                  </div>
                  <span className="font-bold">5.0 SOL</span>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm mb-2">
                    Refer friends and earn 10 SOL for each new user who
                    completes their first charging session.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Share Referral Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashBoardPage;
