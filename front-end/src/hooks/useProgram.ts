'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useMemo, useState } from 'react';
import { PublicKey, Commitment, TransactionConfirmationStrategy } from '@solana/web3.js';
import { ERRORS, BUFFER_SIZES } from '@/utils/constants';
import { GuardProgram } from '@/utils/program';

interface AnalyzeOptions {
    bufferSize?: number;
    commitment?: Commitment;
}

interface MetricsOptions {
    commitment?: Commitment;
}

interface TransactionOptions {
    skipPreflight?: boolean;
    maxRetries?: number;
    minContextSlot?: number;
    confirmStrategy?: TransactionConfirmationStrategy;
}

interface UseProgramReturn {
    program: GuardProgram | null;
    analyzeContract: (targetProgram: string, options?: AnalyzeOptions) => Promise<string>;
    recordMetrics: (gasUsed: number, success: boolean, options?: MetricsOptions) => Promise<string>;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
}

export function useProgram(): UseProgramReturn {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize program instance
    const program = useMemo(() => {
        if (!wallet.publicKey) return null;
        return new GuardProgram(connection, wallet);
    }, [connection, wallet]);

    // Clear error utility
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Analyze contract function
    const analyzeContract = useCallback(async (
        targetProgram: string,
        options: AnalyzeOptions = {}
    ): Promise<string> => {
        if (!program) {
            throw new Error(ERRORS.NO_PROGRAM);
        }
        if (!wallet.publicKey) {
            throw new Error(ERRORS.NO_WALLET);
        }

        setIsLoading(true);
        setError(null);

        try {
            const targetProgramKey = new PublicKey(targetProgram);
            
            // Create analyze instruction
            const instruction = await program.createAnalyzeContractInstruction(
                targetProgramKey,
                options.bufferSize || BUFFER_SIZES.ANALYSIS
            );

            // Transaction options
            const txOptions: TransactionOptions = {
                skipPreflight: false,
                maxRetries: 3,
                minContextSlot: 0,
            };

            if (options.commitment) {
                txOptions.confirmStrategy = {
                    minContextSlot: 0,
                    nonceAccountPubkey: new PublicKey('11111111111111111111111111111111'),
                    nonceValue: options.commitment,
                    signature: '', // Provide a valid signature here
                };
            }

            // Send transaction
            const signature = await program.sendAndConfirmTransaction(
                [instruction],
                [],
                txOptions
            );

            return signature;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, wallet.publicKey]);

    // Record metrics function
    const recordMetrics = useCallback(async (
        gasUsed: number,
        success: boolean,
        options: MetricsOptions = {}
    ): Promise<string> => {
        if (!program) {
            throw new Error(ERRORS.NO_PROGRAM);
        }
        if (!wallet.publicKey) {
            throw new Error(ERRORS.NO_WALLET);
        }

        setIsLoading(true);
        setError(null);

        try {
            const instruction = await program.createRecordMetricsInstruction(
                gasUsed,
                success
            );

            // Transaction options
            const txOptions: TransactionOptions = {
                skipPreflight: false,
                maxRetries: 3,
                minContextSlot: 0,
            };

            if (options.commitment) {
                txOptions.confirmStrategy = {
                    minContextSlot: 0,
                    nonceAccountPubkey: new PublicKey('11111111111111111111111111111111'),
                    nonceValue: options.commitment,
                    signature: '', // Provide a valid signature here
                };
            }

            // Send transaction
            const signature = await program.sendAndConfirmTransaction(
                [instruction],
                [],
                txOptions
            );

            return signature;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, wallet.publicKey]);

    return {
        program,
        analyzeContract,
        recordMetrics,
        isLoading,
        error,
        clearError,
    };
}

// Type exports
export type { AnalyzeOptions, MetricsOptions, TransactionOptions, UseProgramReturn };