#!/bin/bash

# Clean previous build
cargo clean

# Build with optimizations
cargo build-sbf

# Check balance before deployment
BALANCE=$(solana balance | cut -d' ' -f1)
REQUIRED=0.035

# Convert balance to a number that can be compared
BALANCE_NUM=$(echo $BALANCE | bc)
REQUIRED_NUM=$(echo $REQUIRED | bc)

if (( $(echo "$BALANCE_NUM < $REQUIRED_NUM" | bc -l) )); then
    echo "Insufficient balance: $BALANCE SOL (need $REQUIRED SOL)"
    echo "Please get tokens from https://faucet.soo.network/"
    exit 1
fi

# Deploy program
echo "Deploying program..."
solana program deploy ./target/deploy/soon_guard.so

# Save program ID
PROGRAM_ID=$(solana address -k ./target/deploy/soon_guard-keypair.json)
echo "PROGRAM_ID=$PROGRAM_ID" > .env.local

echo "Deployment complete! Program ID: $PROGRAM_ID"
echo "Don't forget to update your frontend configuration!"