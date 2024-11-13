pub const MAX_CONTRACT_SIZE: usize = 1024 * 1024; // 1 MB
pub const MAX_ANALYSIS_BUFFER: usize = 1024;
pub const MAX_METRICS_BUFFER: usize = 512;

// Version information
pub const PROGRAM_VERSION: &str = env!("CARGO_PKG_VERSION");

// Analysis thresholds
pub const GAS_WARNING_THRESHOLD: u64 = 100_000;
pub const RISK_SCORE_THRESHOLD: u8 = 80;

// Network constants
pub const DEFAULT_TRANSACTION_SIZE: usize = 1232;
pub const MAX_TRANSACTION_PER_BLOCK: u64 = 1000;