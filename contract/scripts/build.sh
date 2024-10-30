#!/bin/bash
set -e

# Ensure we're in the contract directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
CONTRACT_DIR="$SCRIPT_DIR/.."
cd "$CONTRACT_DIR"

echo "Building contract from $(pwd)..."

# Clean and build
cargo clean
RUSTFLAGS='-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release

# Check if build succeeded and file exists
WASM_FILE="target/wasm32-unknown-unknown/release/chainsleuth.wasm"  # Changed from contract.wasm to chainsleuth.wasm
if [ ! -f "$WASM_FILE" ]; then
    echo "Error: WASM file not found at $WASM_FILE"
    echo "Build may have failed"
    exit 1
fi

# Create res directory if it doesn't exist
mkdir -p res

# Copy the wasm file
cp "$WASM_FILE" res/chainsleuth.wasm

echo "Build completed successfully!"
echo "Contract binary location: $(pwd)/res/chainsleuth.wasm"
echo "Contract binary size: $(ls -lh res/chainsleuth.wasm | awk '{print $5}')"