#!/bin/bash

# Script to create Token-2022 mint with confidential transfers enabled
# Usage: ./scripts/create-token-2022-mint.sh [network]
# Network: devnet (default) or mainnet-beta

set -e

NETWORK=${1:-devnet}
TOKEN_2022_PROGRAM_ID="TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"

echo "🚀 Creating Token-2022 mint with confidential transfers..."
echo "Network: $NETWORK"
echo ""

# Check if spl-token is installed
if ! command -v spl-token &> /dev/null; then
    echo "❌ Error: spl-token CLI not found"
    echo "Install it with: cargo install spl-token-cli"
    exit 1
fi

# Set network
if [ "$NETWORK" = "mainnet-beta" ]; then
    RPC_URL="https://api.mainnet-beta.solana.com"
else
    RPC_URL="https://api.devnet.solana.com"
fi

echo "📡 Using RPC: $RPC_URL"
echo ""

# Create mint with confidential transfers
echo "Creating mint with confidential transfers (auto approval)..."
MINT_OUTPUT=$(spl-token \
    --program-id $TOKEN_2022_PROGRAM_ID \
    --url $RPC_URL \
    create-token \
    --enable-confidential-transfers auto)

echo "$MINT_OUTPUT"
echo ""

# Extract mint address from output
MINT_ADDRESS=$(echo "$MINT_OUTPUT" | grep -oP 'Creating token \K\w+' || echo "")

if [ -z "$MINT_ADDRESS" ]; then
    echo "❌ Failed to extract mint address from output"
    echo "Please check the output above and manually extract the mint address"
    exit 1
fi

echo "✅ Mint created successfully!"
echo ""
echo "📝 Mint Address: $MINT_ADDRESS"
echo ""
echo "💾 Add this to your .env file:"
echo "TOKEN_2022_MINT_ADDRESS=$MINT_ADDRESS"
echo ""

# Save to file
echo "$MINT_ADDRESS" > .mint_address.txt
echo "Mint address saved to .mint_address.txt"

