// app/src/hooks/useProgram.ts

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useMemo, useState } from 'react';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { PROGRAM_ID, ERRORS } from '../utils/constants';
import { GuardProgram } from '../utils/program';

interface UseProgramReturn {
    program: GuardProgram | null;
    analyzeContract: (targetProgram: string) => Promise<string>;
    recordMetrics: (gasUsed: number, success: boolean) => Promise<string>;
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
    const analyzeContract = useCallback(async (targetProgram: string): Promise<string> => {
        if (!program) throw new Error(ERRORS.NO_PROGRAM);
        if (!wallet.publicKey) throw new Error(ERRORS.NO_WALLET);

        setIsLoading(true);
        setError(null);

        try {
            const targetProgramKey = new PublicKey(targetProgram);
            
            // Create analyze instruction
            const instruction = await program.createAnalyzeContractInstruction(
                targetProgramKey,
                1024 // Default buffer size
            );

            // Send transaction
            const signature = await program.sendAndConfirmTransaction([instruction]);
            
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
    const recordMetrics = useCallback(async (gasUsed: number, success: boolean): Promise<string> => {
        if (!program) throw new Error(ERRORS.NO_PROGRAM);
        if (!wallet.publicKey) throw new Error(ERRORS.NO_WALLET);

        setIsLoading(true);
        setError(null);

        try {
            const instruction = await program.createRecordMetricsInstruction(
                gasUsed,
                success
            );

            const signature = await program.sendAndConfirmTransaction([instruction]);
            
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
    };
}