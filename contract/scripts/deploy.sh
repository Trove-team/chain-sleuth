#!/bin/bash
set -e

ACCOUNT_ID="chainsleuth.testnet"

echo "Deploying contract to $ACCOUNT_ID..."

# Deploy the contract
near deploy --accountId $ACCOUNT_ID --wasmFile res/contract.wasm

# Initialize the contract
near call $ACCOUNT_ID new "{\"owner_id\": \"$ACCOUNT_ID\"}" --accountId $ACCOUNT_ID

echo "Deployment completed successfully!"
echo "Contract deployed to: $ACCOUNT_ID"