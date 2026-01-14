#!/bin/bash

# Script to set up test accounts for confidential transfers
# Usage: ./scripts/setup-accounts.sh <mint_address> [network]

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Mint address required"
    echo "Usage: ./scripts/setup-accounts.sh <mint_address> [network]"
    exit 1
fi

MINT_ADDRESS=$1
NETWORK=${2:-devnet}
TOKEN_2022_PROGRAM_ID="TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"

echo "🔧 Setting up accounts for confidential transfers..."
echo "Mint: $MINT_ADDRESS"
echo "Network: $NETWORK"
echo ""

# Set RPC URL
if [ "$NETWORK" = "mainnet-beta" ]; then
    RPC_URL="https://api.mainnet-beta.solana.com"
else
    RPC_URL="https://api.devnet.solana.com"
fi

# Check if spl-token is installed
if ! command -v spl-token &> /dev/null; then
    echo "❌ Error: spl-token CLI not found"
    exit 1
fi

# Get current wallet address
WALLET=$(solana address)
echo "Current wallet: $WALLET"
echo ""

# Create token account
echo "📝 Creating token account..."
ACCOUNT_OUTPUT=$(spl-token \
    --program-id $TOKEN_2022_PROGRAM_ID \
    --url $RPC_URL \
    create-account $MINT_ADDRESS)

echo "$ACCOUNT_OUTPUT"
echo ""

# Extract account address
ACCOUNT_ADDRESS=$(echo "$ACCOUNT_OUTPUT" | grep -oP 'Creating account \K\w+' || echo "")

if [ -z "$ACCOUNT_ADDRESS" ]; then
    echo "❌ Failed to extract account address"
    exit 1
fi

echo "✅ Account created: $ACCOUNT_ADDRESS"
echo ""

# Configure for confidential transfers
echo "🔐 Configuring account for confidential transfers..."
spl-token \
    --program-id $TOKEN_2022_PROGRAM_ID \
    --url $RPC_URL \
    configure-confidential-transfer-account \
    --address $ACCOUNT_ADDRESS

echo ""
echo "✅ Account configured for confidential transfers!"
echo ""
echo "📝 Account Address: $ACCOUNT_ADDRESS"
echo "💡 You can now deposit tokens with:"
echo "   spl-token deposit-confidential-tokens $MINT_ADDRESS <amount> --address $ACCOUNT_ADDRESS --url $RPC_URL"

