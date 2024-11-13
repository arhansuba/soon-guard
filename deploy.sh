#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to create Cargo.toml
create_cargo_toml() {
    cat > Cargo.toml << 'EOL'
[package]
name = "soon-guard"
version = "0.1.0"
edition = "2021"
description = "Security and analytics tool for SOON network"

[dependencies]
solana-program = "=1.17.0"
borsh = "0.10.3"
thiserror = "1.0"
num-derive = "0.4"
num-traits = "0.2"

[lib]
crate-type = ["cdylib", "lib"]

[profile.release]
opt-level = 3
overflow-checks = true
lto = true
debug = false
debug-assertions = false
codegen-units = 1
panic = 'abort'
incremental = false
rpath = false
EOL
}

# Function to build program
build_program() {
    echo -e "${YELLOW}Building program...${NC}"
    cargo clean
    cargo build-sbf
}

# Function to check balance
check_balance() {
    local balance=$(solana balance | cut -d' ' -f1)
    echo -e "${YELLOW}Current balance: ${balance} SOL${NC}"
}

# Function to deploy program
deploy_program() {
    if [ ! -f "target/deploy/soon_guard.so" ]; then
        echo -e "${RED}Program not built. Build first.${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Deploying program...${NC}"
    solana program deploy target/deploy/soon_guard.so
}

# Function to show faucet instructions
show_faucet_info() {
    local pubkey=$(solana address)
    echo -e "\n${YELLOW}Follow these steps to get tokens:${NC}"
    echo -e "1. Visit: ${GREEN}https://faucet.soo.network/${NC}"
    echo -e "2. Your address: ${GREEN}${pubkey}${NC}"
    echo -e "3. Get Sepolia ETH"
    echo -e "4. Bridge at: ${GREEN}https://bridge.devnet.soo.network/home${NC}"
}

# Main menu
show_menu() {
    echo -e "\n${GREEN}SOON Guard Deployment Menu${NC}"
    echo "1. Fix Cargo.toml"
    echo "2. Build Program"
    echo "3. Check Balance"
    echo "4. Deploy Program"
    echo "5. Show Faucet Instructions"
    echo "6. Exit"
}

# Main loop
while true; do
    show_menu
    read -p "Choose an option (1-6): " choice

    case $choice in
        1)
            create_cargo_toml
            echo -e "${GREEN}Cargo.toml updated${NC}"
            ;;
        2)
            build_program
            ;;
        3)
            check_balance
            ;;
        4)
            deploy_program
            ;;
        5)
            show_faucet_info
            ;;
        6)
            echo -e "${GREEN}Exiting...${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac

    echo -e "\nPress Enter to continue..."
    read
done