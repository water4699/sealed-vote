import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { TimeLockedVote, TimeLockedVote__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("TimeLockedVote")) as TimeLockedVote__factory;
  const contract = (await factory.deploy()) as TimeLockedVote;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("TimeLockedVote", function () {
  let signers: Signers;
  let contract: TimeLockedVote;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3],
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This test suite can only run on FHEVM mock environment`);
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  describe("Vote Creation", function () {
    it("should create a new vote successfully", async function () {
      const title = "Choose Project Direction";
      const description = "Select the next feature to implement";
      const options = ["Feature A", "Feature B", "Feature C"];
      const duration = 3600; // 1 hour

      const tx = await contract.connect(signers.alice).createVote(title, description, options, duration);
      await tx.wait();

      const voteCount = await contract.getVoteCount();
      expect(voteCount).to.equal(1n);

      const voteInfo = await contract.getVote(0);
      expect(voteInfo[0]).to.equal(title);
      expect(voteInfo[1]).to.equal(description);
      expect(voteInfo[2]).to.deep.equal(options);
      expect(voteInfo[4]).to.equal(signers.alice.address);
      expect(voteInfo[5]).to.equal(false); // isDecrypted
      expect(voteInfo[7]).to.equal(0n); // totalVoters
    });

    it("should fail to create vote with invalid options", async function () {
      await expect(
        contract.connect(signers.alice).createVote("Test", "Test", ["Only One"], 3600)
      ).to.be.revertedWith("Must have 2-16 options");
    });

    it("should fail to create vote with zero duration", async function () {
      await expect(
        contract.connect(signers.alice).createVote("Test", "Test", ["A", "B"], 0)
      ).to.be.revertedWith("Duration must be positive");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      // Create a vote
      const title = "Test Vote";
      const description = "Test Description";
      const options = ["Option A", "Option B"];
      const duration = 3600;

      const tx = await contract.connect(signers.alice).createVote(title, description, options, duration);
      await tx.wait();
    });

    it("should allow user to cast encrypted vote", async function () {
      const voteId = 0;
      const selectedOption = 0; // Vote for "Option A"

      // Encrypt the vote
      const encryptedVote = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(selectedOption)
        .encrypt();

      const tx = await contract
        .connect(signers.bob)
        .castVote(voteId, encryptedVote.handles[0], encryptedVote.inputProof);
      await tx.wait();

      // Check that the user has voted
      const hasVoted = await contract.hasUserVoted(voteId, signers.bob.address);
      expect(hasVoted).to.be.true;

      // Check voter count increased
      const voteInfo = await contract.getVote(voteId);
      expect(voteInfo[7]).to.equal(1n); // totalVoters
    });

    it("should allow multiple users to vote", async function () {
      const voteId = 0;

      // Alice votes for option 0
      const aliceVote = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(0)
        .encrypt();
      await contract.connect(signers.alice).castVote(voteId, aliceVote.handles[0], aliceVote.inputProof);

      // Bob votes for option 1
      const bobVote = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(1)
        .encrypt();
      await contract.connect(signers.bob).castVote(voteId, bobVote.handles[0], bobVote.inputProof);

      // Charlie votes for option 0
      const charlieVote = await fhevm
        .createEncryptedInput(contractAddress, signers.charlie.address)
        .add32(0)
        .encrypt();
      await contract.connect(signers.charlie).castVote(voteId, charlieVote.handles[0], charlieVote.inputProof);

      // Check voter count
      const voteInfo = await contract.getVote(voteId);
      expect(voteInfo[7]).to.equal(3n);
    });

    it("should prevent double voting", async function () {
      const voteId = 0;

      const encryptedVote = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(0)
        .encrypt();

      // First vote
      await contract.connect(signers.bob).castVote(voteId, encryptedVote.handles[0], encryptedVote.inputProof);

      // Second vote should fail
      await expect(
        contract.connect(signers.bob).castVote(voteId, encryptedVote.handles[0], encryptedVote.inputProof)
      ).to.be.revertedWith("Already voted");
    });
  });

  describe("Vote Status", function () {
    it("should correctly report vote status", async function () {
      const duration = 3600;
      const tx = await contract.connect(signers.alice).createVote("Test", "Test", ["A", "B"], duration);
      await tx.wait();

      const status = await contract.getVoteStatus(0);
      expect(status[0]).to.be.true; // isActive
      expect(status[1]).to.be.false; // isEnded (not yet)
      expect(status[2]).to.be.false; // isDecrypted
      expect(status[3]).to.be.greaterThan(0); // timeRemaining
    });
  });

  describe("Encrypted Counts", function () {
    it("should return encrypted counts", async function () {
      // Create vote
      const tx = await contract.connect(signers.alice).createVote("Test", "Test", ["A", "B", "C"], 3600);
      await tx.wait();

      // Cast some votes
      for (let i = 0; i < 3; i++) {
        const vote = await fhevm
          .createEncryptedInput(contractAddress, signers[i === 0 ? "alice" : i === 1 ? "bob" : "charlie"].address)
          .add32(i % 2) // Alternate between options
          .encrypt();

        await contract
          .connect(signers[i === 0 ? "alice" : i === 1 ? "bob" : "charlie"])
          .castVote(0, vote.handles[0], vote.inputProof);
      }

      // Get encrypted counts
      const encryptedCounts = await contract.getEncryptedCounts(0);
      expect(encryptedCounts.length).to.equal(3);
      
      // All counts should be non-zero (encrypted values)
      encryptedCounts.forEach((count) => {
        expect(count).to.not.equal(ethers.ZeroHash);
      });
    });
  });

  describe("View Functions", function () {
    it("should get vote count", async function () {
      expect(await contract.getVoteCount()).to.equal(0n);

      await contract.connect(signers.alice).createVote("Vote 1", "Desc", ["A", "B"], 3600);
      expect(await contract.getVoteCount()).to.equal(1n);

      await contract.connect(signers.bob).createVote("Vote 2", "Desc", ["X", "Y"], 3600);
      expect(await contract.getVoteCount()).to.equal(2n);
    });

    it("should check if user has voted", async function () {
      await contract.connect(signers.alice).createVote("Test", "Test", ["A", "B"], 3600);

      expect(await contract.hasUserVoted(0, signers.bob.address)).to.be.false;

      const vote = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(0)
        .encrypt();

      await contract.connect(signers.bob).castVote(0, vote.handles[0], vote.inputProof);

      expect(await contract.hasUserVoted(0, signers.bob.address)).to.be.true;
    });
  });
});

