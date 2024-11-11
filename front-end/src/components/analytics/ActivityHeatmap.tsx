// app/src/components/analytics/ActivityHeatmap.tsx

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Loader2, AlertTriangle } from 'lucide-react';

interface HeatmapData {
    hour: number;
    day: number;
    value: number;
}

export const ActivityHeatmap: React.FC = () => {
    const { metrics, isLoading, error } = useAnalytics();
    const [metric, setMetric] = React.useState<'transactions' | 'gas' | 'errors'>('transactions');
    const [heatmapData, setHeatmapData] = React.useState<HeatmapData[]>([]);

    // Generate mock data (replace with real data)
    React.useEffect(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data: HeatmapData[] = [];
        
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                data.push({
                    hour,
                    day,
                    value: Math.floor(Math.random() * 100),
                });
            }
        }
        
        setHeatmapData(data);
    }, [metric]);

    const getColor = (value: number): string => {
        const maxValue = Math.max(...heatmapData.map(d => d.value));
        const intensity = (value / maxValue) * 0.8; // Max 80% intensity
        
        switch (metric) {
            case 'transactions':
                return `rgba(59, 130, 246, ${intensity})`; // Blue
            case 'gas':
                return `rgba(245, 158, 11, ${intensity})`; // Orange
            case 'errors':
                return `rgba(239, 68, 68, ${intensity})`; // Red
            default:
                return `rgba(107, 114, 128, ${intensity})`; // Gray
        }
    };

    const formatValue = (value: number): string => {
        switch (metric) {
            case 'transactions':
                return `${value} tx`;
            case 'gas':
                return `${value}k gas`;
            case 'errors':
                return `${value} errors`;
            default:
                return `${value}`;
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Activity Heatmap</h2>
                        <p className="text-sm text-gray-500">Weekly activity patterns</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Select
                            value={metric}
                            onValueChange={(value: any) => setMetric(value)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select metric" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="transactions">Transactions</SelectItem>
                                <SelectItem value="gas">Gas Usage</SelectItem>
                                <SelectItem value="errors">Errors</SelectItem>
                            </SelectContent>
                        </Select>
                        {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {error ? (
                    <div className="flex items-center justify-center p-6">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="text-red-500">{error}</span>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Hour labels */}
                        <div className="flex mb-2">
                            <div className="w-16" /> {/* Spacer for day labels */}
                            {Array.from({ length: 24 }).map((_, hour) => (
                                <div
                                    key={hour}
                                    className="flex-1 text-center text-xs text-gray-500"
                                >
                                    {hour.toString().padStart(2, '0')}
                                </div>
                            ))}
                        </div>

                        {/* Heatmap grid */}
                        <div className="flex flex-col">
                            {Array.from({ length: 7 }).map((_, day) => (
                                <div key={day} className="flex">
                                    <div className="w-16 flex items-center">
                                        <span className="text-xs text-gray-500">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
                                        </span>
                                    </div>
                                    <div className="flex-1 flex">
                                        {Array.from({ length: 24 }).map((_, hour) => {
                                            const data = heatmapData.find(
                                                d => d.day === day && d.hour === hour
                                            );
                                            return (
                                                <div
                                                    key={hour}
                                                    className="flex-1 aspect-square border border-gray-100"
                                                    style={{
                                                        backgroundColor: data ? getColor(data.value) : 'transparent',
                                                    }}
                                                    title={data ? formatValue(data.value) : '0'}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="mt-4 flex items-center justify-end">
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Low</span>
                                <div className="flex space-x-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div