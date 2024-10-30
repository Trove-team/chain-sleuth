#!/bin/bash
set -e

# Environment variables
export NEAR_ENV=testnet
TESTNET_ACCOUNT_ID="chainsleuthtest.testnet"
WASM_FILE="./res/chainsleuth.wasm"

# First clean and rebuild
echo "Cleaning and rebuilding..."
rm -rf res/
rm -rf target/
cargo clean
RUSTFLAGS='-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release
mkdir -p res
cp target/wasm32-unknown-unknown/release/chainsleuth.wasm res/

# Deploy contract with force flag
echo "Deploying contract..."
near deploy "$TESTNET_ACCOUNT_ID" "$WASM_FILE" --force

# If deploy succeeds, initialize separately
if [ $? -eq 0 ]; then
    echo "Initializing contract..."
    near call "$TESTNET_ACCOUNT_ID" new "{\"owner_id\": \"$TESTNET_ACCOUNT_ID\"}" \
        --accountId "$TESTNET_ACCOUNT_ID" \
        --gas "300000000000000"
fi

echo "Deployment process completed!"