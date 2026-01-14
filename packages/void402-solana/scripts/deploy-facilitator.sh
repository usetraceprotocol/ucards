#!/bin/bash

# Script to build and deploy the facilitator program
# Usage: ./scripts/deploy-facilitator.sh [network]
# Network: devnet (default) or mainnet-beta

set -e

NETWORK=${1:-devnet}

echo "🚀 Building and deploying Void402 Facilitator Program..."
echo "Network: $NETWORK"
echo ""

# Check if anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Error: Anchor CLI not found"
    echo "Install it with: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    exit 1
fi

# Check if solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Error: Solana CLI not found"
    echo "Install it from: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

# Set network in Anchor.toml
if [ "$NETWORK" = "mainnet-beta" ]; then
    CLUSTER="mainnet"
    RPC_URL="https://api.mainnet-beta.solana.com"
else
    CLUSTER="devnet"
    RPC_URL="https://api.devnet.solana.com"
fi

echo "📡 Using cluster: $CLUSTER"
echo "📡 RPC URL: $RPC_URL"
echo ""

# Check wallet balance
echo "💰 Checking wallet balance..."
WALLET=$(solana address)
BALANCE=$(solana balance --url $RPC_URL 2>/dev/null || echo "0 SOL")

echo "Wallet: $WALLET"
echo "Balance: $BALANCE"
echo ""

if [ "$NETWORK" = "devnet" ]; then
    echo "💡 Tip: If balance is low, airdrop SOL with:"
    echo "   solana airdrop 2 --url $RPC_URL"
    echo ""
fi

# Build program
echo "🔨 Building program..."
anchor build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Deploy program
echo "🚀 Deploying program to $CLUSTER..."
anchor deploy --provider.cluster $CLUSTER

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""

# Get program ID from Anchor.toml or IDL
PROGRAM_ID=$(grep -A 1 "void_facilitator" Anchor.toml | grep "id" | head -1 | cut -d'"' -f2 || echo "")

if [ -z "$PROGRAM_ID" ]; then
    # Try to get from declare_id in lib.rs
    PROGRAM_ID=$(grep "declare_id!" programs/void-facilitator/src/lib.rs | cut -d'"' -f2 || echo "")
fi

echo "📝 Program ID: $PROGRAM_ID"
echo ""
echo "💾 Add this to your .env file:"
echo "FACILITATOR_PROGRAM_ID=$PROGRAM_ID"
echo ""

# Save to file
echo "$PROGRAM_ID" > .facilitator_program_id.txt
echo "Program ID saved to .facilitator_program_id.txt"

