import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "wagmi";

// Define localhost chain with correct chainId
const localhost = {
  id: 31337,
  name: "Localhost",
  network: "localhost",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
  testnet: true,
} as const;

// Use a dummy project ID to avoid WalletConnect errors (we only need MetaMask)
export const config = getDefaultConfig({
  appName: "Sealed Ballot",
  projectId: "3fbb6bba6f1de962d911bb5b5c9dba88", // Public test Project ID
  chains: [localhost, sepolia],
  transports: {
    [localhost.id]: http("http://127.0.0.1:8545"),
    [sepolia.id]: http(`https://sepolia.infura.io/v3/b18fb7e6ca7045ac83c41157ab93f990`),
  },
  ssr: false,
});

