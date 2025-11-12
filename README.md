# Sealed Ballot - Time-Locked Encrypted Voting System

A decentralized voting system using Fully Homomorphic Encryption (FHE) where votes remain encrypted until a predetermined deadline. Built with Zama FHEVM, this system ensures complete privacy and prevents result manipulation during the voting period.

## Features

- **Encrypted Voting**: All votes are encrypted using FHE technology
- **Client-Side Decryption**: Direct browser-based decryption without relying on KMS Oracle
- **Flexible Decryption**: Decrypt results anytime (no time lock enforced)
- **Fair & Transparent**: Votes remain encrypted until deliberately decrypted
- **Rainbow Wallet**: Easy wallet connection with RainbowKit
- **Modern UI**: Clean, responsive interface with real-time updates

## Prerequisites

- Node.js >= 20
- npm >= 7.0.0
- MetaMask or compatible Web3 wallet

## 🎯 Network Auto-Switching

The frontend **automatically detects** which network you're connected to in MetaMask and uses the correct contract:

| Network | Chain ID | Contract Address | Status |
|---------|----------|------------------|--------|
| **Sepolia** | 11155111 | `0x562c190f11009693FCf6feEf52a873E4B619e76F` | ✅ Deployed (Persistent) - **FRESH (Dec 2024)** |
| **Localhost** | 31337 | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | ✅ Ready (In-memory) |

### Quick Start

1. **For Sepolia**: Just connect MetaMask to Sepolia network - ready to use!
2. **For Localhost**: Start Hardhat node first (see below)

**No manual configuration needed!** Frontend auto-selects the correct contract based on your MetaMask network. 🎉

### ⚠️ Important: Localhost Data Persistence

**Hardhat local node stores data in memory:**
- ✅ Super fast for testing
- ❌ **All data is lost when node restarts**
- 🔄 Need to redeploy contract after restart

If you restart the Hardhat node, simply run:
```bash
npm run deploy:local
```

### 🔐 How Decryption Works

**Client-Side Decryption Flow:**
1. **Vote First**: ⚠️ **At least one vote must be cast before decryption is possible**
2. **Request Access**: Click "Request Decryption 🔓" button
3. **Grant Permission**: Contract grants you permission to decrypt
4. **Sign Message**: Sign an EIP-712 message for decryption (auto-handled in mock mode)
5. **Decrypt Locally**: Your browser decrypts the results using FHEVM
6. **View Results**: Decrypted vote counts are displayed immediately

**Important Notes:**
- ✅ **Localhost**: Uses Mock FHEVM - simplified signature process, instant sync
- ✅ **Sepolia**: Uses Real FHEVM with full EIP-712 signing
- ⚠️ **Must vote first**: At least one vote must exist to see decryption results
- ⏳ **Sepolia RPC Sync Delay**: 
  - After voting, it may take **15-30 seconds** for RPC node to sync
  - Use the "🔄 Refresh Status" button to check if sync is complete
  - **Auto-retry**: System retries 5 times (15s total) automatically
  - **Force Decrypt**: Skip wait and decrypt immediately (⚡ button)
  - Your vote is always confirmed on-chain, even if RPC shows 0 votes

---

## Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Compile Contracts

```bash
npm run compile
```

### 3. Run Tests

```bash
npm run test
```

All tests should pass successfully.

### 4. Contract Deployment

**Option A: Use Sepolia Testnet (Recommended ✅)**

The contract is already deployed and tested on Sepolia testnet. Skip to Step 5 to use it directly!

**Option B: Deploy to Local Network**

The project is now configured to work with local network using the default Hardhat mnemonic.

**Terminal 1 - Start Local Node:**

Windows PowerShell:
```powershell
.\start-local-node.ps1
```

Or manually:
```bash
npx hardhat node
```

This will start a local Ethereum node with 10 pre-funded accounts (10000 ETH each).

**Terminal 2 - Deploy Contract:**

Windows PowerShell:
```powershell
.\deploy-local.ps1
```

Or manually:
```bash
npm run deploy:local
```

**Contract Address:**

The deployed contract address is automatically configured in `frontend/src/config/contract.ts` as `LOCALHOST_ADDRESS`. The frontend will auto-detect and use it when you connect to Localhost network.

