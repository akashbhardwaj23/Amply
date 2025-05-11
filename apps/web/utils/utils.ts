'use client'; 

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: any;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  on: (event: string, handler: (args: any) => void) => void;
  request: (method: string, params: any) => Promise<any>;
}

export const getPhantomProvider = (): PhantomProvider | undefined => {
  if (typeof window === 'undefined') return undefined;

  if ('solana' in window) {
    const provider = (window as any).solana as PhantomProvider;
    if (provider.isPhantom) return provider;
  }

  window.open('https://phantom.app/', '_blank');
  return undefined;
};
