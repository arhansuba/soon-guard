// program/src/instruction.rs

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::program_error::ProgramError;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum GuardInstruction {
    /// Analyzes a contract for common vulnerabilities and patterns
    /// 
    /// Accounts expected:
    /// 0. `[readable]` Target program account to analyze
    /// 1. `[writable]` Analysis result storage account
    /// 2. `[signer]` Analysis requester
    AnalyzeContract {
        /// Buffer size for analysis data
        data_size: u64,
    },

    /// Records gas usage patterns and transaction statistics
    /// 
    /// Accounts expected:
    /// 0. `[writable]` Metrics storage account
    /// 1. `[signer]` Transaction submitter
    RecordMetrics {
        /// Gas used in the transaction
        gas_used: u64,
        /// Success status of transaction
        success: bool,
    },

    /// Updates network health indicators
    /// 
    /// Accounts expected:
    /// 0. `[writable]` Network stats account
    /// 1. `[signer]` Update authority
    UpdateNetworkStats {
        /// Current TPS
        transactions_per_second: u64,
        /// Average block time
        average_block_time: u64,
    },
}

impl GuardInstruction {
    /// Unpacks a byte buffer into a GuardInstruction
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&variant, rest) = input.split_first().ok_or(ProgramError::InvalidInstructionData)?;
        Ok(match variant {
            0 => {
                let data_size = Self::unpack_u64(rest)?;
                Self::AnalyzeContract { data_size }
            }
            1 => {
                let (gas_used, rest) = Self::unpack_u64(rest)?;
                let success = rest[0] != 0;
                Self::RecordMetrics { gas_used, success }
            }
            2 => {
                let (transactions_per_second, rest) = Self::unpack_u64(rest)?;
                let average_block_time = Self::unpack_u64(rest)?.0;
                Self::UpdateNetworkStats {
                    transactions_per_second,
                    average_block_time,
                }
            }
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }

    /// Packs a u64 into a byte buffer
    fn unpack_u64(input: &[u8]) -> Result<(u64, &[u8]), ProgramError> {
        if input.len() < 8 {
            return Err(ProgramError::InvalidInstructionData);
        }
        let (bytes, rest) = input.split_at(8);
        let value = u64::from_le_bytes(bytes.try_into().unwrap());
        Ok((value, rest))
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_instruction_packing() {
        let instruction = GuardInstruction::AnalyzeContract { data_size: 1000 };
        let packed = borsh::to_vec(&instruction).unwrap();
        let unpacked = GuardInstruction::unpack(&packed).unwrap();
        assert_eq!(instruction, unpacked);
    }

    #[test]
    fn test_record_metrics_packing() {
        let instruction = GuardInstruction::RecordMetrics {
            gas_used: 50000,
            success: true,
        };
        let packed = borsh::to_vec(&instruction).unwrap();
        let unpacked = GuardInstruction::unpack(&packed).unwrap();
        assert_eq!(instruction, unpacked);
    }
}