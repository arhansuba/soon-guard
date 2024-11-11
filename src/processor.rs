// program/src/processor.rs

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
    clock::Clock,
    sysvar::Sysvar,
};

use borsh::{BorshDeserialize, BorshSerialize};

use crate::{
    instruction::GuardInstruction,
    state::{ProgramState, SecurityAnalysisState, MetricsState, AnalysisStatus},
    error::GuardError,
};

pub struct Processor;

impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = GuardInstruction::unpack(instruction_data)?;

        match instruction {
            GuardInstruction::AnalyzeContract { data_size } => {
                msg!("Instruction: AnalyzeContract");
                Self::process_analyze_contract(program_id, accounts, data_size)
            }
            GuardInstruction::RecordMetrics { gas_used, success } => {
                msg!("Instruction: RecordMetrics");
                Self::process_record_metrics(program_id, accounts, gas_used, success)
            }
            GuardInstruction::UpdateNetworkStats { transactions_per_second, average_block_time } => {
                msg!("Instruction: UpdateNetworkStats");
                Self::process_update_network_stats(
                    program_id,
                    accounts,
                    transactions_per_second,
                    average_block_time,
                )
            }
        }
    }

    fn process_analyze_contract(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        data_size: u64,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        // Get required accounts
        let target_program_info = next_account_info(account_info_iter)?;
        let analysis_state_info = next_account_info(account_info_iter)?;
        let authority_info = next_account_info(account_info_iter)?;
        let program_state_info = next_account_info(account_info_iter)?;

        // Verify authority
        if !authority_info.is_signer {
            return Err(GuardError::UnauthorizedAccount.into());
        }

        // Verify program state account
        let program_state = ProgramState::try_from_slice(&program_state_info.data.borrow())?;
        program_state.check_authority(authority_info.key)?;

        // Get current timestamp
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;

        // Create or update analysis state
        let mut analysis_state = if analysis_state_info.data.borrow().len() > 0 {
            SecurityAnalysisState::try_from_slice(&analysis_state_info.data.borrow())?
        } else {
            SecurityAnalysisState::new(*target_program_info.key, current_timestamp)
        };

        // Perform security analysis
        msg!("Starting security analysis...");
        analysis_state.status = AnalysisStatus::InProgress;
        
        // Get target program data
        let program_data = target_program_info.try_borrow_data()?;
        
        // Basic security checks
        let mut vulnerability_count = 0;
        let mut risk_score = 100u8;

        // Check program size
        if program_data.len() as u64 > data_size {
            vulnerability_count += 1;
            risk_score = risk_score.saturating_sub(10);
            msg!("Warning: Program size exceeds specified limit");
        }

        // Check for suspicious patterns (example checks)
        if Self::check_suspicious_patterns(&program_data) {
            vulnerability_count += 1;
            risk_score = risk_score.saturating_sub(15);
            msg!("Warning: Suspicious patterns detected");
        }

        // Update analysis state
        analysis_state.update_analysis(risk_score, vulnerability_count, current_timestamp);
        
        // Serialize updated state
        analysis_state.serialize(&mut *analysis_state_info.try_borrow_mut_data()?)?;

        msg!("Security analysis completed. Risk score: {}", risk_score);
        Ok(())
    }

    fn process_record_metrics(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        gas_used: u64,
        success: bool,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        let metrics_state_info = next_account_info(account_info_iter)?;
        let authority_info = next_account_info(account_info_iter)?;

        // Verify authority
        if !authority_info.is_signer {
            return Err(GuardError::UnauthorizedAccount.into());
        }

        // Get current timestamp
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;

        // Update metrics state
        let mut metrics_state = if metrics_state_info.data_borrow().len() > 0 {
            MetricsState::try_from_slice(&metrics_state_info.data.borrow())?
        } else {
            MetricsState::new(current_timestamp)
        };

        metrics_state.record_transaction(gas_used, success, current_timestamp);

        // Serialize updated state
        metrics_state.serialize(&mut *metrics_state_info.try_borrow_mut_data()?)?;

        msg!("Metrics recorded. Gas used: {}, Success: {}", gas_used, success);
        Ok(())
    }

    fn process_update_network_stats(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        transactions_per_second: u64,
        average_block_time: u64,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        let network_stats_info = next_account_info(account_info_iter)?;
        let authority_info = next_account_info(account_info_iter)?;

        // Verify authority
        if !authority_info.is_signer {
            return Err(GuardError::UnauthorizedAccount.into());
        }

        // Verify program ownership
        if network_stats_info.owner != program_id {
            return Err(GuardError::InvalidAccountData.into());
        }

        msg!("Network stats updated: TPS={}, Block Time={}", 
            transactions_per_second, 
            average_block_time
        );
        
        Ok(())
    }

    fn check_suspicious_patterns(program_data: &[u8]) -> bool {
        // Example pattern checks (to be expanded based on security requirements)
        
        // Check for potentially unsafe instructions
        let has_unsafe_patterns = program_data.windows(4).any(|window| {
            matches!(window, &[0x48, 0x31, 0xc0, 0x90]) // Example pattern
        });

        // Check for potential infinite loops
        let has_loop_patterns = program_data.windows(2).any(|window| {
            matches!(window, &[0xeb, 0xfe]) // Example pattern
        });

        has_unsafe_patterns || has_loop_patterns
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use solana_program::clock::Clock;

    #[test]
    fn test_check_suspicious_patterns() {
        let safe_data = vec![0x90, 0x90, 0x90, 0x90];
        let unsafe_data = vec![0x48, 0x31, 0xc0, 0x90];
        
        assert!(!Processor::check_suspicious_patterns(&safe_data));
        assert!(Processor::check_suspicious_patterns(&unsafe_data));
    }
}