// app/src/utils/program.ts

import {
    Connection,
    PublicKey,
    TransactionInstruction,
    SystemProgram,
    Transaction,
    SendOptions,
} from '@solana/web3.js';
import { BN } from 'bn.js';
import { PROGRAM_ID, SEEDS, BUFFER_SIZES } from './constants';

export class GuardProgram {
    constructor(
        private connection: Connection,
        private wallet: any, // Wallet type depends on your wallet adapter
    ) {}

    /**
     * Creates instruction to analyze a contract
     */
    async createAnalyzeContractInstruction(
        targetProgram: PublicKey,
        dataSize: number,
    ): Promise<TransactionInstruction> {
        // Derive PDA for analysis state account
        const [analysisAccount] = await PublicKey.findProgramAddress(
            [
                Buffer.from(SEEDS.ANALYSIS),
                targetProgram.toBuffer(),
            ],
            PROGRAM_ID,
        );

        const data = Buffer.from([
            0, // Instruction index for AnalyzeContract
            ...new BN(dataSize).toArray('le', 8),
        ]);

        return new TransactionInstruction({
            keys: [
                { pubkey: targetProgram, isSigner: false, isWritable: false },
                { pubkey: analysisAccount, isSigner: false, isWritable: true },
                { pubkey: this.wallet.publicKey, isSigner: true, isWritable: false },
            ],
            programId: PROGRAM_ID,
            data,
        });
    }

    /**
     * Creates instruction to record metrics
     */
    async createRecordMetricsInstruction(
        gasUsed: number,
        success: boolean,
    ): Promise<TransactionInstruction> {
        const [metricsAccount] = await PublicKey.findProgramAddress(
            [Buffer.from(SEEDS.METRICS)],
            PROGRAM_ID,
        );

        const data = Buffer.from([
            1, // Instruction index for RecordMetrics
            ...new BN(gasUsed).toArray('le', 8),
            success ? 1 : 0,
        ]);

        return new TransactionInstruction({
            keys: [
                { pubkey: metricsAccount, isSigner: false, isWritable: true },
                { pubkey: this.wallet.publicKey, isSigner: true, isWritable: false },
            ],
            programId: PROGRAM_ID,
            data,
        });
    }

    /**
     * Fetches and parses security analysis results
     */
    async fetchAnalysis(targetProgram: PublicKey) {
        const [analysisAccount] = await PublicKey.findProgramAddress(
            [
                Buffer.from(SEEDS.ANALYSIS),
                targetProgram.toBuffer(),
            ],
            PROGRAM_ID,
        );

        try {
            const accountInfo = await this.connection.getAccountInfo(analysisAccount);
            if (!accountInfo) {
                throw new Error('Analysis account not found');
            }

            // Parse account data based on your schema
            return this.parseAnalysisData(accountInfo.data);
        } catch (error) {
            console.error('Error fetching analysis:', error);
            throw error;
        }
    }

    /**
     * Fetches and parses metrics data
     */
    async fetchMetrics() {
        const [metricsAccount] = await PublicKey.findProgramAddress(
            [Buffer.from(SEEDS.METRICS)],
            PROGRAM_ID,
        );

        try {
            const accountInfo = await this.connection.getAccountInfo(metricsAccount);
            if (!accountInfo) {
                throw new Error('Metrics account not found');
            }

            // Parse account data based on your schema
            return this.parseMetricsData(accountInfo.data);
        } catch (error) {
            console.error('Error fetching metrics:', error);
            throw error;
        }
    }

    /**
     * Helper function to send and confirm transaction
     */
    async sendAndConfirmTransaction(
        instructions: TransactionInstruction[],
        signers?: any[],
        options?: SendOptions,
    ): Promise<string> {
        try {
            const transaction = new Transaction().add(...instructions);
            const signature = await this.wallet.sendTransaction(
                transaction,
                this.connection,
                { signers, ...options },
            );

            await this.connection.confirmTransaction(signature);
            return signature;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }

    private parseAnalysisData(data: Buffer) {
        // Implement parsing logic based on your account schema
        return {
            riskScore: data[0],
            vulnerabilityCount: new BN(data.slice(1, 3), 'le').toNumber(),
            timestamp: new BN(data.slice(3, 11), 'le').toNumber(),
            // Add more fields as needed
        };
    }

    private parseMetricsData(data: Buffer) {
        // Implement parsing logic based on your account schema
        return {
            totalTransactions: new BN(data.slice(0, 8), 'le').toNumber(),
            totalGasUsed: new BN(data.slice(8, 16), 'le').toNumber(),
            successRate: data[16],
            // Add more fields as needed
        };
    }
}

export function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score >= 80) return 'LOW';
    if (score >= 50) return 'MEDIUM';
    return 'HIGH';
}

export function formatGas(gas: number): string {
    return gas.toLocaleString();
}

export function calculateSuccessRate(
    successful: number,
    total: number,
): number {
    if (total === 0) return 0;
    return Math.round((successful / total) * 100);
}