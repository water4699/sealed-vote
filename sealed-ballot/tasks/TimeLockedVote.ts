import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

task("vote:info", "Get information about a specific vote")
  .addParam("voteid", "The vote ID")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    const voteId = taskArgs.voteid;

    const deployment = await deployments.get("TimeLockedVote");
    const contract = await ethers.getContractAt("TimeLockedVote", deployment.address);

    console.log(`\n📊 Vote Information for ID: ${voteId}`);
    console.log("══════════════════════════════════════════════════════════════════");

    try {
      const voteInfo = await contract.getVote(voteId);
      const status = await contract.getVoteStatus(voteId);

      console.log(`\n📝 Title: ${voteInfo[0]}`);
      console.log(`📄 Description: ${voteInfo[1]}`);
      console.log(`\n🗳️  Options:`);
      voteInfo[2].forEach((option: string, idx: number) => {
        console.log(`   [${idx}] ${option}`);
      });
      console.log(`\n⏰ Deadline: ${new Date(Number(voteInfo[3]) * 1000).toLocaleString()}`);
      console.log(`👤 Creator: ${voteInfo[4]}`);
      console.log(`🔓 Is Decrypted: ${voteInfo[5]}`);
      console.log(`⏳ Decryption Pending: ${voteInfo[6]}`);
      console.log(`👥 Total Voters: ${voteInfo[7]}`);
      
      console.log(`\n📈 Status:`);
      console.log(`   Active: ${status[0]}`);
      console.log(`   Ended: ${status[1]}`);
      console.log(`   Decrypted: ${status[2]}`);
      console.log(`   Time Remaining: ${status[3]} seconds`);

      if (voteInfo[5]) {
        // If decrypted, show results
        const results = await contract.getResults(voteId);
        console.log(`\n🎯 Results:`);
        voteInfo[2].forEach((option: string, idx: number) => {
          console.log(`   [${idx}] ${option}: ${results[idx]} votes`);
        });
      }
    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}`);
    }

    console.log("\n══════════════════════════════════════════════════════════════════\n");
  });

task("vote:list", "List all votes").setAction(async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments } = hre;

  const deployment = await deployments.get("TimeLockedVote");
  const contract = await ethers.getContractAt("TimeLockedVote", deployment.address);

  console.log(`\n📋 All Votes`);
  console.log("══════════════════════════════════════════════════════════════════");

  const count = await contract.getVoteCount();
  console.log(`\nTotal Votes: ${count}\n`);

  for (let i = 0; i < count; i++) {
    const voteInfo = await contract.getVote(i);
    const status = await contract.getVoteStatus(i);
    
    console.log(`\n[${i}] ${voteInfo[0]}`);
    console.log(`    Deadline: ${new Date(Number(voteInfo[3]) * 1000).toLocaleString()}`);
    console.log(`    Status: ${status[0] ? "🟢 Active" : status[1] ? "🔴 Ended" : "⚪ Unknown"}`);
    console.log(`    Decrypted: ${voteInfo[5] ? "✅" : "❌"}`);
    console.log(`    Voters: ${voteInfo[7]}`);
  }

  console.log("\n══════════════════════════════════════════════════════════════════\n");
});

