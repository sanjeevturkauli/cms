"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartDataItem {
    date: string;
    month: string;
    revenue: number;
    users: number;
}

interface Props {
    chartData?: ChartDataItem[];
}

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

export function RevenueChart({ chartData = [] }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue for the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
                {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                        No revenue data available
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                className="text-muted-foreground"
                            />
                            <YAxis
                                tickFormatter={formatCurrency}
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                className="text-muted-foreground"
                                width={80}
                            />
                            <Tooltip
                                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                                labelStyle={{ fontWeight: 600 }}
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: '1px solid hsl(var(--border))',
                                    background: 'hsl(var(--card))',
                                    color: 'hsl(var(--foreground))',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fill="url(#revenueGradient)"
                                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}
