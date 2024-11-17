import {
    Connection,
    PublicKey,
    TransactionInstruction,
    SystemProgram,
    Transaction,
    SendOptions,
    Signer,
    //WalletContextState,
} from '@solana/web3.js';
import { BN } from 'bn.js';
import { PROGRAM_ID, SEEDS, BUFFER_SIZES, ERRORS, RISK_THRESHOLDS } from './constants';
import { WalletContextState } from '@solana/wallet-adapter-react';

interface AnalysisResult {
    riskScore: number;
    vulnerabilityCount: number;
    timestamp: number;
    details?: Record<string, any>;
}

interface MetricsData {
    totalTransactions: number;
    totalGasUsed: number;
    successRate: number;
    lastUpdated: number;
}

export class GuardProgram {
    [x: string]: any;
    private connection: Connection;
    private wallet: WalletContextState;

    constructor(connection: Connection, wallet: WalletContextState) {
        this.connection = connection;
        this.wallet = wallet;
    }

    /**
     * Creates instruction to analyze a contract
     */
    async createAnalyzeContractInstruction(
        targetProgram: PublicKey,
        dataSize: number = BUFFER_SIZES.ANALYSIS
    ): Promise<TransactionInstruction> {
        if (!this.wallet.publicKey) {
            throw new Error(ERRORS.NO_WALLET);
        }

        const [analysisAccount] = await PublicKey.findProgramAddress(
            [
                Buffer.from(SEEDS.ANALYSIS),
                targetProgram.toBuffer(),
            ],
            PROGRAM_ID
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
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
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
        success: boolean
    ): Promise<TransactionInstruction> {
        if (!this.wallet.publicKey) {
            throw new Error(ERRORS.NO_WALLET);
        }

        const [metricsAccount] = await PublicKey.findProgramAddress(
            [Buffer.from(SEEDS.METRICS)],
            PROGRAM_ID
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
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            ],
            programId: PROGRAM_ID,
            data,
        });
    }

    /**
     * Fetches and parses security analysis results
     */
    async fetchAnalysis(targetProgram: PublicKey): Promise<AnalysisResult> {
        const [analysisAccount] = await PublicKey.findProgramAddress(
            [
                Buffer.from(SEEDS.ANALYSIS),
                targetProgram.toBuffer(),
            ],
            PROGRAM_ID
        );

        try {
            const accountInfo = await this.connection.getAccountInfo(analysisAccount);
            if (!accountInfo) {
                throw new Error(ERRORS.INVALID_ACCOUNT);
            }

            return this.parseAnalysisData(accountInfo.data);
        } catch (error) {
            console.error('Error fetching analysis:', error);
            throw error;
        }
    }

    /**
     * Fetches and parses metrics data
     */
    async fetchMetrics(): Promise<MetricsData> {
        const [metricsAccount] = await PublicKey.findProgramAddress(
            [Buffer.from(SEEDS.METRICS)],
            PROGRAM_ID
        );

        try {
            const accountInfo = await this.connection.getAccountInfo(metricsAccount);
            if (!accountInfo) {
                throw new Error(ERRORS.INVALID_ACCOUNT);
            }

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
        signers: Signer[] = [],
        options?: SendOptions
    ): Promise<string> {
        if (!this.wallet.signTransaction || !this.wallet.publicKey) {
            throw new Error(ERRORS.NO_WALLET);
        }

        try {
            const transaction = new Transaction().add(...instructions);
            transaction.feePayer = this.wallet.publicKey;
            transaction.recentBlockhash = (
                await this.connection.getLatestBlockhash()
            ).blockhash;

            if (signers.length > 0) {
                transaction.partialSign(...signers);
            }

            const signedTx = await this.wallet.signTransaction(transaction);
            const signature = await this.connection.sendRawTransaction(
                signedTx.serialize(),
                options
            );

            await this.connection.confirmTransaction(signature, 'confirmed');
            return signature;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }

    private parseAnalysisData(data: Buffer): AnalysisResult {
        return {
            riskScore: data[0],
            vulnerabilityCount: new BN(data.slice(1, 3), 'le').toNumber(),
            timestamp: new BN(data.slice(3, 11), 'le').toNumber(),
            details: this.parseDetails(data.slice(11)),
        };
    }

    private parseMetricsData(data: Buffer): MetricsData {
        return {
            totalTransactions: new BN(data.slice(0, 8), 'le').toNumber(),
            totalGasUsed: new BN(data.slice(8, 16), 'le').toNumber(),
            successRate: data[16],
            lastUpdated: new BN(data.slice(17, 25), 'le').toNumber(),
        };
    }

    private parseDetails(data: Buffer): Record<string, any> {
        // Implement custom parsing logic for additional details
        return {};
    }
}

export const getRiskLevel = (score: number): keyof typeof RISK_THRESHOLDS => {
    if (score >= RISK_THRESHOLDS.LOW) return 'LOW';
    if (score >= RISK_THRESHOLDS.MEDIUM) return 'MEDIUM';
    return 'HIGH';
};

export const formatGas = (gas: number): string => {
    return new Intl.NumberFormat().format(gas);
};

export const calculateSuccessRate = (
    successful: number,
    total: number
): number => {
    if (total === 0) return 0;
    return Math.round((successful / total) * 100);
};