// program/src/error.rs

use solana_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Error, Debug, Copy, Clone)]
pub enum GuardError {
    #[error("Invalid instruction data: missing or malformed fields")]
    InvalidInstructionData,

    #[error("Invalid account data: account data is invalid or corrupted")]
    InvalidAccountData,

    #[error("Account not authorized for this operation")]
    UnauthorizedAccount,

    #[error("Analysis target program is invalid or doesn't exist")]
    InvalidTargetProgram,

    #[error("Insufficient buffer size for analysis results")]
    InsufficientBufferSize,

    #[error("Analysis failed: unable to process program data")]
    AnalysisFailed,

    #[error("Metrics recording failed: invalid gas or transaction data")]
    MetricsRecordingFailed,

    #[error("Network stats update failed: invalid statistics data")]
    NetworkStatsUpdateFailed,

    #[error("Account initialization failed")]
    InitializationFailed,

    #[error("Rate limit exceeded: too many requests")]
    RateLimitExceeded,
}

impl From<GuardError> for ProgramError {
    fn from(e: GuardError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

// Helper functions for error handling
impl GuardError {
    pub fn check_account_owner(
        account_owner: &solana_program::pubkey::Pubkey,
        expected_owner: &solana_program::pubkey::Pubkey,
    ) -> Result<(), ProgramError> {
        if account_owner != expected_owner {
            Err(GuardError::UnauthorizedAccount.into())
        } else {
            Ok(())
        }
    }

    pub fn check_signer(is_signer: bool) -> Result<(), ProgramError> {
        if !is_signer {
            Err(GuardError::UnauthorizedAccount.into())
        } else {
            Ok(())
        }
    }

    pub fn check_buffer_size(actual: usize, required: usize) -> Result<(), ProgramError> {
        if actual < required {
            Err(GuardError::InsufficientBufferSize.into())
        } else {
            Ok(())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use solana_program::pubkey::Pubkey;

    #[test]
    fn test_check_account_owner() {
        let owner = Pubkey::new_unique();
        let wrong_owner = Pubkey::new_unique();
        
        assert!(GuardError::check_account_owner(&owner, &owner).is_ok());
        assert!(GuardError::check_account_owner(&owner, &wrong_owner).is_err());
    }

    #[test]
    fn test_check_signer() {
        assert!(GuardError::check_signer(true).is_ok());
        assert!(GuardError::check_signer(false).is_err());
    }

    #[test]
    fn test_check_buffer_size() {
        assert!(GuardError::check_buffer_size(100, 50).is_ok());
        assert!(GuardError::check_buffer_size(50, 100).is_err());
    }

    #[test]
    fn test_error_conversion() {
        let guard_error = GuardError::InvalidInstructionData;
        let program_error = ProgramError::from(guard_error);
        assert!(matches!(program_error, ProgramError::Custom(_)));
    }
}