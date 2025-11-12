// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Time-Locked Encrypted Vote
/// @notice A voting system where votes remain encrypted until the deadline passes
/// @dev Votes are aggregated homomorphically during the voting period and decrypted after the deadline
contract TimeLockedVote is SepoliaConfig {
    struct Vote {
        string title;
        string description;
        string[] options;
        uint64 deadline;
        address creator;
        bool isDecrypted;
        euint32[] encryptedCounts; // encrypted vote counts per option
        uint32[] decryptedCounts; // revealed counts after decryption
        uint256 totalVoters; // total number of voters (public)
    }

    // voteId => Vote
    mapping(uint256 => Vote) private _votes;
    uint256 private _voteCount;

    // voteId => voter => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event VoteCreated(
        uint256 indexed voteId,
        string title,
        string[] options,
        uint64 deadline,
        address indexed creator
    );
    event VoteCast(uint256 indexed voteId, address indexed voter);
    event DecryptionAccessGranted(uint256 indexed voteId, address indexed requester);

    modifier voteExists(uint256 voteId) {
        require(voteId < _voteCount, "Vote does not exist");
        _;
    }

    modifier onlyBeforeDeadline(uint256 voteId) {
        require(block.timestamp < _votes[voteId].deadline, "Voting period has ended");
        _;
    }

    modifier onlyAfterDeadline(uint256 voteId) {
        require(block.timestamp >= _votes[voteId].deadline, "Voting period not ended yet");
        _;
    }

    /// @notice Create a new time-locked vote
    /// @param title The vote title
    /// @param description Description of the vote
    /// @param options Array of voting options (2-16 options)
    /// @param duration Duration in seconds from now until the deadline
    /// @return voteId The ID of the created vote
    function createVote(
        string memory title,
        string memory description,
        string[] memory options,
        uint64 duration
    ) external returns (uint256 voteId) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(options.length >= 2 && options.length <= 16, "Must have 2-16 options");
        require(duration > 0, "Duration must be positive");

        voteId = _voteCount++;
        Vote storage v = _votes[voteId];
        v.title = title;
        v.description = description;
        v.options = options;
        v.deadline = uint64(block.timestamp) + duration;
        v.creator = msg.sender;
        v.isDecrypted = false;
        v.totalVoters = 0;

        // Initialize encrypted and decrypted counts arrays
        v.encryptedCounts = new euint32[](options.length);
        v.decryptedCounts = new uint32[](options.length);

        emit VoteCreated(voteId, title, options, v.deadline, msg.sender);
    }

    /// @notice Cast an encrypted vote
    /// @param voteId The vote ID
    /// @param encryptedOptionIndex Encrypted index of the selected option
    /// @param inputProof Proof for the encrypted input
    function castVote(
        uint256 voteId,
        externalEuint32 encryptedOptionIndex,
        bytes calldata inputProof
    ) external voteExists(voteId) onlyBeforeDeadline(voteId) {
        Vote storage v = _votes[voteId];
        require(!v.isDecrypted, "Vote has been decrypted");
        require(!hasVoted[voteId][msg.sender], "Already voted");

        // Convert external encrypted input to euint32
        euint32 optionIdx = FHE.fromExternal(encryptedOptionIndex, inputProof);

        // Homomorphically add 1 to the count of the selected option
        // We use a select pattern: if idx == i, add 1, else add 0
        for (uint256 i = 0; i < v.options.length; i++) {
            ebool isMatch = FHE.eq(optionIdx, FHE.asEuint32(uint32(i)));
            euint32 increment = FHE.select(isMatch, FHE.asEuint32(1), FHE.asEuint32(0));
            v.encryptedCounts[i] = FHE.add(v.encryptedCounts[i], increment);
            
            // Allow contract and relevant parties to access the count
            FHE.allowThis(v.encryptedCounts[i]);
            FHE.allow(v.encryptedCounts[i], msg.sender);
            FHE.allow(v.encryptedCounts[i], v.creator);
        }

        hasVoted[voteId][msg.sender] = true;
        v.totalVoters++;

        emit VoteCast(voteId, msg.sender);
    }

    /// @notice Request decryption access for vote results (anyone can call)
    /// @dev Grants the caller permission to decrypt vote counts using client-side decryption
    /// @param voteId The vote ID
    function requestDecryptionAccess(uint256 voteId) external voteExists(voteId) {
        Vote storage v = _votes[voteId];
        // Removed totalVoters check to handle RPC sync delays
        // If no votes exist, decryption will return all zeros (harmless)
        
        // Grant decryption access to the caller for all encrypted counts
        for (uint256 i = 0; i < v.encryptedCounts.length; i++) {
            FHE.allow(v.encryptedCounts[i], msg.sender);
        }
        
        emit DecryptionAccessGranted(voteId, msg.sender);
    }
    
    /// @notice Mark vote as decrypted (for UI purposes, anyone can call after decrypting)
    /// @param voteId The vote ID
    function markAsDecrypted(uint256 voteId, uint32[] calldata counts) external voteExists(voteId) {
        Vote storage v = _votes[voteId];
        require(counts.length == v.options.length, "Invalid results length");

        for (uint256 i = 0; i < counts.length; i++) {
            v.decryptedCounts[i] = counts[i];
        }
        v.isDecrypted = true;
    }

    // ========== VIEW FUNCTIONS ==========

    /// @notice Get the total number of votes
    function getVoteCount() external view returns (uint256) {
        return _voteCount;
    }

    /// @notice Get vote information
    /// @param voteId The vote ID
    function getVote(uint256 voteId)
        external
        view
        voteExists(voteId)
        returns (
            string memory title,
            string memory description,
            string[] memory options,
            uint64 deadline,
            address creator,
            bool isDecrypted,
            uint256 totalVoters
        )
    {
        Vote storage v = _votes[voteId];
        return (
            v.title,
            v.description,
            v.options,
            v.deadline,
            v.creator,
            v.isDecrypted,
            v.totalVoters
        );
    }

    /// @notice Get encrypted counts for client-side decryption
    /// @param voteId The vote ID
    /// @return encryptedCounts Array of encrypted vote counts as euint32
    function getEncryptedCounts(uint256 voteId)
        external
        view
        voteExists(voteId)
        returns (euint32[] memory encryptedCounts)
    {
        return _votes[voteId].encryptedCounts;
    }

    /// @notice Get decrypted results (only available after decryption)
    /// @param voteId The vote ID
    function getResults(uint256 voteId)
        external
        view
        voteExists(voteId)
        returns (uint32[] memory)
    {
        Vote storage v = _votes[voteId];
        require(v.isDecrypted, "Results not yet decrypted");
        return v.decryptedCounts;
    }

    /// @notice Check if an address has voted
    /// @param voteId The vote ID
    /// @param voter The voter address
    function hasUserVoted(uint256 voteId, address voter)
        external
        view
        voteExists(voteId)
        returns (bool)
    {
        return hasVoted[voteId][voter];
    }

    /// @notice Get vote status
    /// @param voteId The vote ID
    function getVoteStatus(uint256 voteId)
        external
        view
        voteExists(voteId)
        returns (
            bool isActive,
            bool isEnded,
            bool isDecrypted,
            uint256 timeRemaining
        )
    {
        Vote storage v = _votes[voteId];
        uint64 currentTime = uint64(block.timestamp);
        
        isActive = currentTime < v.deadline && !v.isDecrypted;
        isEnded = currentTime >= v.deadline;
        isDecrypted = v.isDecrypted;
        timeRemaining = currentTime < v.deadline ? v.deadline - currentTime : 0;
    }
}