**Configure MetaMask for Local Network:**

1. Add Network:
   - Network Name: Localhost 8545
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. Import Test Account:
   - Use this private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This account has 10000 ETH on local network

**More Test Accounts:**

The local node generates 10 accounts. You can find them in the node output. Each has 10000 ETH.

### 5. Configure Frontend

The contract is deployed on **both** Sepolia testnet and localhost. You can easily switch between them!

**Deployed Addresses:**

| Network | Contract Address | Status |
|---------|-----------------|---------|
| Sepolia Testnet | `0xBca9B8390Cdf0c0F1Da18d9523f78F8bFfd9aEc1` | ✅ Ready |
| Localhost | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` | ✅ Ready |

**Switch Networks:**

Edit `frontend/src/config/contract.ts`:

For **Sepolia** (default):
```typescript
export const CONTRACT_ADDRESS = SEPOLIA_ADDRESS;
```

For **Localhost**:
```typescript
export const CONTRACT_ADDRESS = LOCALHOST_ADDRESS;
```

**Network Configuration:**
- Sepolia RPC: `https://sepolia.infura.io/v3/b18fb7e6ca7045ac83c41157ab93f990`
- Localhost RPC: `http://127.0.0.1:8545`

### 6. Run Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser.

**Important Notes:**
- Make sure your MetaMask is connected to the correct network (Sepolia or Localhost)
- The frontend uses Wagmi v2 APIs for wallet connection
- The application uses **Zama Relayer SDK** for browser-based FHE encryption

**✅ FHE Encryption Solution:**

This project uses **@zama-fhe/relayer-sdk** for production-ready browser FHE operations:

**For Sepolia Testnet:**
- ✅ Loads Relayer SDK from CDN dynamically
- ✅ Full FHE encryption in browser (no WASM issues)
- ✅ Client-side vote encryption
- ✅ Ready for production use

**For Localhost (Hardhat Node):**
- ✅ Uses `@fhevm/mock-utils` for local development
- ✅ Auto-detects Hardhat node via `fhevm_relayer_metadata` RPC
- ✅ Mock encryption for fast local testing
- ✅ Dynamically imported (not included in production bundle)

**Architecture Highlights:**
1. **Smart Detection**: Automatically uses mock for local network, real SDK for testnet
2. **Dynamic Loading**: Relayer SDK loaded on-demand, reducing bundle size
3. **Zero Configuration**: Works out of the box for both networks
4. **Full Browser Support**: No backend API needed for encryption

**✅ To Test Full Functionality:**
```bash
# Test smart contracts with real FHE
npm run test

# Test frontend with browser-based encryption
cd frontend
npm run dev
```

- If you see "Contract not initialized", make sure:
  1. You've connected your wallet
  2. You're on the correct network
  3. The contract address in `config/contract.ts` matches your selected network

## Usage

### Create a Vote

1. Connect your wallet (top-right corner)
2. Fill in the vote form:
   - Title: Your vote title
   - Description: Detailed description
   - Options: 2-16 options
   - Duration: Time in seconds (e.g., 3600 for 1 hour)
3. Click "Create Vote"

### Cast a Vote

1. View active votes on the main page
2. Select your preferred option
3. Click "Submit Vote 🔒"
4. Confirm the transaction

### View Results

1. Wait for the voting deadline to pass
2. Click "Request Decryption 🔓"
3. Wait for decryption to complete
4. View the decrypted results

## Smart Contract Functions

### Main Functions

```solidity
// Create a new vote
function createVote(
    string memory title,
    string memory description,
    string[] memory options,
    uint64 duration
) external returns (uint256 voteId)

// Cast an encrypted vote
function castVote(
    uint256 voteId,
    externalEuint32 encryptedOptionIndex,
    bytes calldata inputProof
) external

// Request decryption after deadline
function requestDecryption(uint256 voteId) external

// Get decrypted results
function getResults(uint256 voteId) external view returns (uint32[] memory)
```

## Project Structure

```
sealed-ballot/
├── contracts/           # Smart contracts
│   └── TimeLockedVote.sol
├── deploy/              # Deployment scripts
├── test/                # Test files
├── tasks/               # Hardhat tasks
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   ├── config/      # Configuration
│   │   └── abi/         # Contract ABI
│   └── public/          # Static assets
└── README.md            # This file
```

