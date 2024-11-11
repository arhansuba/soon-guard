// app/src/components/analytics/ContractMetrics.tsx

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalytics } from '../../hooks/useAnalytics';
import { 
    LineChart, 
    Line, 
    BarChart,
    Bar,
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Legend 
} from 'recharts';
import { Loader2, AlertTriangle, Activity, Users, Clock, Cpu } from 'lucide-react';

interface MetricCard {
    title: string;
    value: string | number;
    change: number;
    icon: React.ReactNode;
}

export const ContractMetrics: React.FC<{ programId?: string }> = ({ programId }) => {
    const { metrics, isLoading, error } = useAnalytics(programId);
    const [timeRange, setTimeRange] = React.useState<'24h' | '7d' | '30d'>('24h');

    // Generate mock historical data (replace with real data)
    const generateHistoricalData = (days: number) => {
        return Array.from({ length: days }).map((_, i) => ({
            timestamp: Date.now() - (i * 86400000),
            transactions: Math.floor(Math.random() * 1000),
            gasUsed: Math.floor(Math.random() * 5000000),
            uniqueUsers: Math.floor(Math.random() * 100),
            avgResponseTime: Math.random() * 2,
        }));
    };

    const historicalData = React.useMemo(() => ({
        '24h': generateHistoricalData(24),
        '7d': generateHistoricalData(7),
        '30d': generateHistoricalData(30),
    }), []);

    const getMetricCards = (): MetricCard[] => {
        if (!metrics) return [];

        return [
            {
                title: 'Total Transactions',
                value: metrics.totalTransactions.toLocaleString(),
                change: 12.5,
                icon: <Activity className="h-5 w-5 text-blue-500" />,
            },
            {
                title: 'Unique Users',
                value: '1,234',
                change: 8.2,
                icon: <Users className="h-5 w-5 text-green-500" />,
            },
            {
                title: 'Avg Response Time',
                value: '1.2s',
                change: -5.3,
                icon: <Clock className="h-5 w-5 text-purple-500" />,
            },
            {
                title: 'Gas Usage',
                value: `${(metrics.totalGasUsed / 1000000).toFixed(2)}M`,
                change: 3.8,
                icon: <Cpu className="h-5 w-5 text-orange-500" />,
            },
        ];
    };

    const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp);
        switch (timeRange) {
            case '24h':
                return date.getHours() + ':00';
            case '7d':
                return date.toLocaleDateString(undefined, { weekday: 'short' });
            case '30d':
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            default:
                return '';
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Contract Metrics</h2>
                    {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                </div>
                {programId && (
                    <p className="text-sm text-gray-500">
                        Program: {programId.slice(0, 6)}...{programId.slice(-4)}
                    </p>
                )}
            </CardHeader>

            <CardContent>
                {error ? (
                    <div className="flex items-center justify-center p-6">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="text-red-500">{error}</span>
                    </div>
                ) : (
                    <>
                        {/* Metric Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {getMetricCards().map((metric, index) => (
                                <div 
                                    key={index}
                                    className="p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex justify-between items-start">
                                        {metric.icon}
                                        <span className={`text-sm ${
                                            metric.change > 0 ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                            {metric.change > 0 ? '+' : ''}{metric.change}%
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold mt-2">{metric.value}</h3>
                                    <p className="text-sm text-gray-500">{metric.title}</p>
                                </div>
                            ))}
                        </div>

                        {/* Charts */}
                        <Tabs defaultValue="transactions" className="w-full">
                            <div className="flex justify-between items-center mb-4">
                                <TabsList>
                                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                                    <TabsTrigger value="gas">Gas Usage</TabsTrigger>
                                    <TabsTrigger value="users">Users</TabsTrigger>
                                </TabsList>

                                <div className="flex space-x-2">
                                    {['24h', '7d', '30d'].map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => setTimeRange(range as any)}
                                            className={`px-3 py-1 text-sm rounded-md ${
                                                timeRange === range
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'text-gray-500 hover:bg-gray-100'
                                            }`}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <TabsContent value="transactions" className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={historicalData[timeRange]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="timestamp" 
                                            tickFormatter={formatTimestamp}
                                        />
                                        <YAxis />
                                        <Tooltip 
                                            labelFormatter={(value) => formatTimestamp(Number(value))}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="transactions"
                                            stroke="#3B82F6"
                                            name="Transactions"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </TabsContent>

                            <TabsContent value="gas" className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={historicalData[timeRange]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="timestamp" 
                                            tickFormatter={formatTimestamp}
                                        />
                                        <YAxis />
                                        <Tooltip 
                                            labelFormatter={(value) => formatTimestamp(Number(value))}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="gasUsed"
                                            fill="#F59E0B"
                                            name="Gas Used"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </TabsContent>

                            <TabsContent value="users" className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={historicalData[timeRange]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="timestamp" 
                                            tickFormatter={formatTimestamp}
                                        />
                                        <YAxis />
                                        <Tooltip 
                                            labelFormatter={(value) => formatTimestamp(Number(value))}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="uniqueUsers"
                                            stroke="#10B981"
                                            name="Unique Users"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="avgResponseTime"
                                            stroke="#8B5CF6"
                                            name="Avg Response Time"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default ContractMetrics;