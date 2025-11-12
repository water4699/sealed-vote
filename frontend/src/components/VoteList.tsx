import { useState, useEffect } from "react";
import { useContract } from "../hooks/useContract";
import { VoteCard } from "./VoteCard";

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

export function VoteList({ refresh }: { refresh: number }) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contractPromise = useContract();

  useEffect(() => {
    loadVotes();
  }, [refresh, contractPromise]);

  const loadVotes = async () => {
    setLoading(true);
    setError(null);

    try {
      const contract = await contractPromise;
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      const contractAddress = await contract.getAddress();
      console.log("📍 [VoteList] Reading from contract:", contractAddress);

      const count = await contract.getVoteCount();
      console.log("📊 [VoteList] Total votes in contract:", Number(count));
      const votesData: Vote[] = [];

      for (let i = 0; i < count; i++) {
        const voteInfo = await contract.getVote(i);
        console.log(`📝 [VoteList] Vote ${i} raw data:`, {
          title: voteInfo[0],
          totalVoters: Number(voteInfo[6]),
          isDecrypted: voteInfo[5]
        });
        votesData.push({
          id: i,
          title: voteInfo[0],
          description: voteInfo[1],
          options: voteInfo[2],
          deadline: voteInfo[3],
          creator: voteInfo[4],
          isDecrypted: voteInfo[5],
          totalVoters: voteInfo[6],
        });
      }

      // Sort by deadline (most recent first)
      votesData.sort((a, b) => Number(b.deadline) - Number(a.deadline));
      setVotes(votesData);
    } catch (err: any) {
      console.error("Failed to load votes:", err);
      setError(err.message || "Failed to load votes");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="vote-list">
        <div className="list-header">
          <h2 className="section-title">
            <span className="title-icon">🗳️</span>
            Active Polls
          </h2>
        </div>
        <div className="loading">
          <div className="loader"></div>
          <p>⏳ Loading encrypted votes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vote-list">
        <div className="error-message">
          <span>⚠️</span> {error}
        </div>
      </div>
    );
  }

  if (votes.length === 0) {
    return (
      <div className="vote-list">
        <div className="list-header">
          <h2 className="section-title">
            <span className="title-icon">🗳️</span>
            Active Polls
          </h2>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No polls yet!</h3>
          <p>👈 Create the first encrypted vote to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vote-list">
      <div className="list-header">
        <h2 className="section-title">
          <span className="title-icon">🗳️</span>
          Active Polls
          <span className="vote-count-badge">{votes.length}</span>
        </h2>
        <p className="section-subtitle">🔒 All votes are fully encrypted on-chain</p>
      </div>
      <div className="vote-grid">
        {votes.map((vote) => (
          <VoteCard key={vote.id} vote={vote} onVoteCast={loadVotes} />
        ))}
      </div>
    </div>
  );
}

