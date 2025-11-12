import { useState, createContext } from "react";
import { useAccount } from "wagmi";
import { Header } from "./components/Header";
import { CreateVote } from "./components/CreateVote";
import { VoteList } from "./components/VoteList";
import { useFhevm } from "./fhevm/useFhevm";
import { useMetaMaskProvider } from "./hooks/useMetaMaskProvider";
import type { FhevmInstance } from "./fhevm/fhevmTypes";
import type { FhevmGoState } from "./fhevm/useFhevm";
import "./App.css";

interface FhevmContextValue {
  instance: FhevmInstance | undefined;
  status: FhevmGoState;
  error: Error | undefined;
}

export const FhevmContext = createContext<FhevmContextValue>({
  instance: undefined,
  status: "idle",
  error: undefined,
});

function App() {
  const { isConnected, chainId } = useAccount();
  const [refreshKey, setRefreshKey] = useState(0);
  const provider = useMetaMaskProvider();
  
  const { instance, status, error } = useFhevm({
    provider,
    chainId,
    enabled: isConnected,
  });

  const handleVoteCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const fhevmContextValue: FhevmContextValue = {
    instance,
    status,
    error,
  };

  return (
    <FhevmContext.Provider value={fhevmContextValue}>
      <div className="app">
        <Header />
        
        {isConnected && status === "loading" && (
          <div className="fhevm-status">
            <div className="fhevm-status-content">
              <div className="loader"></div>
              <p>Initializing FHEVM...</p>
            </div>
          </div>
        )}
        
        {isConnected && status === "error" && (
          <div className="fhevm-status error">
            <div className="fhevm-status-content">
              <p>⚠️ FHEVM initialization failed</p>
              <p className="error-details">{error?.message}</p>
            </div>
          </div>
        )}
        
        <main className="main-content">
          {!isConnected ? (
          <div className="connect-wallet-container">
            <div className="connect-wallet-card">
              <img src="/logo.svg" alt="Sealed Ballot" className="connect-logo" />
              <h2>Welcome to Sealed Ballot</h2>
              <p className="connect-description">
                A time-locked encrypted voting system powered by Fully Homomorphic Encryption (FHE).
                Votes remain encrypted until the deadline, ensuring complete privacy and fairness.
              </p>
              <div className="features">
                <div className="feature-item">
                  <span className="feature-icon">🔒</span>
                  <span className="feature-text">Encrypted Votes</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">⏰</span>
                  <span className="feature-text">Time-Locked</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔓</span>
                  <span className="feature-text">Delayed Decryption</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🎯</span>
                  <span className="feature-text">Fair & Transparent</span>
                </div>
              </div>
              <p className="connect-prompt">Connect your wallet to get started</p>
            </div>
          </div>
        ) : (
          <>
            <div className="welcome-banner">
              <div className="banner-content">
                <h2>🗳️ Welcome to Sealed Ballot</h2>
                <p>Create and participate in fully encrypted voting with FHE technology</p>
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-icon">🔐</span>
                  <div className="stat-info">
                    <span className="stat-value">100%</span>
                    <span className="stat-label">Privacy</span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">⚡</span>
                  <div className="stat-info">
                    <span className="stat-value">Real-time</span>
                    <span className="stat-label">Encryption</span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🛡️</span>
                  <div className="stat-info">
                    <span className="stat-value">Secure</span>
                    <span className="stat-label">On-chain</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="content-grid">
              <div className="sidebar">
                <CreateVote onVoteCreated={handleVoteCreated} />
              </div>
              <div className="main-area">
                <VoteList refresh={refreshKey} />
              </div>
            </div>
          </>
        )}
        </main>

        <footer className="footer">
          <p>
            Built with ❤️ using{" "}
            <a href="https://docs.zama.ai/fhevm" target="_blank" rel="noopener noreferrer">
              Zama FHEVM
            </a>
          </p>
        </footer>
      </div>
    </FhevmContext.Provider>
  );
}

export default App;

