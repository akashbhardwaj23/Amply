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
import idl from '@/idl/ev_charging.json'; // <-- adjust path if needed
import { Map, MapRef, Marker, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Label } from '@/components/ui/label';
import { PhantomProvider, FieldType } from '@/types';

const programId = new web3.PublicKey(idl.address);

const network = 'https://api.devnet.solana.com';

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
      connectorTypes: '',
      latitude: viewPort.latitude,
      longitude: viewPort.longitude,
    },
  });

  // --- Anchor integration onSubmit ---
  async function onSubmit(data: StationFormValues) {
    console.log('111');
    const phantom = getPhantomProvider();
    if (!phantom) {
      toast({
        variant: 'destructive',
        title: 'Install Wallet',
        description: 'Please Install Phantom Wallet',
      });
      // alert('Please install Phantom Wallet!');
      return;
    }

    try {
      await phantom.connect();

      const connection = new web3.Connection(network, 'confirmed');
      const provider = new AnchorProvider(
        connection,
        phantom as unknown as Wallet,
        AnchorProvider.defaultOptions()
      );
      setProvider(provider);
      const anchorProvider = getProvider();
      const program = new Program(idl as any, anchorProvider);

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
        payer: phantom.publicKey!,
        systemProgram: web3.SystemProgram.programId,
      });
      const priceLamports = Math.floor(data.price * web3.LAMPORTS_PER_SOL);
      console.log('Price in lamports:', priceLamports);

      const priceBN = new BN(priceLamports);
      console.log('BN price:', priceBN.toString());

      console.log(viewPort);
      console.log(viewPort);
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
          priceBN,
          data.connectorTypes,
          viewPort.latitude,
          viewPort.longitude
        )
        .accounts({
          charger: chargerPda,
          payer: phantom.publicKey!,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('Charger PDA:', chargerPda.toBase58());
      console.log('Accounts:', {
        charger: chargerPda.toBase58(),
        payer: phantom.publicKey!.toBase58(),
        systemProgram: web3.SystemProgram.programId.toBase58(),
      });

      // alert('Charger registered on Solana!');
      toast({
        variant: 'default',
        title: 'Charger Register',
        description: 'Charger Register on Solana',
        className: cn(
          'top-0 left-[40%] flex fixed md:max-w-[420px] md:top-4 md:right-4'
        ),
      });
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

        <div className="mb-8">
          <div className="flex justify-between">
            <div
              className={`flex-1 flex flex-col items-center ${step >= 1 ? 'text-rose-600' : 'text-muted-foreground'}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step >= 1 ? 'bg-rose-100 dark:bg-rose-900' : 'bg-muted'}`}
              >
                {step > 1 ? <Check className="h-5 w-5" /> : <span>1</span>}
              </div>
              <span className="text-sm">Station Details</span>
            </div>

            <div className="flex-1 flex justify-center">
              <div
                className={`h-0.5 w-full self-center ${step >= 2 ? 'bg-rose-600' : 'bg-muted'}`}
              />
            </div>

            <div
              className={`flex-1 flex flex-col items-center ${step >= 2 ? 'text-rose-600' : 'text-muted-foreground'}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step >= 2 ? 'bg-rose-100 dark:bg-rose-900' : 'bg-muted'}`}
              >
                {step > 2 ? <Check className="h-5 w-5" /> : <span>2</span>}
              </div>
              <span className="text-sm">Location Details</span>
            </div>
            <div className="flex-1 flex justify-center">
              <div
                className={`h-0.5 w-full self-center ${step >= 3 ? 'bg-rose-600' : 'bg-muted'}`}
              />
            </div>
            <div
              className={`flex-1 flex flex-col items-center ${step >= 3 ? 'text-rose-600' : 'text-muted-foreground'}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step >= 3 ? 'bg-rose-100 dark:bg-rose-900' : 'bg-muted'}`}
              >
                {step > 3 ? <Check className="h-5 w-5" /> : <span>3</span>}
              </div>
              <span className="text-sm">Technical Specs</span>
            </div>
            <div className="flex-1 flex justify-center">
              <div
                className={`h-0.5 w-full self-center ${step >= 4 ? 'bg-rose-600' : 'bg-muted'}`}
              />
            </div>
            <div
              className={`flex-1 flex flex-col items-center ${step >= 4 ? 'text-rose-600' : 'text-muted-foreground'}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step >= 4 ? 'bg-rose-100 dark:bg-rose-900' : 'bg-muted'}`}
              >
                <span>4</span>
              </div>
              <span className="text-sm">Verification</span>
            </div>
          </div>
        </div>

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
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }: { field: FieldType }) => (
                      <FormItem>
                        <FormLabel>Station Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., My Home Charger"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This is how your station will appear to users
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }: { field: FieldType }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }: { field: FieldType }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Anytown" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }: { field: FieldType }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="CA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }: { field: FieldType }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }: { field: FieldType }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide additional details about your station..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include details like parking instructions, access
                          hours, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                      onDblClick={(e: MapLayerMouseEvent) =>
                        handleDoubleClick(e)
                      }
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
                        longitude={viewPort.longitude}
                        latitude={viewPort.latitude}
                      >
                        <MapPin className={`w-8 h-8 text-red-600`} />
                      </Marker>
                    </Map>
                  </div>
                </div>

                <div className="flex justify-between p-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>

                  {viewPort && (
                    <div className="flex justify-between items-center gap-4 text-sm">
                      <div className="flex flex-col justify-center items-center gap-2">
                        <span className="px-4 py-2 bg-primary rounded-lg">
                          {viewPort.longitude}
                        </span>
                        <Label>Logitude</Label>
                      </div>
                      <div className="flex flex-col justify-center items-center gap-2">
                        <span className="px-4 py-2 bg-primary rounded-lg">
                          {viewPort.latitude}
                        </span>

                        <Label>Latitude</Label>
                      </div>
                    </div>
                  )}
                  <Button type="button" onClick={() => setStep(3)}>
                    Continue
                  </Button>
                </div>
              </Card>
            )}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Technical Specifications</CardTitle>
                  <CardDescription>
                    Provide details about your charging equipment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="chargerType"
                    render={({ field }: { field: FieldType }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Charger Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="level1" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Level 1 (120V)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="level2" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Level 2 (240V)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="dcFast" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                DC Fast Charging
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="other" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Other
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="power"
                      render={({ field }: { field: FieldType }) => (
                        <FormItem>
                          <FormLabel>Power Output (kW)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              step="0.1"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }: { field: FieldType }) => (
                        <FormItem>
                          <FormLabel>Price (SOL per kWh)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="connectorTypes"
                    render={({ field }: { field: FieldType }) => (
                      <FormItem>
                        <FormLabel>Connector Types</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Type 2, CCS, CHAdeMO"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          List all connector types available, separated by
                          commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                    >
                      Back
                    </Button>
                    <Button type="button" onClick={() => setStep(4)}>
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Verification & Submission</CardTitle>
                  <CardDescription>
                    Verify your information and submit your station
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Station Details</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="text-muted-foreground">Name:</div>
                      <div>{form.getValues('name')}</div>
                      <div className="text-muted-foreground">Address:</div>
                      <div>{`${form.getValues('address')}, ${form.getValues('city')}, ${form.getValues('state')} ${form.getValues('zip')}`}</div>
                      <div className="text-muted-foreground">Description:</div>
                      <div>{form.getValues('description') || 'N/A'}</div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium">Location Details</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="text-muted-foreground">Longitude:</div>
                        <div>{viewPort.longitude}</div>
                        <div className="text-muted-foreground">Latitude:</div>
                        <div>{viewPort.latitude}</div>
                      </div>
                    </div>

                    <h3 className="font-medium">Technical Specifications</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="text-muted-foreground">Charger Type:</div>
                      <div>
                        {form.getValues('chargerType') === 'level1' &&
                          'Level 1 (120V)'}
                        {form.getValues('chargerType') === 'level2' &&
                          'Level 2 (240V)'}
                        {form.getValues('chargerType') === 'dcFast' &&
                          'DC Fast Charging'}
                        {form.getValues('chargerType') === 'other' && 'Other'}
                      </div>
                      <div className="text-muted-foreground">Power Output:</div>
                      <div>{form.getValues('power')} kW</div>
                      <div className="text-muted-foreground">Price:</div>
                      <div>{form.getValues('price')} SOL/kWh</div>
                      <div className="text-muted-foreground">
                        Connector Types:
                      </div>
                      <div>{form.getValues('connectorTypes')}</div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(3)}
                    >
                      Back
                    </Button>
                    <Button type="submit">Submit & Register</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
