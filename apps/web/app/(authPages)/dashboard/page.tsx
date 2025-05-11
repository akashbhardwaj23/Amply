'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { FieldErrors } from 'react-hook-form';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Check, MapPin } from 'lucide-react';

// --- Anchor/Solana Imports ---
import {
  web3,
  AnchorProvider,
  Program,
  setProvider,
  getProvider,
} from '@coral-xyz/anchor';
import BN from 'bn.js';
import idl from '@/idl/ev_charging.json'; // <--- adjust path if needed
import { Map, MapRef, Marker, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Label } from '@/components/ui/label';

// Program ID from your new IDL
const programId = new web3.PublicKey(idl.address);

const network = 'https://api.devnet.solana.com'; // or your cluster

const getPhantomProvider = (): PhantomProvider | undefined => {
  if (typeof window !== 'undefined' && 'solana' in window) {
    const provider = window.solana as PhantomProvider;
    if (provider.isPhantom) return provider;
  }
  window.open('https://phantom.app/', '_blank');
  return undefined;
};

const stationFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Station name must be at least 3 characters.' }),
  address: z
    .string()
    .min(5, { message: 'Address must be at least 5 characters.' }),
  city: z.string().min(2, { message: 'City is required.' }),
  state: z.string().min(2, { message: 'State is required.' }),
  zip: z.string().min(5, { message: 'ZIP code is required.' }),
  description: z.string().optional(),
  chargerType: z.enum(['level1', 'level2', 'dcFast', 'other'], {
    required_error: 'You need to select a charger type.',
  }),
  power: z.coerce.number().min(1, { message: 'Power must be at least 1 kW.' }),
  price: z.coerce
    .number()
    .min(0.01, { message: 'Price must be at least 0.01 SOL.' }),
  connectorTypes: z
    .string()
    .min(1, { message: 'At least one connector type is required.' }),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

type StationFormValues = z.infer<typeof stationFormSchema>;

interface ViewPortType {
  latitude: number;
  longitude: number;
}

export default function RegisterStationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const myMapRef = useRef<MapRef | null>(null);
  const [viewPort, setViewPort] = useState<ViewPortType>({
    latitude: 28.6448,
    longitude: 77.216721,
  });

  const form = useForm<StationFormValues>({
    resolver: zodResolver(stationFormSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      description: '',
      chargerType: 'level2',
      power: 7,
      price: 0.25,
      connectorTypes: 'Type 2',
      latitude: 28.6448,
      longitude: 77.216721,
    },
  });

  // --- Anchor integration onSubmit ---
  async function onSubmit(data: StationFormValues) {
    console.log('111');
    const phantom = getPhantomProvider();
    if (!phantom) {
      alert('Please install Phantom Wallet!');
      return;
    }

    try {
      await phantom.connect();

      const connection = new web3.Connection(network, 'confirmed');
      const provider = new AnchorProvider(
        connection,
        phantom,
        AnchorProvider.defaultOptions()
      );
      setProvider(provider);
      const anchorProvider = getProvider();
      const program = new Program(idl as any, programId, anchorProvider);

      // Find PDA for charger account
      const [chargerPda] = await web3.PublicKey.findProgramAddress(
        [Buffer.from(data.name)],
        programId
      );

      // Map charger type to display string
      const chargerTypeMap: { [key: string]: string } = {
        level1: 'Level 1 (120V)',
        level2: 'Level 2 (240V)',
        dcFast: 'DC Fast Charging',
        other: 'Other',
      };

      console.log('Charger PDA:', chargerPda.toBase58());
      console.log('Accounts:', {
        charger: chargerPda.toBase58(),
        payer: phantom.publicKey.toBase58(),
        systemProgram: web3.SystemProgram.programId.toBase58(),
      });

      await program.methods
        .createCharger(
          data.name,
          data.address,
          data.city,
          data.state,
          data.zip,
          data.description || '',
          chargerTypeMap[data.chargerType],
          new BN(data.power),
          new BN(data.price),
          data.connectorTypes,
          data.latitude,
          data.longitude
        )
        .accounts({
          charger: chargerPda,
          payer: phantom.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('Charger PDA:', chargerPda.toBase58());
      console.log('Accounts:', {
        charger: chargerPda.toBase58(),
        payer: phantom.publicKey.toBase58(),
        systemProgram: web3.SystemProgram.programId.toBase58(),
      });

      alert('Charger registered on Solana!');
      router.push('/register-station/success');
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Transaction Failed To Execute',
        description: err.message || err,
      });
    }
  }

  const handleDoubleClick = (e: MapLayerMouseEvent) => {
    e.preventDefault();
    setViewPort({
      latitude: e.lngLat.lat,
      longitude: e.lngLat.lng,
    });
    form.setValue('latitude', e.lngLat.lat);
    form.setValue('longitude', e.lngLat.lng);
  };

  function onError(errors: FieldErrors<StationFormValues>) {
    function getFirstErrorMessage(errors: FieldErrors<any>): string | null {
      for (const key in errors) {
        const errorOrNested = errors[key];
        if (!errorOrNested) continue;
        if (
          'message' in errorOrNested &&
          typeof errorOrNested.message === 'string'
        ) {
          return errorOrNested.message;
        }
        if (typeof errorOrNested === 'object') {
          const nestedMessage = getFirstErrorMessage(
            errorOrNested as FieldErrors<any>
          );
          if (nestedMessage) return nestedMessage;
        }
      }
      return null;
    }
    const message = getFirstErrorMessage(errors) || 'Please check all fields.';
    toast({
      variant: 'destructive',
      title: 'Form Error',
      description: message,
    });
  }

  // --- UI ---
  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            Register Your Charging Station
          </h1>
          <p className="text-muted-foreground">
            Join our network and start earning Solana tokens for every charging
            session
          </p>
        </div>

        {/* Progress Steps UI omitted for brevity */}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)}>
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Station Details</CardTitle>
                  <CardDescription>
                    Provide information about your charging station location
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* ...other fields... */}
                  <div className="flex justify-end">
                    <Button type="button" onClick={() => setStep(2)}>
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Station Map Details</CardTitle>
                  <CardDescription>
                    Provide Location information about your charging station
                  </CardDescription>
                </CardHeader>
                <div className="bg-muted rounded-lg overflow-hidden h-[600px] mb-4">
                  <div className="relative h-full w-full bg-gray-100 dark:bg-gray-800">
                    <Map
                      initialViewState={{
                        ...viewPort,
                        zoom: 14,
                      }}
                      interactive
                      id="mapStation"
                      onDblClick={handleDoubleClick}
                      ref={myMapRef}
                      style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        zIndex: 10,
                      }}
                      mapStyle="https://tiles.openfreemap.org/styles/liberty"
                    >
                      <Marker
                        latitude={viewPort.latitude}
                        longitude={viewPort.longitude}
                      >
                        <MapPin className="h-8 w-8 text-rose-600" />
                      </Marker>
                    </Map>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <Button type="button" onClick={() => setStep(3)}>
                    Continue
                  </Button>
                </div>
              </Card>
            )}
            {/* ...other steps... */}
            {step === 4 && (
              <div className="flex justify-end">
                <Button type="submit">Register Station</Button>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
