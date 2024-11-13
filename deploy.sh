
#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check balance
check_balance() {
    local required_balance=0.05
    local current_balance=$(solana balance | cut -f1 -d' ')
    
    if (( $(echo "$current_balance < $required_balance" | bc -l) )); then
        echo -e "${RED}Insufficient balance for deployment!${NC}"
        echo -e "${YELLOW}Current balance: ${current_balance} SOL${NC}"
        echo -e "${YELLOW}Required balance: ${required_balance} SOL${NC}"
        echo -e "\nPlease follow these steps to get funds:"
        echo -e "1. Visit SOON Faucet: ${GREEN}https://faucet.soo.network/${NC}"
        echo -e "2. Request Sepolia ETH"
        echo -e "3. Bridge tokens at: ${GREEN}https://bridge.devnet.soo.network/home${NC}"
        return 1
    fi
    return 0
}

# Function to install dependencies
install_dependencies() {
    echo -e "${GREEN}Installing required dependencies...${NC}"
    
    sudo apt-get update && sudo apt-get install -y build-essential pkg-config libudev-dev bc
    
    sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
    export PATH="/home/$USER/.local/share/solana/install/active_release/bin:$PATH"
    
    cargo install cargo-build-sbf || return 1
}

# Function to build program
build_program() {
    echo -e "${GREEN}Building program...${NC}"
    cargo build-sbf || return 1
}

# Function to deploy program
deploy_program() {
    echo -e "${GREEN}Deploying program...${NC}"
    if [ ! -f target/deploy/soon_guard.so ]; then
        echo -e "${RED}Build artifact not found!${NC}"
        return 1
    fi

    solana program deploy \
        target/deploy/soon_guard.so \
        --commitment finalized || return 1
}

# Main function
main() {
    echo -e "${GREEN}Setting up SOON Guard deployment...${NC}"

    install_dependencies || exit 1

    echo -e "${GREEN}Configuring SOON network...${NC}"
    solana config set --url https://rpc.devnet.soo.network/rpc

    if [ ! -f ~/.config/solana/id.json ]; then
        echo -e "${YELLOW}Generating new keypair...${NC}"
        solana-keygen new --no-bip39-passphrase
    fi

    echo -e "${GREEN}Checking balance...${NC}"
    check_balance || exit 1

    build_program || exit 1
    deploy_program || exit 1

    echo -e "${GREEN}Deployment completed successfully!${NC}"
    echo -e "You can verify your program at: https://explorer.devnet.soo.network/"
}

# Run main function
main
