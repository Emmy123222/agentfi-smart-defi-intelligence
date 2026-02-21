const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting AgentFi Smart Contract Deployment...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MATIC\n");

  // Deploy AgentRegistry
  console.log("📋 Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("✅ AgentRegistry deployed to:", agentRegistryAddress);

  // Deploy PerformanceTracker
  console.log("\n📊 Deploying PerformanceTracker...");
  const PerformanceTracker = await ethers.getContractFactory("PerformanceTracker");
  const performanceTracker = await PerformanceTracker.deploy(agentRegistryAddress);
  await performanceTracker.waitForDeployment();
  const performanceTrackerAddress = await performanceTracker.getAddress();
  console.log("✅ PerformanceTracker deployed to:", performanceTrackerAddress);

  // Deploy Mock DEX Aggregator (for testing)
  console.log("\n🔄 Deploying MockDEXAggregator...");
  const MockDEXAggregator = await ethers.getContractFactory("MockDEXAggregator");
  const mockDEXAggregator = await MockDEXAggregator.deploy();
  await mockDEXAggregator.waitForDeployment();
  const mockDEXAggregatorAddress = await mockDEXAggregator.getAddress();
  console.log("✅ MockDEXAggregator deployed to:", mockDEXAggregatorAddress);

  // Deploy TradeExecutor
  console.log("\n⚡ Deploying TradeExecutor...");
  const TradeExecutor = await ethers.getContractFactory("TradeExecutor");
  const tradeExecutor = await TradeExecutor.deploy(agentRegistryAddress, mockDEXAggregatorAddress);
  await tradeExecutor.waitForDeployment();
  const tradeExecutorAddress = await tradeExecutor.getAddress();
  console.log("✅ TradeExecutor deployed to:", tradeExecutorAddress);

  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AgentRegistry: {
        address: agentRegistryAddress,
        constructorArgs: []
      },
      PerformanceTracker: {
        address: performanceTrackerAddress,
        constructorArgs: [agentRegistryAddress]
      },
      MockDEXAggregator: {
        address: mockDEXAggregatorAddress,
        constructorArgs: []
      },
      TradeExecutor: {
        address: tradeExecutorAddress,
        constructorArgs: [agentRegistryAddress, mockDEXAggregatorAddress]
      }
    }
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📄 Deployment Summary:");
  console.log("=".repeat(50));
  console.log(`Network: ${hre.network.name}`);
  console.log(`Chain ID: ${deploymentInfo.chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("\n📋 Contract Addresses:");
  console.log(`AgentRegistry: ${agentRegistryAddress}`);
  console.log(`PerformanceTracker: ${performanceTrackerAddress}`);
  console.log(`MockDEXAggregator: ${mockDEXAggregatorAddress}`);
  console.log(`TradeExecutor: ${tradeExecutorAddress}`);
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  console.log("\n🔍 Verification Commands:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${agentRegistryAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${performanceTrackerAddress} ${agentRegistryAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${mockDEXAggregatorAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${tradeExecutorAddress} ${agentRegistryAddress} ${mockDEXAggregatorAddress}`);

  console.log("\n✅ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });