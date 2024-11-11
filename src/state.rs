// program/src/state.rs

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    program_error::ProgramError,
    pubkey::Pubkey,
    clock::UnixTimestamp,
};

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct ProgramState {
    /// The account that can update program settings
    pub authority: Pubkey,
    /// Program initialization timestamp
    pub initialized_at: UnixTimestamp,
    /// Last update timestamp
    pub last_updated: UnixTimestamp,
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
}

impl ProgramState {
    pub const SPACE: usize = 32 + 8 + 8; // pubkey + 2 timestamps

    pub fn new(authority: Pubkey, current_timestamp: UnixTimestamp) -> Self {
        Self {
            authority,
            initialized_at: current_timestamp,
            last_updated: current_timestamp,
        }
    }

    pub fn check_authority(&self, authority_pubkey: &Pubkey) -> Result<(), ProgramError> {
        if &self.authority != authority_pubkey {
            return Err(ProgramError::InvalidAccountData);
        }
        Ok(())
    }
}

impl SecurityAnalysisState {
    pub const SPACE: usize = 32 + 8 + 1 + 2 + 1; // pubkey + timestamp + score + count + status

    pub fn new(target_program: Pubkey, current_timestamp: UnixTimestamp) -> Self {
        Self {
            target_program,
            last_analysis: current_timestamp,
            risk_score: 0,
            vulnerability_count: 0,
            status: AnalysisStatus::Pending,
        }
    }

    pub fn update_analysis(
        &mut self,
        risk_score: u8,
        vulnerability_count: u16,
        current_timestamp: UnixTimestamp,
    ) {
        self.risk_score = risk_score;
        self.vulnerability_count = vulnerability_count;
        self.last_analysis = current_timestamp;
        self.status = AnalysisStatus::Completed;
    }
}

impl MetricsState {
    pub const SPACE: usize = 8 + 8 + 8 + 1 + 8; // counters + rate + timestamp

    pub fn new(current_timestamp: UnixTimestamp) -> Self {
        Self {
            total_transactions: 0,
            total_gas_used: 0,
            avg_gas_used: 0,
            success_rate: 0,
            last_update: current_timestamp,
        }
    }

    pub fn record_transaction(&mut self, gas_used: u64, success: bool, current_timestamp: UnixTimestamp) {
        self.total_transactions = self.total_transactions.saturating_add(1);
        self.total_gas_used = self.total_gas_used.saturating_add(gas_used);
        self.avg_gas_used = self.total_gas_used.checked_div(self.total_transactions).unwrap_or(0);
        
        // Update success rate
        let successful_txs = (self.success_rate as u64 * (self.total_transactions - 1) / 100)
            .saturating_add(if success { 1 } else { 0 });
        self.success_rate = ((successful_txs * 100) / self.total_transactions) as u8;
        
        self.last_update = current_timestamp;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_program_state() {
        let authority = Pubkey::new_unique();
        let timestamp = 1234567890;
        let state = ProgramState::new(authority, timestamp);

        assert_eq!(state.authority, authority);
        assert_eq!(state.initialized_at, timestamp);
        assert_eq!(state.last_updated, timestamp);
    }

    #[test]
    fn test_security_analysis_state() {
        let program = Pubkey::new_unique();
        let timestamp = 1234567890;
        let mut state = SecurityAnalysisState::new(program, timestamp);

        assert_eq!(state.status, AnalysisStatus::Pending);
        
        state.update_analysis(85, 3, timestamp + 100);
        assert_eq!(state.risk_score, 85);
        assert_eq!(state.vulnerability_count, 3);
        assert_eq!(state.status, AnalysisStatus::Completed);
    }

    #[test]
    fn test_metrics_state() {
        let timestamp = 1234567890;
        let mut state = MetricsState::new(timestamp);

        // Test single successful transaction
        state.record_transaction(1000, true, timestamp + 100);
        assert_eq!(state.total_transactions, 1);
        assert_eq!(state.success_rate, 100);
        assert_eq!(state.avg_gas_used, 1000);

        // Test unsuccessful transaction
        state.record_transaction(2000, false, timestamp + 200);
        assert_eq!(state.total_transactions, 2);
        assert_eq!(state.success_rate, 50);
        assert_eq!(state.avg_gas_used, 1500);
    }
}