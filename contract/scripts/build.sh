#!/bin/bash
set -e

echo "Building contract..."
RUSTFLAGS='-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release

mkdir -p res
cp target/wasm32-unknown-unknown/release/contract.wasm res/

echo "Build completed successfully!"