import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { TimeLockedVote } from "../types";
import { expect } from "chai";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("TimeLockedVoteSepolia", function () {
  let signers: Signers;
  let contract: TimeLockedVote;
  let contractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const deployment = await deployments.get("TimeLockedVote");
      contractAddress = deployment.address;
      contract = await ethers.getContractAt("TimeLockedVote", deployment.address);
      console.log(`📍 Using deployed contract at: ${contractAddress}`);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia' first";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should create a vote and cast encrypted votes on Sepolia", async function () {
    this.timeout(4 * 60000); // 4 minutes timeout for testnet operations
    steps = 8;

    progress("Creating a new vote...");
    const title = "Test Vote on Sepolia";
    const description = "Testing time-locked encrypted voting";
    const options = ["Option A", "Option B", "Option C"];
    const duration = 3600; // 1 hour

    let tx = await contract.connect(signers.alice).createVote(title, description, options, duration);
    await tx.wait();
    progress("Vote created successfully ✅");

    progress("Getting vote count...");
    const voteCount = await contract.getVoteCount();
    const voteId = voteCount - 1n;
    progress(`Vote ID: ${voteId}`);

    progress("Getting vote information...");
    const voteInfo = await contract.getVote(voteId);
    expect(voteInfo[0]).to.equal(title);
    expect(voteInfo[2]).to.deep.equal(options);
    progress("Vote info verified ✅");

    progress("Encrypting vote for Option 0...");
    const encryptedVote = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(0)
      .encrypt();
    progress(`Encrypted vote handle: ${ethers.hexlify(encryptedVote.handles[0])}`);

    progress("Casting encrypted vote...");
    tx = await contract.connect(signers.alice).castVote(voteId, encryptedVote.handles[0], encryptedVote.inputProof);
    await tx.wait();
    progress("Vote cast successfully ✅");

    progress("Verifying vote was recorded...");
    const hasVoted = await contract.hasUserVoted(voteId, signers.alice.address);
    expect(hasVoted).to.be.true;

    const updatedVoteInfo = await contract.getVote(voteId);
    expect(updatedVoteInfo[7]).to.equal(1n); // totalVoters should be 1
    progress(`Total voters: ${updatedVoteInfo[7]} ✅`);

    progress("Getting vote status...");
    const status = await contract.getVoteStatus(voteId);
    console.log(`   Active: ${status[0]}`);
    console.log(`   Ended: ${status[1]}`);
    console.log(`   Decrypted: ${status[2]}`);
    console.log(`   Time Remaining: ${status[3]} seconds`);

    progress("✨ All tests passed on Sepolia!");
  });

  it("should get encrypted counts", async function () {
    this.timeout(2 * 60000);
    steps = 3;

    progress("Getting vote count...");
    const voteCount = await contract.getVoteCount();
    
    if (voteCount === 0n) {
      console.log("⚠️  No votes available. Run the first test to create a vote.");
      this.skip();
    }

    const voteId = voteCount - 1n;

    progress("Getting encrypted counts...");
    const encryptedCounts = await contract.getEncryptedCounts(voteId);
    progress(`Encrypted counts length: ${encryptedCounts.length}`);

    expect(encryptedCounts.length).to.be.greaterThan(0);
    progress("✅ Encrypted counts retrieved successfully");
  });
});

