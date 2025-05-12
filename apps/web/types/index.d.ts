import React from 'react';

type PhantomProvider = {
    isPhantom?: boolean;
    connect: () => Promise<void>;
    publicKey?: { toBase58: () => string };
    isConnected: boolean;
  };

// React Hook Form field type
type FieldType = {
  value: any;
  onChange: (event: { target: { value: any } } | any) => void;
  onBlur: () => void;
  name: string;
  ref: React.Ref<any>;
};

// Station type for charging stations
interface Station {
  id: string;
  name: string;
  address: string;
  price: number;
  rating: number;
  available: boolean;
  power: number;
  lat: number;
  lng: number;
}

// Make Window.solana accessible
interface Window {
  solana?: PhantomProvider;
}


export interface ChargerType {
  publicKey: string;
  account:   Account;
}

export interface Account {
  owner:          string;
  name:           string;
  address:        string;
  city:           string;
  state:          string;
  zip:            string;
  description:    string;
  chargerType:    string;
  power:          string;
  price:          string;
  connectorTypes: string;
  latitude:       number;
  longitude:      number;
}
