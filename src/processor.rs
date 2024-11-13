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
    state::{ProgramState, SecurityAnalysisState, MetricsState},
    error::GuardError,
    constants::{MAX_CONTRACT_SIZE, GAS_WARNING_THRESHOLD},
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
        _data_size: u64,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        
        let target_program_info = next_account_info(account_info_iter)?;
        let analysis_state_info = next_account_info(account_info_iter)?;
        let authority_info = next_account_info(account_info_iter)?;
        let program_state_info = next_account_info(account_info_iter)?;

        // Validate accounts
        if !authority_info.is_signer {
            return Err(GuardError::UnauthorizedAccount.into());
        }

        if analysis_state_info.owner != program_id || program_state_info.owner != program_id {
            return Err(GuardError::InvalidAccountData.into());
        }

        // Get current timestamp
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;

        // Initialize or load analysis state
        let mut analysis_state = if analysis_state_info.data_len() > 0 {
            SecurityAnalysisState::try_from_slice(&analysis_state_info.data.borrow())?
        } else {
            SecurityAnalysisState::new(*target_program_info.key, current_timestamp)
        };

        // Perform security analysis
        let program_data = target_program_info.try_borrow_data()?;
        let mut vulnerabilities = Vec::new();
        let mut risk_score = 100u8;

        // Size check
        if program_data.len() > MAX_CONTRACT_SIZE {
            vulnerabilities.push("Program size exceeds limit");
            risk_score = risk_score.saturating_sub(10);
        }

        // Pattern analysis
        if Self::check_suspicious_patterns(&program_data) {
            vulnerabilities.push("Suspicious instruction patterns detected");
            risk_score = risk_score.saturating_sub(15);
        }

        // Resource analysis
        if Self::check_resource_usage(&program_data) {
            vulnerabilities.push("Potential resource exhaustion detected");
            risk_score = risk_score.saturating_sub(20);
        }

        // Update analysis state
        analysis_state.update_analysis(risk_score, vulnerabilities.len() as u16, current_timestamp);
        analysis_state.serialize(&mut *analysis_state_info.try_borrow_mut_data()?)?;

        msg!("Security analysis completed. Risk score: {}", risk_score);
        msg!("Vulnerabilities found: {}", vulnerabilities.len());
        
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

        // Validate accounts
        if !authority_info.is_signer {
            return Err(GuardError::UnauthorizedAccount.into());
        }

        if metrics_state_info.owner != program_id {
            return Err(GuardError::InvalidAccountData.into());
        }

        // Get current timestamp
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;

        // Initialize or update metrics
        let mut metrics_state = if metrics_state_info.data_len() > 0 {
            MetricsState::try_from_slice(&metrics_state_info.data.borrow())?
        } else {
            MetricsState::new(current_timestamp)
        };

        // Update metrics
        metrics_state.record_transaction(gas_used, success, current_timestamp);
        metrics_state.serialize(&mut *metrics_state_info.try_borrow_mut_data()?)?;

        if gas_used > GAS_WARNING_THRESHOLD {
            msg!("Warning: High gas usage detected: {}", gas_used);
        }

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

        if !authority_info.is_signer {
            return Err(GuardError::UnauthorizedAccount.into());
        }

        if network_stats_info.owner != program_id {
            return Err(GuardError::InvalidAccountData.into());
        }

        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;

        let mut stats = ProgramState::try_from_slice(&network_stats_info.data.borrow())?;
        stats.update_network_stats(transactions_per_second, average_block_time, current_timestamp)?;
        stats.serialize(&mut *network_stats_info.try_borrow_mut_data()?)?;

        Ok(())
    }

    fn check_suspicious_patterns(program_data: &[u8]) -> bool {
        program_data.windows(4).any(|window| {
            matches!(window, &[0x48, 0x31, 0xc0, 0x90])
        }) || program_data.windows(2).any(|window| {
            matches!(window, &[0xeb, 0xfe])
        })
    }

    fn check_resource_usage(program_data: &[u8]) -> bool {
        let mut instruction_count = 0;
        let mut memory_ops = 0;

        for window in program_data.windows(2) {
            match window {
                [0x48, 0x89] => memory_ops += 1,
                [0xe8, _] => instruction_count += 1,
                _ => {}
            }
        }

        instruction_count > 1000 || memory_ops > 500
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_analyze_contract() {
        let program_id = Pubkey::new_unique();
        let mut lamports = 0;
        let mut program_data = vec![0; 100];
        let mut state_data = vec![0; 1000];
        
        let target_program_pubkey = Pubkey::new_unique();
        let target_program = AccountInfo::new(
            &target_program_pubkey,
            false,
            true,
            &mut lamports,
            &mut program_data,
            &program_id,
            false,
            Clock::default().epoch,
        );

        let mut analysis_state_lamports = 0;
        let analysis_state_pubkey = Pubkey::new_unique();
        let analysis_state = AccountInfo::new(
            &analysis_state_pubkey,
            false,
            true,
            &mut analysis_state_lamports,
            &mut state_data,
            &program_id,
            false,
            Clock::default().epoch,
        );

        let mut authority_lamports = 0;
        let mut authority_data = vec![0; 0];
        let authority_pubkey = Pubkey::new_unique();
        let authority = AccountInfo::new(
            &authority_pubkey,
            true,
            true,
            &mut authority_lamports,
            &mut authority_data,
            &program_id,
            false,
            Clock::default().epoch,
        );

        let mut program_state_lamports = 0;
        let program_state_pubkey = Pubkey::new_unique();
        let mut program_state_data = vec![0; 1000];
        let program_state = AccountInfo::new(
            &program_state_pubkey,
            false,
            true,
            &mut program_state_lamports,
            &mut program_state_data,
            &program_id,
            false,
            Clock::default().epoch,
        );

        let accounts = vec![
            target_program,
            analysis_state,
            authority,
            program_state,
        ];

        let result = Processor::process_analyze_contract(
            &program_id,
            &accounts,
            100,
        );

        assert!(result.is_ok());
    }

    #[test]
    fn test_suspicious_patterns() {
        let safe_data = vec![0x90, 0x90, 0x90, 0x90];
        let unsafe_data = vec![0x48, 0x31, 0xc0, 0x90];
        
        assert!(!Processor::check_suspicious_patterns(&safe_data));
        assert!(Processor::check_suspicious_patterns(&unsafe_data));
    }

    #[test]
    fn test_resource_usage() {
        let low_usage = vec![0x90, 0x90];
        let high_usage = vec![0x48, 0x89, 255];
        
        assert!(!Processor::check_resource_usage(&low_usage));
        assert!(Processor::check_resource_usage(&high_usage));
    }
}