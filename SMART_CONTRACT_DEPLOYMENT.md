# 🚀 AgentFi Smart Contract Deployment Guide - Polygon Amoy

## 📋 Prerequisites

### **1. Install Dependencies**
```bash
npm install
```

### **2. Get Required Keys**

#### **Private Key** (Your Wallet)
- Export private key from MetaMask
- **⚠️ KEEP SECURE** - Never commit to git
- Add to `.env` file: `PRIVATE_KEY="your_private_key_here"`

#### **Polygonscan API Key** (For Verification)
- Go to [polygonscan.com/apis](https://polygonscan.com/apis)
- Create account → Generate API key
- Add to `.env` file: `POLYGONSCAN_API_KEY="your_api_key"`

#### **Get Test MATIC** (For Amoy Testnet)
- Go to [Polygon Amoy Faucet](https://faucet.polygon.technology/)
- Select "Polygon Amoy" network
- Enter your wallet address
- Request test MATIC tokens

## 🎯 Deployment Options

### **Option 1: Polygon Amoy Testnet (Recommended for Testing)**

```bash
# 1. Compile contracts
npm run compile

# 2. Deploy to Amoy testnet
npm run deploy:amoy

# 3. Verify contracts (optional)
npm run verify:amoy
```

### **Option 2: Polygon Mainnet (Production)**

```bash
# 1. Ensure you have real MATIC for gas fees
# 2. Deploy to Polygon mainnet
npm run deploy:polygon

# 3. Verify contracts
npm run verify:polygon
```

## 📊 What Gets Deployed

### **Smart Contracts:**
1. **AgentRegistry.sol** - Agent registration and ownership
2. **PerformanceTracker.sol** - On-chain P&L tracking
3. **TradeExecutor.sol** - Trade execution via DEX
4. **MockDEXAggregator.sol** - Mock DEX for testing

### **Deployment Output:**
- Contract addresses saved to `deployments/{network}.json`
- Verification commands provided
- Gas costs and transaction hashes logged

## 🔧 Configuration

### **Network Settings** (hardhat.config.js)
```javascript
networks: {
  polygonAmoy: {
    url: "https://rpc-amoy.polygon.technology",
    chainId: 80002,
    gasPrice: 35000000000, // 35 gwei
  },
  polygon: {
    url: "https://polygon-rpc.com", 
    chainId: 137,
    gasPrice: 35000000000, // 35 gwei
  }
}
```

### **Environment Variables** (.env)
```env
# Required for deployment
PRIVATE_KEY="your_wallet_private_key"
POLYGONSCAN_API_KEY="your_polygonscan_api_key"

# Optional - custom RPC endpoints
POLYGON_AMOY_RPC="https://rpc-amoy.polygon.technology"
POLYGON_RPC="https://polygon-rpc.com"
```

## 📋 Step-by-Step Deployment

### **Step 1: Setup Environment**
```bash
# 1. Copy your private key from MetaMask
# 2. Add to .env file (keep secure!)
echo 'PRIVATE_KEY="your_private_key_here"' >> .env

# 3. Get Polygonscan API key and add it
echo 'POLYGONSCAN_API_KEY="your_api_key"' >> .env
```

### **Step 2: Get Test Tokens** (Amoy only)
```bash
# Visit Amoy faucet and get test MATIC
# https://faucet.polygon.technology/
# Select "Polygon Amoy" network
```

### **Step 3: Deploy Contracts**
```bash
# Compile first
npm run compile

# Deploy to Amoy testnet
npm run deploy:amoy

# Or deploy to Polygon mainnet
npm run deploy:polygon
```

### **Step 4: Verify Contracts** (Optional)
```bash
# Verify on Amoy
npm run verify:amoy

# Or verify on Polygon
npm run verify:polygon
```

## 📄 Deployment Output Example

```
🚀 Starting AgentFi Smart Contract Deployment...

📝 Deploying contracts with account: 0x1234...5678
💰 Account balance: 1.5 MATIC

📋 Deploying AgentRegistry...
✅ AgentRegistry deployed to: 0xABC123...

📊 Deploying PerformanceTracker...
✅ PerformanceTracker deployed to: 0xDEF456...

🔄 Deploying MockDEXAggregator...
✅ MockDEXAggregator deployed to: 0x789GHI...

⚡ Deploying TradeExecutor...
✅ TradeExecutor deployed to: 0x012JKL...

📄 Deployment Summary:
==================================================
Network: polygonAmoy
Chain ID: 80002
Deployer: 0x1234...5678

📋 Contract Addresses:
AgentRegistry: 0xABC123...
PerformanceTracker: 0xDEF456...
MockDEXAggregator: 0x789GHI...
TradeExecutor: 0x012JKL...

💾 Deployment info saved to: deployments/polygonAmoy.json
✅ Deployment completed successfully!
```

## 🔍 Contract Verification

After deployment, verify your contracts on Amoy Polygonscan:

```bash
# Individual verification commands (auto-generated)
npx hardhat verify --network polygonAmoy 0xABC123...
npx hardhat verify --network polygonAmoy 0xDEF456... 0xABC123...
npx hardhat verify --network polygonAmoy 0x789GHI...
npx hardhat verify --network polygonAmoy 0x012JKL... 0xABC123... 0x789GHI...
```

## 🔗 Integration with Frontend

After deployment, update your frontend with contract addresses:

```typescript
// src/config/contracts.ts
export const CONTRACTS = {
  AgentRegistry: "0xABC123...",
  PerformanceTracker: "0xDEF456...",
  TradeExecutor: "0x012JKL...",
  MockDEXAggregator: "0x789GHI..."
};
```

## 🌐 **Amoy Testnet Details**

- **Chain ID**: 80002
- **RPC URL**: https://rpc-amoy.polygon.technology
- **Explorer**: https://amoy.polygonscan.com
- **Faucet**: https://faucet.polygon.technology/ (select Amoy)
- **Currency**: Test MATIC

## 🚨 Security Notes

### **Private Key Security:**
- ✅ Never commit private keys to git
- ✅ Use environment variables
- ✅ Consider using hardware wallets for mainnet
- ✅ Use separate wallets for development/production

### **Gas Optimization:**
- ✅ Contracts are optimized for gas efficiency
- ✅ Use appropriate gas prices for network conditions
- ✅ Monitor gas costs during deployment

### **Testing:**
- ✅ Deploy to Amoy testnet first
- ✅ Test all contract functions
- ✅ Verify contract interactions work correctly
- ✅ Only deploy to mainnet after thorough testing

## 🛠️ Troubleshooting

### **Common Issues:**

1. **Insufficient Balance**
   ```
   Error: insufficient funds for gas * price + value
   ```
   **Solution:** Get more MATIC from Amoy faucet

2. **Network Connection Issues**
   ```
   Error: could not detect network
   ```
   **Solution:** Check RPC URLs in hardhat.config.js

3. **Private Key Issues**
   ```
   Error: invalid private key
   ```
   **Solution:** Ensure private key is correct (without 0x prefix in .env)

4. **Verification Failures**
   ```
   Error: contract verification failed
   ```
   **Solution:** Wait a few minutes after deployment, then retry

---

**Ready to deploy your AgentFi smart contracts to Polygon Amoy! 🚀**