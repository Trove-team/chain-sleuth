#!/bin/bash
set -e

MAINNET_ACCOUNT_ID="chainsleuth-testing.near"
WASM_FILE="./res/chainsleuth.wasm"

# Check if wasm file exists
if [ ! -f "$WASM_FILE" ]; then
    echo "Error: WASM file not found at $WASM_FILE"
    echo "Please run ./build.sh first"
    exit 1
fi

echo "Deploying to MAINNET: $MAINNET_ACCOUNT_ID"
echo "This is a MAINNET deployment. Are you sure? (y/n)"
read -r response

if [ "$response" != "y" ]; then
    echo "Deployment cancelled"
    exit 1
fi

# Deploy the contract
echo "Deploying contract..."
NEAR_ENV=mainnet near deploy "$MAINNET_ACCOUNT_ID" "$WASM_FILE" \
    --initFunction new \
    --initArgs "{\"owner_id\": \"$MAINNET_ACCOUNT_ID\"}" \
    --initGas "300000000000000"

echo "Deployment to MAINNET completed!"
echo "Contract deployed to: $MAINNET_ACCOUNT_ID"