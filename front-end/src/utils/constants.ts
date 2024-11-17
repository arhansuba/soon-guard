import { PublicKey } from '@solana/web3.js';

// Core configuration
export const PROGRAM_ID = new PublicKey("ESzrxRbp9SEZF2gDdW4mcmTU5GEourMAaWXnBQxamoqa");
export const SOON_RPC = "https://rpc.devnet.soo.network/rpc";

// Buffer sizes
export const BUFFER_SIZES = {
  ANALYSIS: 1000,
  METRICS: 200,
  STATE: 100,
} as const;

// Account seeds for PDA derivation
export const SEEDS = {
  ANALYSIS: 'analysis',
  METRICS: 'metrics',
  NETWORK_STATS: 'network-stats',
} as const;

// Error messages
export const ERRORS = {
  NO_WALLET: 'Wallet not connected',
  NO_PROGRAM: 'Program not found',
  INVALID_ACCOUNT: 'Invalid account data',
  UNAUTHORIZED: 'Unauthorized action',
  ANALYSIS_FAILED: 'Analysis failed',
} as const;

// Risk score thresholds
export const RISK_THRESHOLDS = {
  LOW: 80,
  MEDIUM: 50,
  HIGH: 30,
} as const;

// Analytics refresh intervals (in ms)
export const REFRESH_INTERVALS = {
  FAST: 5000,    // 5 seconds
  MEDIUM: 15000, // 15 seconds
  SLOW: 30000,   // 30 seconds
} as const;

// Network configuration
export const NETWORK = {
  SOON: {
    url: SOON_RPC,
    wsUrl: SOON_RPC.replace('https', 'wss'),
  },
  DEVNET: {
    url: 'https://api.devnet.solana.com',
    wsUrl: 'wss://api.devnet.solana.com',
  },
  MAINNET: {
    url: 'https://api.mainnet-beta.solana.com',
    wsUrl: 'wss://api.mainnet-beta.solana.com',
  },
} as const;

// UI Constants
export const UI = {
  RISK_COLORS: {
    LOW: 'emerald-500',     // Using Tailwind color classes
    MEDIUM: 'yellow-500',
    HIGH: 'red-500',
  },
  CHART_COLORS: {
    PRIMARY: 'hsl(var(--primary))',
    SECONDARY: 'hsl(var(--secondary))',
    SUCCESS: 'hsl(var(--success))',
    WARNING: 'hsl(var(--warning))',
    DANGER: 'hsl(var(--destructive))',
  },
} as const;

// Feature flags
export const FEATURES = {
  REAL_TIME_ANALYSIS: true,
  ADVANCED_METRICS: true,
  NETWORK_MONITORING: true,
} as const;

// Type exports for constants
export type Seeds = typeof SEEDS[keyof typeof SEEDS];
export type ErrorType = typeof ERRORS[keyof typeof ERRORS];
export type NetworkType = keyof typeof NETWORK;
export type RiskLevel = keyof typeof UI.RISK_COLORS;
export type ChartColor = keyof typeof UI.CHART_COLORS;