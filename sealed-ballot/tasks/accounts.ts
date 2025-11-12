import { task } from "hardhat/config";

task("accounts", "Prints the list of accounts with their balances", async (_taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  console.log("\n📋 Available accounts:");
  console.log("══════════════════════════════════════════════════════════════════");

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const balance = await hre.ethers.provider.getBalance(account.address);
    const balanceInEth = hre.ethers.formatEther(balance);
    
    console.log(`\n[${i}] ${account.address}`);
    console.log(`    Balance: ${balanceInEth} ETH`);
  }
  
  console.log("\n══════════════════════════════════════════════════════════════════\n");
});

