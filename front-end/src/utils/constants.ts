// app/src/utils/constants.ts

import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey('SoonGuardxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

// Account seeds for PDA derivation
export const SEEDS = {
    ANALYSIS: 'analysis',
    METRICS: 'metrics',
    NETWORK_STATS: 'network-stats',
};

// Buffer sizes
export const BUFFER_SIZES = {
    ANALYSIS: 1024,
    METRICS: 512,
    NETWORK_STATS: 256,
};

// Error messages
export const ERRORS = {
    NO_WALLET: 'Wallet not connected',
    NO_PROGRAM: 'Program not found',
    INVALID_ACCOUNT: 'Invalid account data',
    UNAUTHORIZED: 'Unauthorized action',
    ANALYSIS_FAILED: 'Analysis failed',
};

// Risk score thresholds
export const RISK_THRESHOLDS = {
    LOW: 80,
    MEDIUM: 50,
    HIGH: 30,
};

// Analytics refresh intervals (in ms)
export const REFRESH_INTERVALS = {
    FAST: 5000,    // 5 seconds
    MEDIUM: 15000, // 15 seconds
    SLOW: 30000,   // 30 seconds
};

// Network configuration
export const NETWORK = {
    DEVNET: {
        url: 'https://api.devnet.solana.com',
        wsUrl: 'wss://api.devnet.solana.com',
    },
    MAINNET: {
        url: 'https://api.mainnet-beta.solana.com',
        wsUrl: 'wss://api.mainnet-beta.solana.com',
    },
};

// UI Constants
export const UI = {
    RISK_COLORS: {
        LOW: 'green',
        MEDIUM: 'yellow',
        HIGH: 'red',
    },
    CHART_COLORS: {
        PRIMARY: '#4C9AFF',
        SECONDARY: '#00B8D9',
        SUCCESS: '#36B37E',
        WARNING: '#FFAB00',
        DANGER: '#FF5630',
    },
};

// Feature flags
export const FEATURES = {
    REAL_TIME_ANALYSIS: true,
    ADVANCED_METRICS: true,
    NETWORK_MONITORING: true,
};