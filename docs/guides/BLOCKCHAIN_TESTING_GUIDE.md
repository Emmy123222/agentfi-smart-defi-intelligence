# Blockchain Transaction Testing Guide

## Prerequisites

Before testing blockchain transactions, ensure you have:

1. ✅ **MetaMask installed** in your browser
2. ✅ **Polygon Amoy testnet added** to MetaMask
3. ✅ **Test MATIC tokens** in your wallet (get from faucet)
4. ✅ **Development server running** (`npm run dev`)
5. ✅ **Wallet connected** to the application

## Getting Test MATIC Tokens

You need MATIC tokens on Polygon Amoy testnet to pay for gas fees:

### Option 1: Polygon Faucet
1. Visit: https://faucet.polygon.technology/
2. Select "Polygon Amoy" network
3. Enter your wallet address
4. Click "Submit" to receive test MATIC

### Option 2: Alchemy Faucet
1. Visit: https://www.alchemy.com/faucets/polygon-amoy
2. Sign in with your account
3. Enter your wallet address
4. Receive test MATIC

## Testing Steps

### Test 1: Agent Registration on Blockchain

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open the application**
   - Navigate to: http://localhost:8080
   - Connect your MetaMask wallet
   - Ensure you're on Polygon Amoy network (Chain ID: 80002)

3. **Create a new agent**
   - Click "Create Agent" button
   - Fill in the wizard:
     - **Step 1**: Choose a strategy (Trend Following, Momentum, or Mean Reversion)
     - **Step 2**: Select risk level (Low, Medium, or High)
     - **Step 3**: Choose token pairs (MATIC/USDC, ETH/USDC, etc.)
     - **Step 4**: Configure gas settings and slippage
   - Click "Create Agent"

4. **Watch for MetaMask popup**
   - MetaMask should popup asking you to confirm the transaction
   - Review the transaction details:
     - **To**: AgentRegistry contract (`0xA9BAE8b8Ad03ca4AF9b51B831468681D82f32C07`)
     - **Function**: `registerAgent`
     - **Gas fee**: Should be displayed
   - Click "Confirm" to send the transaction

5. **Verify transaction**
   - After confirmation, you should see a success toast with "View TX" button
   - Click "View TX" to see the transaction on Polygon Amoy explorer
   - Or manually check: https://amoy.polygonscan.com/address/0xA9BAE8b8Ad03ca4AF9b51B831468681D82f32C07

6. **Check browser console**
   - Open DevTools (F12)
   - Look for these log messages:
     ```
     🔗 Starting blockchain registration for agent: [Agent Name]
     ✅ Wallet connected: [Your Address]
     ✅ Network verified: Polygon Amoy
     📝 Sending transaction to AgentRegistry contract...
     ✅ Transaction sent! Hash: 0x...
     🔍 View on explorer: https://amoy.polygonscan.com/tx/0x...
     ⏳ Waiting for transaction confirmation...
     ✅ Transaction confirmed! Block: [Block Number]
     ```

### Test 2: Signal Execution on Blockchain

1. **Navigate to Agent Details**
   - Go to Dashboard
   - Click on the agent you just created

2. **Generate a trading signal**
   - Click "Generate Signal" button
   - Wait for AI to generate the signal

3. **Execute the signal**
   - After signal is generated, it should automatically attempt blockchain execution
   - MetaMask popup should appear asking to confirm trade execution
   - Review the transaction details:
     - **To**: TradeExecutor contract (`0x6BCF7f8CD01EB48287be4c95469Ab2aaf4361eE2`)
     - **Function**: `executeSignal`
   - Click "Confirm"

4. **Verify execution**
   - Check the transaction on explorer
   - Look for console logs:
     ```
     🔗 Executing trading signal on blockchain...
     ✅ Wallet connected: [Your Address]
     ✅ Network verified: Polygon Amoy
     📝 Sending trade execution transaction...
     ✅ Transaction sent! Hash: 0x...
     ✅ Transaction confirmed! Block: [Block Number]
     ```

### Test 3: Agent Status Update on Blockchain

1. **Change agent status**
   - On Agent Details page, click status dropdown
   - Change from "Created" to "Active"

2. **Confirm transaction**
   - MetaMask popup should appear
   - Review transaction to AgentRegistry contract
   - Function: `updateAgentStatus`
   - Confirm the transaction

3. **Verify status update**
   - Check transaction on explorer
   - Verify status changed in the UI

## Troubleshooting

### Issue: No MetaMask Popup

**Possible causes:**
- Wallet not connected
- Wrong network selected
- MetaMask locked

