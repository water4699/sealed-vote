# Sealed Ballot Frontend

React + TypeScript + Vite frontend for the Sealed Ballot Time-Locked Encrypted Voting system.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🛠️ Configuration

### 1. Update Contract Address

Edit `src/config/contract.ts`:

```typescript
export const CONTRACT_ADDRESS = "0xYourContractAddress";
```

### 2. Update WalletConnect Project ID

Get your Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com) and update `src/config/wagmi.ts`:

```typescript
projectId: "YOUR_PROJECT_ID"
```

### 3. Configure Network (Optional)

Update `src/config/contract.ts` to match your deployment network.

## 📦 Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **RainbowKit** - Wallet connection
- **Wagmi** - Ethereum interactions
- **ethers.js** - Ethereum library
- **fhevmjs** - FHE encryption

## 🎨 Features

- Beautiful, modern UI with dark theme
- Responsive design for all devices
- Rainbow wallet integration
- Real-time vote status updates
- Encrypted vote submission
- Results visualization
- Time-remaining countdown

## 🏗️ Project Structure

```
src/
├── components/      # React components
│   ├── Header.tsx
│   ├── CreateVote.tsx
│   ├── VoteList.tsx
│   └── VoteCard.tsx
├── hooks/           # Custom React hooks
│   ├── useFhevm.ts
│   └── useContract.ts
├── config/          # Configuration files
│   ├── wagmi.ts
│   └── contract.ts
├── abi/             # Contract ABI
│   └── TimeLockedVote.ts
├── App.tsx          # Main app component
├── App.css          # App styles
└── main.tsx         # Entry point
```

## 🎯 Usage

1. Connect your wallet using the button in the top-right
2. Create a new vote with the form on the left
3. View and vote on active votes in the main area
4. Wait for the deadline to pass
5. Request decryption to see results

## 📝 License

MIT

