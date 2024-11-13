#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
WALLET="7EMyfSsxHJQPuPKyA4uCRYEcm971cat4hrDfJTxXeNLr"
REQUIRED_BALANCE=0.05
CHECK_INTERVAL=10  # seconds

echo -e "${GREEN}Starting balance monitor for wallet:${NC}"
echo -e "${YELLOW}$WALLET${NC}"
echo -e "${GREEN}Required balance: ${YELLOW}$REQUIRED_BALANCE SOL${NC}"
echo -e "Checking every $CHECK_INTERVAL seconds...\n"

while true; do
    # Get current balance
    BALANCE=$(solana balance $WALLET | cut -d' ' -f1)
    
    # Clear previous line
    echo -ne "\r\033[K"
    
    # Print current balance
    if (( $(echo "$BALANCE >= $REQUIRED_BALANCE" | bc -l) )); then
        echo -e "\r${GREEN}Current balance: $BALANCE SOL - READY FOR DEPLOYMENT!${NC}"
        echo -e "\nYou can now run: ${YELLOW}./deploy-verified.sh${NC}"
        break
    else
        echo -ne "\r${YELLOW}Current balance: $BALANCE SOL - Waiting for tokens...${NC}"
    fi
    
    sleep $CHECK_INTERVAL
done