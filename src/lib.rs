// program/src/lib.rs

use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    program_error::ProgramError,
    msg,
};

pub mod error;
pub mod instruction;
pub mod processor;
pub mod state;

use crate::processor::Processor;

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey,      // Public key of the program
    accounts: &[AccountInfo], // The accounts to interact with
    instruction_data: &[u8],  // Instruction data
) -> ProgramResult {
    msg!("SOON Guard program entrypoint");

    // Verify the program ID first
    if program_id.to_bytes() == [0; 32] {
        msg!("Invalid program ID");
        return Err(ProgramError::InvalidAccountData);
    }

    // Log the program invocation
    msg!("Processing instruction");
    msg!("Program ID: {}", program_id);
    msg!("Number of accounts: {}", accounts.len());
    msg!("Instruction data length: {}", instruction_data.len());

    // Basic input validation
    if instruction_data.is_empty() {
        msg!("No instruction data provided");
        return Err(ProgramError::InvalidInstructionData);
    }

    // Error handling wrapper to provide better error messages
    if let Err(error) = Processor::process(program_id, accounts, instruction_data) {
        msg!("Error processing instruction: {:?}", error);
        return Err(error);
    }

    msg!("Instruction processed successfully");
    Ok(())
}

// Constants for the program
pub mod constants {
    use solana_program::pubkey::Pubkey;
    
    // Default buffer sizes
    pub const MAX_ANALYSIS_BUFFER: usize = 1024;
    pub const MAX_METRICS_BUFFER: usize = 512;
    
    // Program version
    pub const PROGRAM_VERSION: &str = env!("CARGO_PKG_VERSION");
}

// Helper functions that can be used across the program
pub mod utils {
    use solana_program::{
        account_info::AccountInfo,
        program_error::ProgramError,
        pubkey::Pubkey,
    };

    pub fn check_account_owner(
        account: &AccountInfo,
        owner: &Pubkey,
    ) -> Result<(), ProgramError> {
        if account.owner != owner {
            return Err(ProgramError::IllegalOwner);
        }
        Ok(())
    }

    pub fn check_account_size(
        account: &AccountInfo,
        min_size: usize,
    ) -> Result<(), ProgramError> {
        if account.data_len() < min_size {
            return Err(ProgramError::AccountDataTooSmall);
        }
        Ok(())
    }

    pub fn check_signer(account: &AccountInfo) -> Result<(), ProgramError> {
        if !account.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }
        Ok(())
    }
}

// Tests module
#[cfg(test)]
mod tests {
    use super::*;
    use solana_program::clock::Epoch;

    // Helper function to create test accounts
    use std::rc::Rc;
    use std::cell::RefCell;

    fn create_test_account(owner: &Pubkey, data_len: usize) -> AccountInfo {
        let key = Pubkey::new_unique();
        let lamports = Rc::new(RefCell::new(0));
        let data = Rc::new(RefCell::new(vec![0; data_len]));
        AccountInfo::new(
            &key,
            false,
            true,
            lamports.borrow_mut().deref_mut(),
            data.borrow_mut().deref_mut(),
            owner,
            false,
            Epoch::default(),
        )
    }

    #[test]
    fn test_check_account_owner() {
        let program_id = Pubkey::new_unique();
        let wrong_owner = Pubkey::new_unique();
        let account = create_test_account(&program_id, 100);

        assert!(utils::check_account_owner(&account, &program_id).is_ok());
        assert!(utils::check_account_owner(&account, &wrong_owner).is_err());
    }

    #[test]
    fn test_check_account_size() {
        let program_id = Pubkey::new_unique();
        let account = create_test_account(&program_id, 100);

        assert!(utils::check_account_size(&account, 50).is_ok());
        assert!(utils::check_account_size(&account, 150).is_err());
    }

    #[test]
    fn test_check_signer() {
        let program_id = Pubkey::new_unique();
        let mut account = create_test_account(&program_id, 100);
        
        // Test non-signer
        assert!(utils::check_signer(&account).is_err());
        
        // Test signer
        account.is_signer = true;
        assert!(utils::check_signer(&account).is_ok());
    }
}

// Configuration for the build and deployment
#[cfg(all(target_arch = "bpf", not(feature = "no-entrypoint")))]
solana_program::program::declare_id!("SoonGuardxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

// Optional: Custom configuration for different networks
#[cfg(feature = "devnet")]
pub mod config {
    pub const NETWORK: &str = "devnet";
    pub const RPC_URL: &str = "https://api.devnet.solana.com";
}

#[cfg(feature = "mainnet-beta")]
pub mod config {
    pub const NETWORK: &str = "mainnet-beta";
    pub const RPC_URL: &str = "https://api.mainnet-beta.solana.com";
}