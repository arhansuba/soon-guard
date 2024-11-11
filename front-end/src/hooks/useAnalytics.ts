// app/src/hooks/useAnalytics.ts

import { useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { REFRESH_INTERVALS } from '../utils/constants';
import { useProgram } from './useProgram';

interface AnalysisResult {
    riskScore: number;
    vulnerabilityCount: number;
    timestamp: number;
}

interface MetricsData {
    totalTransactions: number;
    totalGasUsed: number;
    successRate: number;
    avgGasUsed: number;
}

interface NetworkStats {
    tps: number;
    avgBlockTime: number;
    uniquePrograms: number;
    uniqueUsers: number;
}

interface UseAnalyticsReturn {
    analysis: AnalysisResult | null;
    metrics: MetricsData | null;
    networkStats: NetworkStats | null;
    isLoading: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
}

export function useAnalytics(
    targetProgram?: string,
    refreshInterval = REFRESH_INTERVALS.MEDIUM
): UseAnalyticsReturn {
    const { program } = useProgram();
    const { connection } = useConnection();
    
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch analysis data
    const fetchAnalysis = useCallback(async () => {
        if (!program || !targetProgram) return;

        try {
            const targetProgramKey = new PublicKey(targetProgram);
            const analysisData = await program.fetchAnalysis(targetProgramKey);
            
            setAnalysis({
                riskScore: analysisData.riskScore,
                vulnerabilityCount: analysisData.vulnerabilityCount,
                timestamp: analysisData.timestamp,
            });
        } catch (err) {
            console.error('Error fetching analysis:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
        }
    }, [program, targetProgram]);

    // Fetch metrics data
    const fetchMetrics = useCallback(async () => {
        if (!program) return;

        try {
            const metricsData = await program.fetchMetrics();
            
            setMetrics({
                totalTransactions: metricsData.totalTransactions,
                totalGasUsed: metricsData.totalGasUsed,
                successRate: metricsData.successRate,
                avgGasUsed: Math.floor(metricsData.totalGasUsed / metricsData.totalTransactions),
            });
        } catch (err) {
            console.error('Error fetching metrics:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
        }
    }, [program]);

    // Fetch network stats
    const fetchNetworkStats = useCallback(async () => {
        if (!connection) return;

        try {
            const [
                performance,
                epochInfo,
                supply,
            ] = await Promise.all([
                connection.getRecentPerformanceSamples(1),
                connection.getEpochInfo(),
                connection.getSupply(),
            ]);

            setNetworkStats({
                tps: performance[0]?.numTransactions || 0,
                avgBlockTime: performance[0]?.samplePeriodSecs || 0,
                uniquePrograms: 0, // Would need additional logic to track this
                uniqueUsers: 0, // Would need additional logic to track this
            });
        } catch (err) {
            console.error('Error fetching network stats:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch network stats');
        }
    }, [connection]);

    // Combined refresh function
    const refreshData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            await Promise.all([
                fetchAnalysis(),
                fetchMetrics(),
                fetchNetworkStats(),
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [fetchAnalysis, fetchMetrics, fetchNetworkStats]);

    // Set up automatic refresh
    useEffect(() => {
        refreshData();

        if (refreshInterval > 0) {
            const interval = setInterval(refreshData, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [refreshData, refreshInterval]);

    return {
        analysis,
        metrics,
        networkStats,
        isLoading,
        error,
        refreshData,
    };
}

// Optional: Export types for use in components
export type {
    AnalysisResult,
    MetricsData,
    NetworkStats,
};