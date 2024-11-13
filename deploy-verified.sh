#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROGRAM_KEYPAIR="./target/deploy/soon_guard-keypair.json"
PROGRAM_SO="./target/deploy/soon_guard.so"

echo -e "${GREEN}Starting SOON Guard deployment...${NC}"

# Set network
echo -e "${YELLOW}Setting up SOON network...${NC}"
solana config set --url https://rpc.devnet.soo.network/rpc

# Check balance
BALANCE=$(solana balance | cut -d' ' -f1)
WALLET=$(solana address)
echo -e "Wallet: ${GREEN}$WALLET${NC}"
echo -e "Balance: ${YELLOW}$BALANCE SOL${NC}"

if (( $(echo "$BALANCE < 0.05" | bc -l) )); then
    echo -e "${RED}Insufficient balance!${NC}"
    echo -e "Please get tokens from:"
    echo -e "1. ${GREEN}https://faucet.soo.network/${NC}"
    echo -e "2. Bridge at: ${GREEN}https://bridge.devnet.soo.network/home${NC}"
    exit 1
fi

# Build program
echo -e "${YELLOW}Building program...${NC}"
cargo clean

# Create optimized Cargo.toml
cat > Cargo.toml << 'EOL'
[package]
name = "soon-guard"
version = "0.1.0"
edition = "2021"

[dependencies]
solana-program = "=1.17.0"
borsh = "0.10.3"
thiserror = "1.0"
num-derive = "0.4"
num-traits = "0.2"

[lib]
crate-type = ["cdylib", "lib"]

[profile.release]
opt-level = "z"
overflow-checks = false
debug = false
debug-assertions = false
codegen-units = 1
panic = 'abort'
incremental = false
lto = true
strip = true
EOL

# Build
cargo build-sbf --release
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed${NC}"
    exit 1
fi

# Deploy
echo -e "${YELLOW}Deploying program...${NC}"
if [ ! -f "$PROGRAM_SO" ]; then
    echo -e "${RED}Program binary not found at $PROGRAM_SO${NC}"
    exit 1
fi

solana program deploy "$PROGRAM_SO"
if [ $? -ne 0 ]; then
    echo -e "${RED}Deployment failed${NC}"
    exit 1
fi

# Save program ID
if [ -f "$PROGRAM_KEYPAIR" ]; then
    PROGRAM_ID=$(solana-keygen pubkey "$PROGRAM_KEYPAIR")
    echo -e "${GREEN}Program deployed successfully!${NC}"
    echo -e "Program ID: ${YELLOW}$PROGRAM_ID${NC}"
    
    # Save for frontend
    mkdir -p front-end/src/utils
    echo "export const PROGRAM_ID = \"$PROGRAM_ID\";" > front-end/src/utils/programId.ts
    echo -e "${GREEN}Program ID saved to frontend${NC}"
else
    echo -e "${RED}Could not find program keypair${NC}"
    exit 1
fi

echo -e "\n${GREEN}Deployment complete!${NC}"
echo -e "You can verify your program at:"
echo -e "${GREEN}https://explorer.devnet.soo.network/address/$PROGRAM_ID${NC}"