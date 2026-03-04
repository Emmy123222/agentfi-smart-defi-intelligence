# Quick Fix: Network Issue

## Problem
You're currently on **Ethereum Mainnet (Chain ID: 1)** but need to be on **Polygon Amoy Testnet (Chain ID: 80002)**.

## Solution: Manually Switch Network in MetaMask

### Step 1: Open MetaMask
Click on the MetaMask extension in your browser

### Step 2: Click Network Dropdown
At the top of MetaMask, you'll see the current network (probably says "Ethereum Mainnet")
Click on it to open the network dropdown

### Step 3: Add Polygon Amoy (if not already added)
If you don't see "Polygon Amoy" in the list:

1. Click "Add Network" or "Add a network manually"
2. Enter these details:
   - **Network Name**: Polygon Amoy Testnet
   - **RPC URL**: `https://rpc-amoy.polygon.technology`
   - **Chain ID**: `80002`
   - **Currency Symbol**: MATIC
   - **Block Explorer**: `https://amoy.polygonscan.com`
3. Click "Save"

### Step 4: Select Polygon Amoy
Click on "Polygon Amoy Testnet" from the network list

### Step 5: Verify
You should now see "Polygon Amoy Testnet" at the top of MetaMask

### Step 6: Try Creating Agent Again
Go back to the app and try creating an agent again. The blockchain registration should now work!

## Get Test MATIC
You need MATIC tokens to pay for gas fees:

1. Visit: https://faucet.polygon.technology/
2. Select "Polygon Amoy"
3. Enter your wallet address
4. Click "Submit"
5. Wait a few seconds for tokens to arrive

## Expected Behavior After Fix

When you create an agent:
1. ✅ Agent created in database
2. ✅ Network check passes (you're on Polygon Amoy)
3. ✅ **MetaMask popup appears** asking you to sign transaction
4. ✅ You click "Confirm"
5. ✅ Transaction is sent to blockchain
6. ✅ You see transaction hash and success message

---

**Current Issue**: You're on Ethereum Mainnet (Chain ID 1)
**Required Network**: Polygon Amoy (Chain ID 80002)
**Action**: Manually switch network in MetaMask before creating agent
