'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useMemo, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { ERRORS, BUFFER_SIZES } from '@/utils/constants';
import { GuardProgram } from '@/utils/program';

interface AnalyzeOptions {
    bufferSize?: number;
    commitment?: 'processed' | 'confirmed' | 'finalized';
    clearError: () => void;
}

interface MetricsOptions {
    commitment?: 'processed' | 'confirmed' | 'finalized';
}

interface UseProgramReturn {
    program: GuardProgram | null;
    analyzeContract: (targetProgram: string, options?: AnalyzeOptions) => Promise<string>;
    recordMetrics: (gasUsed: number, success: boolean, options?: MetricsOptions) => Promise<string>;
    isLoading: boolean;
    error: string | null;
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

            // Send transaction
            const signature = await program.sendAndConfirmTransaction(
                [instruction],
                [],
                {
                    commitment: options.commitment || 'confirmed',
                    skipPreflight: false,
                }
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
            // Create metrics instruction
            const instruction = await program.createRecordMetricsInstruction(
                gasUsed,
                success
            );

            // Send transaction
            const signature = await program.sendAndConfirmTransaction(
                [instruction],
                [],
                {
                    commitment: options.commitment || 'confirmed',
                    skipPreflight: false,
                }
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

    // Additional utility function for error handling
    const clearError = useCallback(() => {
        setError(null);
    }, []);

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
export type { AnalyzeOptions, MetricsOptions, UseProgramReturn };