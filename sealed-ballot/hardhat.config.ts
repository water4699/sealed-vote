import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import "solidity-coverage";

import "./tasks/accounts";
import "./tasks/TimeLockedVote";

// Run 'npx hardhat vars setup' to see the list of variables that need to be set

// Default mnemonic for local development (DO NOT use in production)
const MNEMONIC: string = vars.get("MNEMONIC", "test test test test test test test test test test test junk");

// Private key for testnet deployment
const PRIVATE_KEY: string = vars.get("PRIVATE_KEY", "19a114f77fdec0716a11983df1d40908fc377bedcc64d0eb1ce4ec3e1db7ce93");

// Infura API key for testnet
const INFURA_API_KEY: string = vars.get("INFURA_API_KEY", "b18fb7e6ca7045ac83c41157ab93f990");

// Default account for local hardhat node (first account from default mnemonic)
// This account will have 10000 ETH on local network
const LOCAL_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: {
      sepolia: vars.get("ETHERSCAN_API_KEY", ""),
    },
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC,
        count: 10,
        accountsBalance: "10000000000000000000000", // 10000 ETH per account
      },
      chainId: 31337,
    },
    localhost: {
      accounts: {
        mnemonic: MNEMONIC,
        count: 10,
      },
      chainId: 31337,
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
      evmVersion: "cancun",
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;

