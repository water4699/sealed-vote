import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log(`\n🚀 Deploying TimeLockedVote contract with account: ${deployer}`);

  const deployedContract = await deploy("TimeLockedVote", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });

  console.log(`✅ TimeLockedVote contract deployed at: ${deployedContract.address}`);
  console.log(`   Transaction hash: ${deployedContract.transactionHash}`);
  
  return true;
};

export default func;
func.id = "deploy_timeLockedVote";
func.tags = ["TimeLockedVote"];

