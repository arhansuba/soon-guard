// app/src/components/analytics/NetworkHealth.tsx

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAnalytics } from '../../hooks/useAnalytics';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';
import { 
    Loader2, 
    AlertTriangle, 
    Zap, 
    Clock, 
    Server, 
    CheckCircle 
} from 'lucide-react';

const STATUS_COLORS = {
    Healthy: 'text-green-500',
    Warning: 'text-yellow-500',
    Critical: 'text-red-500',
};

export const NetworkHealth: React.FC = () => {
    const { networkStats, isLoading, error } = useAnalytics();
    const [historicalHealth, setHistoricalHealth] = React.useState<any[]>([]);

    // Generate mock historical data (replace with real data)
    React.useEffect(() => {
        const generateData = () => {
            const now = Date.now();
            const data = Array.from({ length: 24 }).map((_, i) => ({
                timestamp: now - (i * 3600000),
                tps: Math.floor(Math.random() * 2000) + 1000,
                latency: Math.random() * 100 + 50,
                errorRate: Math.random() * 2,
                successRate: Math.random() * 10 + 90,
            }));
            setHistoricalHealth(data.reverse());
        };

        generateData();
        const interval = setInterval(generateData, 60000);
        return () => clearInterval(interval);
    }, []);

    const getHealthStatus = (metric: number, thresholds: { warning: number; critical: number }) => {
        if (metric <= thresholds.critical) return 'Critical';
        if (metric <= thresholds.warning) return 'Warning';
        return 'Healthy';
    };

    const getHealthMetrics = () => [
        {
            name: 'TPS',
            value: networkStats?.tps || 0,
            status: getHealthStatus(networkStats?.tps || 0, { warning: 800, critical: 500 }),
            icon: <Zap className="h-5 w-5" />,
            format: (v: number) => `${v.toLocaleString()} tx/s`,
            target: '2,000 tx/s',
        },
        {
            name: 'Latency',
            value: networkStats?.avgBlockTime || 0,
            status: getHealthStatus(networkStats?.avgBlockTime || 0, { warning: 1.5, critical: 2 }),
            icon: <Clock className="h-5 w-5" />,
            format: (v: number) => `${v.toFixed(2)}s`,
            target: '0.4s',
        },
        {
            name: 'Success Rate',
            value: 99.2,
            status: getHealthStatus(99.2, { warning: 98, critical: 95 }),
            icon: <CheckCircle className="h-5 w-5" />,
            format: (v: number) => `${v.toFixed(1)}%`,
            target: '99.9%',
        },
        {
            name: 'Node Health',
            value: 98,
            status: getHealthStatus(98, { warning: 90, critical: 80 }),
            icon: <Server className="h-5 w-5" />,
            format: (v: number) => `${v.toFixed(0)}%`,
            target: '100%',
        },
    ];

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Network Health</h2>
                        <p className="text-sm text-gray-500">Real-time network performance metrics</p>
                    </div>
                    {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                </div>
            </CardHeader>

            <CardContent>
                {error ? (
                    <div className="flex items-center justify-center p-6">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="text-red-500">{error}</span>
                    </div>
                ) : (
                    <>
                        {/* Health Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {getHealthMetrics().map((metric, index) => (
                                <div 
                                    key={index}
                                    className="p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center space-x-2">
                                            <span className={STATUS_COLORS[metric.status as keyof typeof STATUS_COLORS]}>
                                                {metric.icon}
                                            </span>
                                            <span className="text-sm font-medium">{metric.name}</span>
                                        </div>
                                        <span className={`text-sm ${STATUS_COLORS[metric.status as keyof typeof STATUS_COLORS]}`}>
                                            {metric.status}
                                        </span>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-2xl font-bold">
                                                {metric.format(metric.value)}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                Target: {metric.target}
                                            </span>
                                        </div>
                                        <Progress
                                            value={(metric.value / parseFloat(metric.target.replace(/[^0-9.]/g, ''))) * 100}
                                            className={`mt-2 ${
                                                metric.status === 'Critical' ? 'bg-red-200' :
                                                metric.status === 'Warning' ? 'bg-yellow-200' :
                                                'bg-green-200'
                                            }`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Network Performance Chart */}
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4">Network Performance Trend</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={historicalHealth}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="timestamp"
                                            tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                                        />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip 
                                            labelFormatter={(ts) => new Date(Number(ts)).toLocaleString()}
                                            formatter={(value: number, name: string) => [
                                                `${value.toFixed(2)}${name === 'successRate' ? '%' : 
                                                  name === 'tps' ? ' tx/s' : 
                                                  name === 'latency' ? 'ms' : ''
                                                }`,
                                                name === 'successRate' ? 'Success Rate' :
                                                name === 'tps' ? 'TPS' :
                                                name === 'latency' ? 'Latency' : name
                                            ]}
                                        />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="tps"
                                            stroke="#3B82F6"
                                            name="TPS"
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="successRate"
                                            stroke="#10B981"
                                            name="Success Rate"
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="latency"
                                            stroke="#F59E0B"
                                            name="Latency"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default NetworkHealth;