**Solutions:**
1. Click "Connect Wallet" button
2. Switch to Polygon Amoy network in MetaMask
3. Unlock MetaMask
4. Refresh the page

### Issue: "Insufficient MATIC balance"

**Solution:**
- Get test MATIC from faucet (see above)
- You need at least 0.01 MATIC for gas fees

### Issue: "User rejected transaction"

**Solution:**
- This is normal if you clicked "Reject" in MetaMask
- Try again and click "Confirm"

### Issue: Transaction fails

**Possible causes:**
- Insufficient gas
- Contract error
- Network congestion

**Solutions:**
1. Check console for detailed error messages
2. Increase gas limit in MetaMask
3. Try again after a few minutes
4. Check if contract addresses are correct in `.env`

### Issue: "Wallet not connected" error

**Solution:**
1. Ensure MetaMask is installed
2. Click "Connect Wallet" in the app
3. Approve the connection in MetaMask
4. Refresh the page if needed

## Verifying Transactions on Explorer

### Check Agent Registration
1. Go to: https://amoy.polygonscan.com/address/0xA9BAE8b8Ad03ca4AF9b51B831468681D82f32C07
2. Click "Transactions" tab
3. Look for your recent transaction
4. Click on the transaction hash
5. Verify:
   - Status: Success ✅
   - Function: `registerAgent`
   - From: Your wallet address

### Check Trade Execution
1. Go to: https://amoy.polygonscan.com/address/0x6BCF7f8CD01EB48287be4c95469Ab2aaf4361eE2
2. Click "Transactions" tab
3. Find your trade execution transaction
4. Verify:
   - Status: Success ✅
   - Function: `executeSignal`
   - From: Your wallet address

## Expected Console Output

When everything works correctly, you should see:

```
🚀 Starting integrated agent creation...
📝 Creating agent in database...
✅ Agent created in database: [UUID]
⛓️ Registering agent on blockchain...
🔗 Starting blockchain registration for agent: [Name]
✅ Wallet connected: 0x...
✅ Network verified: Polygon Amoy
📝 Sending transaction to AgentRegistry contract...
Contract address: 0xA9BAE8b8Ad03ca4AF9b51B831468681D82f32C07
Agent name: [Your Agent Name]
Allocated amount: [Amount] MATIC
✅ Transaction sent! Hash: 0x...
🔍 View on explorer: https://amoy.polygonscan.com/tx/0x...
⏳ Waiting for transaction confirmation...
✅ Transaction confirmed! Block: [Block Number]
✅ Agent registered on blockchain: 0x...
🤖 Generating initial AI market analysis...
✅ Initial AI analysis completed
```

## Testing Checklist

Use this checklist to ensure all blockchain features work:

- [ ] MetaMask installed and configured
- [ ] Polygon Amoy network added
- [ ] Test MATIC tokens received
- [ ] Wallet connected to application
- [ ] Agent creation triggers MetaMask popup
- [ ] Agent registration transaction confirmed
- [ ] Transaction visible on Polygon Amoy explorer
- [ ] Signal generation works
- [ ] Signal execution triggers MetaMask popup
- [ ] Trade execution transaction confirmed
- [ ] Status update triggers MetaMask popup
- [ ] Status update transaction confirmed
- [ ] All transactions show "Success" status on explorer
- [ ] Console logs show detailed transaction info

## Contract Addresses (Polygon Amoy)

For reference, here are the deployed contract addresses:

- **AgentRegistry**: `0xA9BAE8b8Ad03ca4AF9b51B831468681D82f32C07`
- **PerformanceTracker**: `0x9F3A4FB66482825ec898b90Cc4D3711F260782cF`
- **TradeExecutor**: `0x6BCF7f8CD01EB48287be4c95469Ab2aaf4361eE2`
- **MockDEXAggregator**: `0xb3Deb8ca39Ad8156cb4419C0291e80a27b2447aF`

## Next Steps After Successful Testing

Once you've confirmed transactions are working:

1. ✅ Document any issues encountered
2. ✅ Test with different wallet addresses
3. ✅ Test with different agent configurations
4. ✅ Monitor gas costs for optimization
5. ✅ Test error handling (reject transactions, insufficient funds, etc.)
6. ✅ Verify all events are emitted correctly
7. ✅ Test on different browsers (Chrome, Firefox, Brave)

## Support

If you encounter issues:
1. Check browser console for detailed error messages
2. Verify contract addresses in `.env` file
3. Ensure you're on Polygon Amoy testnet
4. Check you have sufficient test MATIC
5. Review the transaction on Polygon Amoy explorer for error details

---

**Last Updated**: February 21, 2026
