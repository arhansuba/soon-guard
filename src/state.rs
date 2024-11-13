// program/src/state.rs
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    program_error::ProgramError,
    pubkey::Pubkey,
    clock::UnixTimestamp,
    msg,
};

use crate::error::GuardError;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct ProgramState {
    /// The account that can update program settings
    pub authority: Pubkey,
    /// Program initialization timestamp
    pub initialized_at: UnixTimestamp,
    /// Last update timestamp
    pub last_updated: UnixTimestamp,
    /// Current network TPS
    pub transactions_per_second: u64,
    /// Current average block time
    pub average_block_time: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct SecurityAnalysisState {
    /// Target program being analyzed
    pub target_program: Pubkey,
    /// Last analysis timestamp
    pub last_analysis: UnixTimestamp,
    /// Risk score (0-100)
    pub risk_score: u8,
    /// Number of vulnerabilities found
    pub vulnerability_count: u16,
    /// Analysis status
    pub status: AnalysisStatus,
    /// History of analysis results
    pub analysis_history: Vec<AnalysisResult>,
    /// Detection patterns version
    pub patterns_version: u16,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub struct AnalysisResult {
    pub timestamp: UnixTimestamp,
    pub risk_score: u8,
    pub vulnerability_count: u16,
    pub status: AnalysisStatus,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum AnalysisStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct MetricsState {
    /// Total transactions analyzed
    pub total_transactions: u64,
    /// Total gas used
    pub total_gas_used: u64,
    /// Average gas per transaction
    pub avg_gas_used: u64,
    /// Success rate (0-100)
    pub success_rate: u8,
    /// Last metrics update
    pub last_update: UnixTimestamp,
    /// Historical gas usage tracking
    pub gas_history: Vec<GasMetric>,
    /// Peak gas usage
    pub peak_gas_used: u64,
    /// Transaction error count
    pub error_count: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct GasMetric {
    pub timestamp: UnixTimestamp,
    pub gas_used: u64,
    pub success: bool,
}

impl ProgramState {
    pub const SPACE: usize = 32 + 8 + 8 + 8 + 8; // pubkey + timestamps + network stats

    pub fn new(authority: Pubkey, current_timestamp: UnixTimestamp) -> Self {
        Self {
            authority,
            initialized_at: current_timestamp,
            last_updated: current_timestamp,
            transactions_per_second: 0,
            average_block_time: 0,
        }
    }

    pub fn check_authority(&self, authority_pubkey: &Pubkey) -> Result<(), ProgramError> {
        if &self.authority != authority_pubkey {
            msg!("Invalid authority");
            return Err(GuardError::UnauthorizedAccount.into());
        }
        Ok(())
    }

    pub fn update_network_stats(
        &mut self,
        tps: u64,
        block_time: u64,
        current_timestamp: UnixTimestamp,
    ) -> Result<(), ProgramError> {
        self.transactions_per_second = tps;
        self.average_block_time = block_time;
        self.last_updated = current_timestamp;
        Ok(())
    }
}

impl SecurityAnalysisState {
    pub const SPACE: usize = 32 + 8 + 1 + 2 + 1 + 256 + 2; // Base fields + history + version

    pub fn new(target_program: Pubkey, current_timestamp: UnixTimestamp) -> Self {
        Self {
            target_program,
            last_analysis: current_timestamp,
            risk_score: 0,
            vulnerability_count: 0,
            status: AnalysisStatus::Pending,
            analysis_history: Vec::with_capacity(10),
            patterns_version: 1,
        }
    }

    pub fn update_analysis(
        &mut self,
        risk_score: u8,
        vulnerability_count: u16,
        current_timestamp: UnixTimestamp,
    ) {
        // Create new analysis result
        let result = AnalysisResult {
            timestamp: current_timestamp,
            risk_score,
            vulnerability_count,
            status: AnalysisStatus::Completed,
        };

        // Update current state
        self.risk_score = risk_score;
        self.vulnerability_count = vulnerability_count;
        self.last_analysis = current_timestamp;
        self.status = AnalysisStatus::Completed;

        // Add to history, maintaining fixed size
        if self.analysis_history.len() >= 10 {
            self.analysis_history.remove(0);
        }
        self.analysis_history.push(result);
    }

    pub fn get_risk_trend(&self) -> Option<i8> {
        if self.analysis_history.len() < 2 {
            return None;
        }

        let latest = self.analysis_history.last()?;
        let previous = self.analysis_history.get(self.analysis_history.len() - 2)?;
        
        Some(latest.risk_score as i8 - previous.risk_score as i8)
    }
}

impl MetricsState {
    pub const SPACE: usize = 8 + 8 + 8 + 1 + 8 + 256 + 8 + 8; // Base fields + history + additional metrics

    pub fn new(current_timestamp: UnixTimestamp) -> Self {
        Self {
            total_transactions: 0,
            total_gas_used: 0,
            avg_gas_used: 0,
            success_rate: 0,
            last_update: current_timestamp,
            gas_history: Vec::with_capacity(100),
            peak_gas_used: 0,
            error_count: 0,
        }
    }

    pub fn record_transaction(
        &mut self,
        gas_used: u64,
        success: bool,
        current_timestamp: UnixTimestamp,
    ) {
        // Update basic metrics
        self.total_transactions = self.total_transactions.saturating_add(1);
        self.total_gas_used = self.total_gas_used.saturating_add(gas_used);
        self.avg_gas_used = self.total_gas_used.checked_div(self.total_transactions).unwrap_or(0);
        
        // Update success rate
        let successful_txs = (self.success_rate as u64 * (self.total_transactions - 1) / 100)
            .saturating_add(if success { 1 } else { 0 });
        self.success_rate = ((successful_txs * 100) / self.total_transactions) as u8;
        
        // Update peak gas
        if gas_used > self.peak_gas_used {
            self.peak_gas_used = gas_used;
        }

        // Update error count
        if !success {
            self.error_count = self.error_count.saturating_add(1);
        }

        // Record in history
        let metric = GasMetric {
            timestamp: current_timestamp,
            gas_used,
            success,
        };

        if self.gas_history.len() >= 100 {
            self.gas_history.remove(0);
        }
        self.gas_history.push(metric);

        self.last_update = current_timestamp;
    }

    pub fn get_gas_trend(&self) -> Option<i64> {
        if self.gas_history.len() < 2 {
            return None;
        }

        let latest = self.gas_history.last()?;
        let previous = self.gas_history.get(self.gas_history.len() - 2)?;
        
        Some(latest.gas_used as i64 - previous.gas_used as i64)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_program_state() {
        let authority = Pubkey::new_unique();
        let timestamp = 1234567890;
        let mut state = ProgramState::new(authority, timestamp);

        assert_eq!(state.authority, authority);
        assert_eq!(state.initialized_at, timestamp);

        // Test network stats update
        assert!(state.update_network_stats(1000, 500, timestamp + 100).is_ok());
        assert_eq!(state.transactions_per_second, 1000);
        assert_eq!(state.average_block_time, 500);
    }

    #[test]
    fn test_security_analysis_state() {
        let program = Pubkey::new_unique();
        let timestamp = 1234567890;
        let mut state = SecurityAnalysisState::new(program, timestamp);

        // Test initial state
        assert_eq!(state.status, AnalysisStatus::Pending);
        
        // Test multiple analysis updates
        state.update_analysis(85, 3, timestamp + 100);
        state.update_analysis(80, 4, timestamp + 200);
        
        assert_eq!(state.risk_score, 80);
        assert_eq!(state.vulnerability_count, 4);
        assert_eq!(state.analysis_history.len(), 2);
        
        // Test risk trend
        assert_eq!(state.get_risk_trend(), Some(-5));
    }

    #[test]
    fn test_metrics_state() {
        let timestamp = 1234567890;
        let mut state = MetricsState::new(timestamp);

        // Test transaction recording
        state.record_transaction(1000, true, timestamp + 100);
        state.record_transaction(2000, false, timestamp + 200);
        
        assert_eq!(state.total_transactions, 2);
        assert_eq!(state.success_rate, 50);
        assert_eq!(state.peak_gas_used, 2000);
        assert_eq!(state.error_count, 1);
        assert_eq!(state.gas_history.len(), 2);
        
        // Test gas trend
        assert_eq!(state.get_gas_trend(), Some(1000));
    }
}