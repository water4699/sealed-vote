import { useState } from "react";
import { useContract } from "../hooks/useContract";

export function CreateVote({ onVoteCreated }: { onVoteCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState("3600");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contractPromise = useContract();

  const handleAddOption = () => {
    if (options.length < 16) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title || !description) {
      setError("Title and description are required");
      return;
    }

    const validOptions = options.filter((opt) => opt.trim() !== "");
    if (validOptions.length < 2) {
      setError("At least 2 options are required");
      return;
    }

    setLoading(true);

    try {
      const contract = await contractPromise;
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      const tx = await contract.createVote(title, description, validOptions, Number(duration));
      await tx.wait();

      // Reset form
      setTitle("");
      setDescription("");
      setOptions(["", ""]);
      setDuration("3600");
      
      onVoteCreated();
    } catch (err: any) {
      console.error("Failed to create vote:", err);
      setError(err.message || "Failed to create vote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">
        <span className="title-icon">📝</span>
        Create New Vote
      </h2>
      <div className="card-description">
        <p>✨ Create a secure encrypted voting poll</p>
      </div>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            📌 Title
          </label>
          <input
            id="title"
            type="text"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter vote title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            📄 Description
          </label>
          <textarea
            id="description"
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter vote description"
            rows={3}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">✅ Options</label>
          {options.map((option, index) => (
            <div key={index} className="option-row">
              <input
                type="text"
                className="form-input"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleRemoveOption(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {options.length < 16 && (
            <button type="button" className="btn-secondary" onClick={handleAddOption}>
              ➕ Add Option
            </button>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="duration" className="form-label">
            ⏰ Duration (seconds)
          </label>
          <input
            id="duration"
            type="number"
            className="form-input"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="60"
            required
          />
          <small className="form-hint">
            Common values: 3600 (1 hour), 86400 (1 day), 604800 (1 week)
          </small>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "🔄 Creating..." : "🚀 Create Vote"}
        </button>
      </form>
    </div>
  );
}