## Network Configuration

### Localhost (✅ Deployed)
- **Chain ID**: 31337
- **RPC URL**: http://127.0.0.1:8545
- **Contract**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- **Deployer**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Accounts**: 10 pre-funded accounts with 10000 ETH each
- **Test Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### Sepolia Testnet (✅ Deployed)
- **Chain ID**: 11155111
- **RPC URL**: https://sepolia.infura.io/v3/b18fb7e6ca7045ac83c41157ab93f990
- **Contract**: `0xBca9B8390Cdf0c0F1Da18d9523f78F8bFfd9aEc1`
- **Deployer**: `0x32d8b6f8a1a7C9656069D1E6d349740768c49fa4`
- **Etherscan**: https://sepolia.etherscan.io/address/0xBca9B8390Cdf0c0F1Da18d9523f78F8bFfd9aEc1

## Testing

### Local Tests

```bash
npm run test
```

Runs comprehensive test suite including:
- Vote creation tests
- Encrypted vote casting
- Multiple voter scenarios
- Double voting prevention
- Status tracking

### Testnet Tests

```bash
npm run test:sepolia
```

Runs tests on Sepolia testnet (requires deployment first).

## Development Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to local network
npm run deploy:local

# Deploy to Sepolia
npm run deploy:sepolia

# Start local node
npm run node

# Clean build artifacts
npm run clean

# Lint code
npm run lint

# Format code
npm run prettier:write

# View accounts
npx hardhat accounts

# Get vote information
npx hardhat vote:info --voteid 0

# List all votes
npx hardhat vote:list
```

## Security Features

- **Encryption at Rest**: All votes stored encrypted on-chain
- **Double-Vote Prevention**: Contract enforces one vote per address
- **Time-Lock Guarantee**: Results cannot be decrypted before deadline
- **Immutable Records**: All votes permanently recorded on blockchain

## Use Cases

### DAO Governance
- Proposal voting for decentralized organizations
- Prevents vote buying through result concealment
- Fair governance decisions

### Competitive Bidding
- Sealed bid auctions
- Grant proposal voting
- Fair competition scenarios

### Community Polls
- Fair community decision-making
- Prevents bandwagon effects
- Encourages honest voting

## Troubleshooting

### Contract not initialized
- Ensure local node is running: `npm run node`
- Verify contract is deployed: `npm run deploy:local`
- Check contract address in `frontend/src/config/contract.ts`

### FHEVM initialization failed
- **For Localhost**: Ensure Hardhat node is running with `npx hardhat node`
- **For Sepolia**: Verify network connection and wallet is connected
- Check browser console for detailed error messages
- Try refreshing the page after connecting wallet
- Ensure you're using a supported browser (Chrome, Firefox, Edge)

### "Operation was aborted" in console
- This is normal in React Strict Mode (development only)
- React mounts components twice in development
- The second mount aborts the first initialization
- Final initialization will complete successfully
- Not an error - application will work correctly

### Transaction failed
- Check you haven't already voted
- Ensure vote is still active
- Verify wallet has sufficient balance

### Frontend won't start
- Ensure Node.js version >= 20
- Try: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf frontend/.vite`

## Technology Stack

### Smart Contract
- Solidity 0.8.27
- Zama FHEVM library
- Hardhat development environment

### Frontend
- React 18
- TypeScript
- Vite
- RainbowKit for wallet connection
- Wagmi for Ethereum interactions
- @zama-fhe/relayer-sdk (v0.2.0) for FHE operations
- @fhevm/mock-utils (v0.1.0) for local development

## License

MIT License

## Support

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Discord](https://discord.gg/zama)
- [Hardhat Documentation](https://hardhat.org/)

## Acknowledgments

Built with ❤️ using:
- [Zama FHEVM](https://docs.zama.ai/fhevm) - Fully Homomorphic Encryption
- [Hardhat](https://hardhat.org/) - Ethereum development environment
- [React](https://react.dev/) - Frontend framework
- [RainbowKit](https://www.rainbowkit.com/) - Wallet connection
- [Vite](https://vitejs.dev/) - Build tool

---

**Note**: This is a demonstration project. Conduct thorough security audits before production use.
