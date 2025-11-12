import { useState, useEffect, useContext } from "react";
import { useContract } from "../hooks/useContract";
import { FhevmContext } from "../App";
import { useAccount, useWalletClient } from "wagmi";
import { BrowserProvider } from "ethers";
import { FhevmDecryptionSignature } from "../fhevm/FhevmDecryptionSignature";
import { InMemoryStringStorage } from "../fhevm/GenericStringStorage";

interface Vote {
  id: number;
  title: string;
  description: string;
  options: string[];
  deadline: bigint;
  creator: string;
  isDecrypted: boolean;
  totalVoters: bigint;
}

interface VoteStatus {
  isActive: boolean;
  isEnded: boolean;
  isDecrypted: boolean;
  timeRemaining: bigint;
}

export function VoteCard({ vote, onVoteCast }: { vote: Vote; onVoteCast: () => void }) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<VoteStatus | null>(null);
  const [results, setResults] = useState<number[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const contractPromise = useContract();
  const { instance, status: fhevmStatus } = useContext(FhevmContext);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [signatureStorage] = useState(() => new InMemoryStringStorage());

  useEffect(() => {
    loadStatus();
    checkHasVoted();
    loadResults(); // Always try to load results
  }, [vote.id, contractPromise, address, vote.isDecrypted]); // Add vote.isDecrypted to dependencies

  const loadStatus = async () => {
    try {
      const contract = await contractPromise;
      if (!contract) return;

      const statusData = await contract.getVoteStatus(vote.id);
      const newStatus = {
        isActive: statusData[0],
        isEnded: statusData[1],
        isDecrypted: statusData[2],
        timeRemaining: statusData[3],
      };
      console.log(`📊 [Vote ${vote.id}] Status:`, {
        ...newStatus,
        'vote.isDecrypted': vote.isDecrypted,
        'statusData[2]': statusData[2]
      });
      setStatus(newStatus);
      
      // If decrypted, load results immediately
      if (newStatus.isDecrypted || vote.isDecrypted) {
        console.log(`✅ [Vote ${vote.id}] IS DECRYPTED! Loading results...`);
        setTimeout(() => loadResults(), 100);
      } else {
        console.log(`🔒 [Vote ${vote.id}] Still encrypted`);
      }
    } catch (err) {
      console.error("Failed to load status:", err);
    }
  };

  const checkHasVoted = async () => {
    if (!address) return;
    
    try {
      const contract = await contractPromise;
      if (!contract) return;

      const voted = await contract.hasUserVoted(vote.id, address);
      setHasVoted(voted);
    } catch (err) {
      console.error("Failed to check vote status:", err);
    }
  };

  const loadResults = async () => {
    try {
      const contract = await contractPromise;
      if (!contract) return;

      // Check both sources for decryption status
      const isDecrypted = vote.isDecrypted || status?.isDecrypted;
      
      if (!isDecrypted) {
        console.log(`🔒 [Vote ${vote.id}] Not decrypted yet (vote.isDecrypted=${vote.isDecrypted}, status?.isDecrypted=${status?.isDecrypted})`);
        return;
      }

      console.log(`📊 [Vote ${vote.id}] Loading results...`);
      const resultsData = await contract.getResults(vote.id);
      const resultsArray = resultsData.map((r: bigint) => Number(r));
      console.log(`✅ [Vote ${vote.id}] Results loaded:`, resultsArray);
      setResults(resultsArray);
    } catch (err) {
      console.error(`❌ [Vote ${vote.id}] Failed to load results:`, err);
    }
  };

  const handleVote = async () => {
    if (selectedOption === null) {
      setError("Please select an option");
      return;
    }

    if (!instance || fhevmStatus !== "ready") {
      setError("FHEVM is not ready. Please wait for initialization.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const contract = await contractPromise;
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      // Encrypt the vote using FHEVM
      const contractAddress = await contract.getAddress();
      const encryptedInput = instance.createEncryptedInput(
        contractAddress as `0x${string}`,
        address as `0x${string}`
      );
      encryptedInput.add32(selectedOption);
      const encrypted = await encryptedInput.encrypt();
      const { handles, inputProof } = encrypted;

      // Cast the encrypted vote
      const tx = await contract.castVote(vote.id, handles[0], inputProof);
      console.log("⏳ Waiting for transaction confirmation...");
      await tx.wait();
      console.log("✅ Transaction confirmed!");

      setSelectedOption(null);
      setHasVoted(true);
      
      // Wait a bit for RPC node to sync, especially on testnets
      console.log("⏳ Waiting for state to sync...");
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds delay (increased for Sepolia)
      
      onVoteCast();
    } catch (err: any) {
      console.error("Failed to cast vote:", err);
      setError(err.message || "Failed to cast vote");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDecryption = async (forceDecrypt = false) => {
    setLoading(true);
    setError(null);

    try {
      const contract = await contractPromise;
      if (!contract || !instance || !walletClient) {
        throw new Error("Contract, FHEVM instance, or wallet not initialized");
      }

      console.log("🔓 Starting client-side decryption...");
      
      // Check if there are votes to decrypt (with retry for testnet sync delay)
      let totalVoters = 0;
      
      if (!forceDecrypt) {
        let retryCount = 0;
        const maxRetries = 5;
        
        while (retryCount < maxRetries) {
          const voteInfo = await contract.getVote(vote.id);
          totalVoters = Number(voteInfo[6]);
          
          if (totalVoters > 0) {
            console.log(`✅ Found ${totalVoters} vote(s)`);
            break;
          }
          
          if (retryCount < maxRetries - 1) {
            console.log(`⏳ No votes found yet, retrying in 3s... (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            retryCount++;
          } else {
            throw new Error("⚠️ Blockchain sync taking longer than expected. Your vote is confirmed on-chain, but the RPC node hasn't synced yet. Please wait 10-20 more seconds and click 'Request Decryption' again, or use 'Force Decrypt' to try anyway.");
          }
        }
      } else {
        console.log("⚡ Force decrypt mode - skipping vote count check");
      }

      // Step 1: Request decryption access from contract
      console.log("📝 Requesting decryption access...");
      const accessTx = await contract.requestDecryptionAccess(vote.id);
      await accessTx.wait();
      console.log("✅ Decryption access granted");

      // Step 2: Create EIP-712 signature for user decryption
      const contractAddress = await contract.getAddress();
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();

      console.log("🔑 Getting decryption signature...");
      
      // Create a simple signature for both mock and real modes
      let signature;
      try {
        signature = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [contractAddress as `0x${string}`],
          signer,
          signatureStorage
        );
      } catch (sigError: any) {
        // If signature fails (e.g., in mock mode), create a fallback
        if (sigError.message && sigError.message.includes("Not supported in mock mode")) {
          console.warn("⚠️ Mock mode detected, using fallback signature");
          const userAddress = (await signer.getAddress()) as `0x${string}`;
          signature = {
            privateKey: "",
            publicKey: instance.getPublicKey() || "",
            signature: "0x" + "0".repeat(130) as `0x${string}`,
            contractAddresses: [contractAddress as `0x${string}`],
            userAddress,
            startTimestamp: Math.floor(Date.now() / 1000),
            durationDays: 365,
          };
        } else {
          throw sigError;
        }
      }

      if (!signature) {
        throw new Error("Failed to create decryption signature");
      }
      console.log("✅ Signature obtained");

      // Step 3: Get encrypted vote counts
      console.log("📊 Fetching encrypted counts...");
      const encryptedCounts = await contract.getEncryptedCounts(vote.id);
      console.log(`📊 Got ${encryptedCounts.length} encrypted counts`);

      // Step 4: Decrypt using userDecrypt
      console.log("🔓 Decrypting vote counts...");
      const decryptItems = encryptedCounts.map((count: any) => ({
        handle: count,
        contractAddress: contractAddress as `0x${string}`,
      }));

      console.log(`🔍 Decryption parameters:`);
      console.log(`  - Items count: ${decryptItems.length}`);
      console.log(`  - Private key: "${signature.privateKey}" (empty is OK)`);
      console.log(`  - Public key (first 40 chars): ${signature.publicKey.substring(0, 40)}...`);
      console.log(`  - Signature: ${signature.signature.substring(0, 20)}...`);
      console.log(`  - User address: ${signature.userAddress}`);

      const cleanedSignature = signature.signature.replace(/^0x/, "");
      const startTs = signature.startTimestamp.toString();
      const durationStr = signature.durationDays.toString();

      const decryptResult = await instance.userDecrypt(
        decryptItems,
        signature.privateKey,
        signature.publicKey,
        cleanedSignature,
        signature.contractAddresses,
        signature.userAddress,
        startTs,
        durationStr
      );

      // Step 5: Extract and display results
      const decryptedResults: number[] = [];
      console.log("📬 Decrypt result map:", decryptResult);
      for (let i = 0; i < encryptedCounts.length; i++) {
        const handle = encryptedCounts[i];
        const possibleKeys = [
          handle,
          typeof handle === "bigint" ? handle.toString() : "",
          typeof handle === "bigint"
            ? "0x" + handle.toString(16)
            : typeof handle === "string"
            ? handle
            : "",
        ].filter(Boolean) as (string | bigint)[];

        let countValue: bigint | number | undefined;
        for (const key of possibleKeys) {
          if (
            key !== "" &&
            key !== undefined &&
            key !== null &&
            key in decryptResult
          ) {
            countValue = decryptResult[key as keyof typeof decryptResult];
            break;
          }
        }

        if (countValue === undefined) {
          console.warn("⚠️ Could not find decrypted value for handle", handle);
          decryptedResults.push(0);
        } else {
          decryptedResults.push(Number(countValue));
        }
      }

      console.log("✅ Decryption successful! Results:", decryptedResults);
      setResults(decryptedResults);

      // Step 6: Mark as decrypted in contract (optional, for UI state)
      try {
        const countsForContract = decryptedResults.map((value) => BigInt(value));
        const markTx = await contract.markAsDecrypted(vote.id, countsForContract);
        await markTx.wait();
        console.log("✅ Marked as decrypted in contract");
      } catch (e) {
        console.warn("⚠️ Failed to mark as decrypted (non-critical):", e);
      }

      // Refresh the list
      onVoteCast();
      setLoading(false);
    } catch (err: any) {
      console.error("❌ Decryption failed:", err);
      
      // Check for specific error messages
      let errorMessage = err.message || "Failed to decrypt vote";
      if (errorMessage.includes("No votes cast yet") || errorMessage.includes("no votes have been cast yet") || errorMessage.includes("nothing to decrypt")) {
        errorMessage = "⚠️ No votes have been cast yet. Please vote first before requesting decryption.";
      } else if (errorMessage.includes("execution reverted")) {
        errorMessage = "❌ Transaction failed. Make sure at least one vote has been cast.";
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const formatTimeRemaining = (seconds: bigint) => {
    const s = Number(seconds);
    if (s <= 0) return "Ended";
    
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="vote-card">
      <div className="vote-card-header">
        <h3 className="vote-card-title">{vote.title}</h3>
        {status && (
          <span className={`vote-status ${status.isActive ? "active" : "ended"}`}>
            {status.isActive ? "🟢 Active" : "🔴 Ended"}
          </span>
        )}
      </div>

      <p className="vote-card-description">{vote.description}</p>

      <div className="vote-card-info">
        <div className="info-item">
          <span className="info-label">Deadline:</span>
          <span className="info-value">
            {status && formatTimeRemaining(status.timeRemaining)}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Total Voters:</span>
          <span className="info-value">{vote.totalVoters.toString()}</span>
        </div>
      </div>

      {/* FIRST: Check if decrypted and show results */}
      {(vote.isDecrypted || status?.isDecrypted) ? (
        <div className="vote-results">
          <h4 className="results-title">🎯 Results</h4>
          {results.length > 0 ? (
            <>
              {vote.options.map((option, index) => {
                const count = results[index] || 0;
                const total = results.reduce((sum, r) => sum + r, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={index} className="result-item">
                    <div className="result-header">
                      <span className="result-option">{option}</span>
                      <span className="result-count">
                        {count} votes ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="result-bar">
                      <div className="result-bar-fill" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="vote-pending">
              <div className="loader"></div>
              <p className="pending-message">📊 Loading results...</p>
            </div>
          )}
          <button 
            className="btn-secondary" 
            onClick={() => { loadStatus(); loadResults(); }} 
            style={{ marginTop: '1rem', width: '100%' }}
          >
            🔄 Refresh Results
          </button>
        </div>
      ) : status?.isActive && !hasVoted ? (
        <div className="vote-options">
          <h4 className="options-title">Select your choice:</h4>
          {vote.options.map((option, index) => (
            <label key={index} className="option-label">
              <input
                type="radio"
                name={`vote-${vote.id}`}
                value={index}
                checked={selectedOption === index}
                onChange={() => setSelectedOption(index)}
                className="option-radio"
              />
              <span className="option-text">{option}</span>
            </label>
          ))}
          {error && <div className="error-message">{error}</div>}
          <button
            className="btn-primary"
            onClick={handleVote}
            disabled={loading || selectedOption === null}
          >
            {loading ? "⏳ Submitting & syncing..." : "Submit Vote 🔒"}
          </button>
        </div>
      ) : status?.isActive && hasVoted ? (
        <div className="vote-submitted">
          <p className="submitted-message">✅ You have already voted</p>
          <p className="encrypted-note">🔒 Your vote is encrypted</p>
          {!vote.isDecrypted && !status?.isDecrypted && !loading && (
            <>
              {Number(vote.totalVoters) === 0 ? (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <p className="info-note" style={{ fontSize: '0.9rem', color: '#ffa500', marginBottom: '0.5rem' }}>
                    ⏳ Waiting for Sepolia RPC node to sync...
                  </p>
                  <p className="info-note" style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
                    Your vote is confirmed on-chain, but it may take 15-30 seconds to appear.
                  </p>
                  <button 
                    className="btn-secondary" 
                    onClick={() => { loadStatus(); onVoteCast(); }} 
                    disabled={loading}
                    style={{ marginBottom: '0.5rem', width: '100%' }}
                  >
                    🔄 Refresh Status
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={() => handleRequestDecryption(false)} 
                    disabled={loading} 
                    style={{ marginBottom: '0.5rem', width: '100%' }}
                  >
                    Request Decryption 🔓 (Auto-retry)
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={() => handleRequestDecryption(true)} 
                    disabled={loading} 
                    style={{ width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  >
                    ⚡ Force Decrypt (Skip Wait)
                  </button>
                  <p className="info-note" style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                    Force Decrypt will attempt to decrypt even if RPC shows 0 votes
                  </p>
                </div>
              ) : (
                <button className="btn-secondary" onClick={() => handleRequestDecryption(false)} disabled={loading} style={{ marginTop: '1rem' }}>
                  Request Decryption 🔓
                </button>
              )}
            </>
          )}
        </div>
      ) : (status?.isEnded || !status?.isActive) && !vote.isDecrypted && !status?.isDecrypted && !loading ? (
        <div className="vote-ended">
          <p className="ended-message">⏰ Voting has ended</p>
          <button className="btn-primary" onClick={handleRequestDecryption} disabled={loading}>
            Request Decryption 🔓
          </button>
        </div>
      ) : loading ? (
        <div className="vote-pending">
          <div className="loader"></div>
          <p className="pending-message">⏳ Decrypting...</p>
          <p className="pending-note">This may take a few moments.</p>
        </div>
      ) : null}
    </div>
  );
}

