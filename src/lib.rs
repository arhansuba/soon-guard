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
pub mod constants;

use crate::{
    processor::Processor,
    instruction::GuardInstruction,
};

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("SOON Guard program entrypoint");

    // Verify program ID 
    if program_id.to_bytes() == [0; 32] {
        msg!("Invalid program ID");
        return Err(ProgramError::InvalidAccountData);
    }

    // Parse instruction data
    let instruction = GuardInstruction::unpack(instruction_data)?;

    // Log instruction details
    msg!("Processing instruction: {:?}", instruction);
    msg!("Number of accounts: {}", accounts.len());

    // Process the instruction through processor
    match Processor::process(program_id, accounts, instruction_data) {
        Ok(_) => {
            msg!("Instruction processed successfully");
            Ok(())
        }
        Err(error) => {
            msg!("Error processing instruction: {:?}", error);
            Err(error)
        }
    }
}

// Utility functions
pub mod utils {
    use solana_program::{
        account_info::AccountInfo,
        program_error::ProgramError,
        pubkey::Pubkey,
        msg,
    };
    use crate::constants;

    pub fn check_account_owner(
        account: &AccountInfo,
        owner: &Pubkey,
    ) -> Result<(), ProgramError> {
        if account.owner != owner {
            msg!("Account owner mismatch");
            return Err(ProgramError::IllegalOwner);
        }
        Ok(())
    }

    pub fn check_account_size(
        account: &AccountInfo,
        min_size: usize,
    ) -> Result<(), ProgramError> {
        if account.data_len() < min_size {
            msg!("Account data too small");
            return Err(ProgramError::AccountDataTooSmall);
        }
        Ok(())
    }

    pub fn check_signer(account: &AccountInfo) -> Result<(), ProgramError> {
        if !account.is_signer {
            msg!("Missing required signature");
            return Err(ProgramError::MissingRequiredSignature);
        }
        Ok(())
    }

    pub fn validate_program_account(
        account: &AccountInfo,
        program_id: &Pubkey,
    ) -> Result<(), ProgramError> {
        check_account_owner(account, program_id)?;
        if account.data_len() > constants::MAX_CONTRACT_SIZE {
            msg!("Program size exceeds maximum allowed");
            return Err(ProgramError::InvalidAccountData);
        }
        Ok(())
    }
}

// Tests
#[cfg(test)]
mod tests {
    use super::*;
    use solana_program::clock::Epoch;
    use crate::constants::MAX_CONTRACT_SIZE;

    #[test]
    fn test_invalid_program_id() {
        let accounts = Vec::new();
        let instruction_data = vec![];
        let zero_key = vec![0; 32];
        
        let result = process_instruction(
            &Pubkey::new_from_array(zero_key.try_into().unwrap()),
            &accounts,
            &instruction_data,
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_program_account() {
        let program_id = Pubkey::new_unique();
        let mut lamports = 0;
        let mut data = vec![0; 1024];
        
        let binding = Pubkey::new_unique();
        let account = AccountInfo::new(
            &binding,
            false,
            true,
            &mut lamports,
            &mut data,
            &program_id,
            false,
            Epoch::default(),
        );
        
        assert!(utils::validate_program_account(&account, &program_id).is_ok());

        let mut large_data = vec![0; MAX_CONTRACT_SIZE + 1];
        let large_pubkey = Pubkey::new_unique();
        let large_account = AccountInfo::new(
            &large_pubkey,
            false,
            true,
            &mut lamports,
            &mut large_data,
            &program_id,
            false,
            Epoch::default(),
        );
        
        assert!(utils::validate_program_account(&large_account, &program_id).is_err());
    }
}

// Build configuration
#[cfg(all(target_arch = "bpf", not(feature = "no-entrypoint")))]
solana_program::program::declare_id!("GuardV1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

// Network configurations
#[cfg(feature = "devnet")]
pub mod config {
    pub const NETWORK: &str = "devnet";
    pub const RPC_URL: &str = "https://rpc.devnet.soo.network/rpc";
}

#[cfg(feature = "mainnet-beta")]
pub mod config {
    pub const NETWORK: &str = "mainnet-beta";
    pub const RPC_URL: &str = "https://api.mainnet-beta.solana.com";
}