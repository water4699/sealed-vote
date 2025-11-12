import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export function useMetaMaskProvider() {
  const { isConnected } = useAccount();
  const [provider, setProvider] = useState<any | undefined>(undefined);

  useEffect(() => {
    if (!isConnected) {
      setProvider(undefined);
      return;
    }

    // Check if MetaMask is installed
    if (typeof window !== "undefined" && window.ethereum) {
      setProvider(window.ethereum);
    } else {
      console.warn("MetaMask not detected");
      setProvider(undefined);
    }
  }, [isConnected]);

  return provider;
}

