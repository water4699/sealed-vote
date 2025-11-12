// Contract configuration
// Automatically switches between networks based on MetaMask connection

// Network addresses:
export const SEPOLIA_ADDRESS = "0x562c190f11009693FCf6feEf52a873E4B619e76F"; // Sepolia testnet ✅ FRESH DEPLOYMENT (Dec 2024)
export const LOCALHOST_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Localhost ✅ (Latest deployment with client-side decryption)

// Contract address is now auto-selected based on connected network in useContract hook
// - Sepolia (chainId: 11155111) → SEPOLIA_ADDRESS (FRESH DEPLOYMENT - No old data)
// - Localhost (chainId: 31337) → LOCALHOST_ADDRESS (Fresh deployment)

export const NETWORK_CONFIG = {
  localhost: {
    chainId: 31337,
    name: "Localhost",
    rpcUrl: "http://127.0.0.1:8545",
  },
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/b18fb7e6ca7045ac83c41157ab93f990",
  },
};

