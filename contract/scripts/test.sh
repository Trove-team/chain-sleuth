#!/bin/bash
set -e

# Ensure we're in the contract directory
cd "$(dirname "$0")/.."

# Run unit tests
echo "Running unit tests..."
cargo test

# Build for integration tests
echo "Building contract for testing..."
./scripts/build.sh

# If on testnet, run integration tests
if [ "$NEAR_ENV" = "testnet" ]; then
    echo "Running integration tests..."
    
    CONTRACT_ID="contract.test.near"
    TEST_ACCOUNT="test.near"
    
    # Test investigation request
    near call $CONTRACT_ID request_investigation \
        "{\"target_account\": \"test-target.near\"}" \
        --accountId $TEST_ACCOUNT \
        --amount 1.1
        
    # Test view methods
    near view $CONTRACT_ID get_investigation_status \
        "{\"request_id\": \"test-request-id\"}"
fi

echo "All tests completed!"