// app/src/components/monitoring/GasTracker.tsx

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useAnalytics } from '../../hooks/useAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

interface GasHistory {
    timestamp: number;
    avgGas: number;
    maxGas: number;
    minGas: number;
}

export const GasTracker: React.FC = () => {
    const { metrics, networkStats, isLoading, error } = useAnalytics();
    const [gasHistory, setGasHistory] = React.useState<GasHistory[]>([]);

    // Update gas history when metrics change
    React.useEffect(() => {
        if (metrics) {
            setGasHistory(prev => {
                const newHistory = [...prev];
                const now = Date.now();
                
                // Add new data point
                newHistory.push({
                    timestamp: now,
                    avgGas: metrics.avgGasUsed,
                    maxGas: metrics.totalGasUsed, // This should be max gas from metrics
                    minGas: metrics.avgGasUsed * 0.5, // This should be min gas from metrics
                });

                // Keep last 50 data points
                if (newHistory.length > 50) {
                    newHistory.shift();
                }

                return newHistory;
            });
        }
    }, [metrics]);

    // Format timestamp for chart
    const formatTime = (timestamp: number): string => {
        const date = new Date(timestamp);
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Gas Tracker</h2>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {metrics && (
                    <div className="grid grid-cols-3 gap-4 mt-2">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Average Gas</p>
                            <p className="text-lg font-semibold">
                                {metrics.avgGasUsed.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Success Rate</p>
                            <p className="text-lg font-semibold">
                                {metrics.successRate}%
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Total Tx</p>
                            <p className="text-lg font-semibold">
                                {metrics.totalTransactions.toLocaleString()}
                            </p>
                        </div>
                    </div>
                )}
            </CardHeader>

            <CardContent>
                {/* Gas Usage Chart */}
                <div className="h-[300px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={gasHistory}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="timestamp"
                                tickFormatter={formatTime}
                                interval="preserveStartEnd"
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={value => formatTime(Number(value))}
                                formatter={(value: number) => [value.toLocaleString(), 'Gas Units']}
                            />
                            <Line
                                type="monotone"
                                dataKey="avgGas"
                                stroke="#8884d8"
                                name="Average Gas"
                            />
                            <Line
                                type="monotone"
                                dataKey="maxGas"
                                stroke="#82ca9d"
                                name="Max Gas"
                                strokeDasharray="3 3"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Network Stats */}
                {networkStats && (
                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">TPS</p>
                            <p className="text-xl font-semibold">{networkStats.tps}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Avg Block Time</p>
                            <p className="text-xl font-semibold">
                                {networkStats.avgBlockTime.toFixed(2)}s
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default GasTracker;