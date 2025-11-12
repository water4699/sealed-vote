import { useEffect, useState } from "react";
import { Contract } from "ethers";
import { useAccount, useWalletClient } from "wagmi";
import { BrowserProvider } from "ethers";
import { TIME_LOCKED_VOTE_ABI } from "../abi/TimeLockedVote";
import { SEPOLIA_ADDRESS, LOCALHOST_ADDRESS } from "../config/contract";

export function useContract() {
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [contract, setContract] = useState<Promise<Contract | null> | null>(null);

  useEffect(() => {
    if (!address || !walletClient || !chainId) {
      setContract(null);
      return;
    }

    const getContract = async () => {
      try {
        // Auto-select contract address based on network
        let contractAddress: string;
        if (chainId === 31337) {
          // Localhost
          contractAddress = LOCALHOST_ADDRESS;
          console.log("🔧 Using Localhost contract:", contractAddress);
        } else if (chainId === 11155111) {
          // Sepolia
          contractAddress = SEPOLIA_ADDRESS;
          console.log("🌐 Using Sepolia contract:", contractAddress);
        } else {
          console.error("❌ Unsupported network:", chainId);
          return null;
        }

        const provider = new BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();
        return new Contract(contractAddress, TIME_LOCKED_VOTE_ABI, signer);
      } catch (err) {
        console.error("Failed to get contract:", err);
        return null;
      }
    };

    setContract(getContract());
  }, [address, walletClient, chainId]);

  return contract;
}

