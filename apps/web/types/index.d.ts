type PhantomProvider = {
    isPhantom?: boolean;
    connect: () => Promise<void>;
    publicKey?: { toBase58: () => string };
    isConnected: boolean;
  };