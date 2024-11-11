// app/src/components/security/RiskScanner.tsx

import React, { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useProgram } from '../../hooks/useProgram';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface RiskLevel {
    label: string;
    color: string;
    icon: React.ReactNode;
    description: string;
}

const RISK_LEVELS: Record<string, RiskLevel> = {
    LOW: {
        label: 'Low Risk',
        color: 'bg-green-500',
        icon: <CheckCircle className="h-6 w-6 text-green-500" />,
        description: 'This program appears to be secure with no major vulnerabilities detected.',
    },
    MEDIUM: {
        label: 'Medium Risk',
        color: 'bg-yellow-500',
        icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
        description: 'Some potential issues detected. Review recommended.',
    },
    HIGH: {
        label: 'High Risk',
        color: 'bg-red-500',
        icon: <XCircle className="h-6 w-6 text-red-500" />,
        description: 'Critical vulnerabilities detected. Immediate attention required.',
    },
};

export const RiskScanner: React.FC = () => {
    const { program, analyzeContract, isLoading } = useProgram();
    const [programId, setProgramId] = useState('');
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{
        score: number;
        riskLevel: keyof typeof RISK_LEVELS;
        timestamp: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getRiskLevel = (score: number): keyof typeof RISK_LEVELS => {
        if (score >= 80) return 'LOW';
        if (score >= 50) return 'MEDIUM';
        return 'HIGH';
    };

    const simulateProgress = () => {
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 2;
            });
        }, 100);
        return interval;
    };

    const handleScan = useCallback(async () => {
        if (!program || !programId) return;
        
        setScanning(true);
        setError(null);
        setResult(null);
        
        const progressInterval = simulateProgress();

        try {
            const targetProgram = new PublicKey(programId);
            await analyzeContract(targetProgram.toString());

            // Simulate analysis result (replace with actual analysis from program)
            const mockScore = Math.floor(Math.random() * 100);
            
            setResult({
                score: mockScore,
                riskLevel: getRiskLevel(mockScore),
                timestamp: Date.now(),
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Scan failed');
        } finally {
            clearInterval(progressInterval);
            setProgress(100);
            setScanning(false);
        }
    }, [program, programId, analyzeContract]);

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center space-x-2">
                <Shield className="h-6 w-6" />
                <div>
                    <h2 className="text-2xl font-bold">Security Risk Scanner</h2>
                    <p className="text-sm text-gray-500">
                        Analyze smart contracts for potential security risks
                    </p>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium">Program ID</label>
                    <Input
                        value={programId}
                        onChange={(e) => setProgramId(e.target.value)}
                        placeholder="Enter program ID to scan"
                        className="w-full"
                        disabled={scanning}
                    />
                </div>

                <Button
                    onClick={handleScan}
                    disabled={scanning || !programId || isLoading}
                    className="w-full"
                >
                    {scanning ? 'Scanning...' : 'Start Security Scan'}
                </Button>

                {scanning && (
                    <div className="space-y-2">
                        <Progress value={progress} />
                        <p className="text-sm text-center text-gray-500">
                            Analyzing program security...
                        </p>
                    </div>
                )}

                {result && (
                    <div className="mt-6 space-y-4">
                        <div className="flex items-center space-x-2">
                            {RISK_LEVELS[result.riskLevel].icon}
                            <span className="font-semibold">
                                {RISK_LEVELS[result.riskLevel].label}
                            </span>
                        </div>

                        <div className="p-4 rounded-lg bg-gray-50">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Security Score</span>
                                    <span className="font-bold">{result.score}/100</span>
                                </div>
                                <Progress 
                                    value={result.score} 
                                    className={`h-2 ${RISK_LEVELS[result.riskLevel].color}`}
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-600">
                                {RISK_LEVELS[result.riskLevel].description}
                            </p>
                        </div>

                        <div className="text-sm text-gray-500 text-right">
                            Last scanned: {new Date(result.timestamp).toLocaleString()}
                        </div>
                    </div>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

export default RiskScanner;