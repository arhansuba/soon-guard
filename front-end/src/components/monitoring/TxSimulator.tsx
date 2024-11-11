// app/src/components/monitoring/TxSimulator.tsx

import React, { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useProgram } from '../../hooks/useProgram';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface SimulationResult {
    gasEstimate: number;
    success: boolean;
    error?: string;
}

export const TxSimulator: React.FC = () => {
    const { program, isLoading } = useProgram();
    const { metrics } = useAnalytics();
    
    const [programId, setProgramId] = useState('');
    const [data, setData] = useState('');
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSimulation = useCallback(async () => {
        if (!program) return;
        setError(null);
        setResult(null);

        try {
            // Validate inputs
            const targetProgram = new PublicKey(programId);
            const inputData = Buffer.from(data.replace(/\s+/g, ''), 'hex');

            // Create a test transaction for simulation
            const instruction = await program.createAnalyzeContractInstruction(
                targetProgram,
                inputData.length
            );

            // Simulate transaction
            const simulation = await program.connection.simulateTransaction(
                instruction
            );

            // Parse simulation results
            setResult({
                gasEstimate: simulation.value.unitsConsumed || 0,
                success: !simulation.value.err,
                error: simulation.value.err?.toString(),
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Simulation failed');
        }
    }, [program, programId, data]);

    const getGasWarningLevel = (gas: number): 'success' | 'warning' | 'error' => {
        const avgGas = metrics?.avgGasUsed || 0;
        if (gas <= avgGas) return 'success';
        if (gas <= avgGas * 1.5) return 'warning';
        return 'error';
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <h2 className="text-2xl font-bold">Transaction Simulator</h2>
                <p className="text-sm text-gray-500">
                    Test your transactions before sending them to the network
                </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
                {/* Input Fields */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium">Program ID</label>
                    <Input
                        value={programId}
                        onChange={(e) => setProgramId(e.target.value)}
                        placeholder="Enter program ID"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">Instruction Data (hex)</label>
                    <Input
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        placeholder="Enter instruction data"
                        className="w-full"
                    />
                </div>

                {/* Simulation Button */}
                <Button 
                    onClick={handleSimulation}
                    disabled={isLoading || !programId || !data}
                    className="w-full"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Simulating...
                        </>
                    ) : (
                        'Simulate Transaction'
                    )}
                </Button>

                {/* Results Display */}
                {result && (
                    <div className="mt-4 space-y-2">
                        <div className={`p-4 rounded-md ${
                            result.success ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                            <h3 className="font-medium">
                                {result.success ? 'Simulation Successful' : 'Simulation Failed'}
                            </h3>
                            
                            <div className="mt-2">
                                <p className="text-sm">
                                    Estimated Gas: {result.gasEstimate.toLocaleString()} units
                                </p>
                                {metrics?.avgGasUsed && (
                                    <p className={`text-sm ${
                                        getGasWarningLevel(result.gasEstimate) === 'error' 
                                            ? 'text-red-600' 
                                            : getGasWarningLevel(result.gasEstimate) === 'warning'
                                                ? 'text-yellow-600'
                                                : 'text-green-600'
                                    }`}>
                                        {result.gasEstimate > metrics.avgGasUsed
                                            ? `${((result.gasEstimate / metrics.avgGasUsed) * 100 - 100).toFixed(1)}% higher than average`
                                            : `${((metrics.avgGasUsed / result.gasEstimate) * 100 - 100).toFixed(1)}% lower than average`
                                        }
                                    </p>
                                )}
                            </div>
                            
                            {result.error && (
                                <p className="mt-2 text-sm text-red-600">
                                    Error: {result.error}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>
                            {error}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

export default TxSimulator;