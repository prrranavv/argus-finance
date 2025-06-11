'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrencyInLakhs } from '@/lib/utils';

interface BalanceData {
  week: string;
  outstanding: number;
  borrowed: number;
  lent: number;
}

type ChartType = 'outstanding' | 'borrowed' | 'lent';

interface SplitwiseBalanceChartProps {
  isPrivacyMode?: boolean;
}

export function SplitwiseBalanceChart({ isPrivacyMode = false }: SplitwiseBalanceChartProps) {
  const [data, setData] = useState<BalanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<ChartType>('outstanding');

  useEffect(() => {
    const fetchBalanceData = async () => {
      try {
        // For now, we'll create mock data until we have a real API endpoint
        // This would normally fetch from /api/splitwise/balance-progression
        // Chart data should be in ascending order (left to right timeline)
        const mockData: BalanceData[] = [
          { week: 'Jan 2025', outstanding: 65000, borrowed: 25000, lent: 90000 },
          { week: 'Feb 2025', outstanding: 68000, borrowed: 22000, lent: 90000 },
          { week: 'Mar 2025', outstanding: 71000, borrowed: 28000, lent: 99000 },
          { week: 'Apr 2025', outstanding: 69500, borrowed: 24000, lent: 93500 },
          { week: 'May 2025', outstanding: 72500, borrowed: 30000, lent: 102500 },
          { week: 'Jun 2025', outstanding: 72317, borrowed: 26890, lent: 99207 },
        ];
        
        setData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBalanceData();
  }, []);

  const formatCurrency = (value: number) => {
    if (isPrivacyMode) {
      return '₹••••';
    }
    return formatCurrencyInLakhs(value);
  };

  const getChartConfig = (type: ChartType) => {
    switch (type) {
      case 'outstanding':
        return {
          color: '#16a34a',
          gradientId: 'outstandingGradient',
          label: 'Outstanding',
          description: 'Your total outstanding balance across all groups month over month'
        };
      case 'borrowed':
        return {
          color: '#dc2626',
          gradientId: 'borrowedGradient',
          label: 'Borrowed',
          description: 'Amount you owe to others month over month'
        };
      case 'lent':
        return {
          color: '#16a34a',
          gradientId: 'lentGradient',
          label: 'Lent',
          description: 'Amount others owe you month over month'
        };
    }
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      const config = getChartConfig(activeChart);
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-foreground mb-2">{`Month: ${label}`}</p>
          {payload.map((entry, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-foreground">
                {config.label}: {entry.value ? formatCurrency(entry.value) : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Balance Progression</CardTitle>
          <CardDescription>Loading balance data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Balance Progression</CardTitle>
          <CardDescription>Error loading balance data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Balance Progression</CardTitle>
          <CardDescription>Track your outstanding balance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No balance data available. Start adding expenses to see your balance progression.
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentConfig = getChartConfig(activeChart);

  return (
    <Card className="flex flex-col h-full animate-in fade-in duration-500">
      <CardHeader>
        <CardTitle>Balance Progression</CardTitle>
        <CardDescription>
          Your total {currentConfig.label.toLowerCase()} balance month over month
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        {/* Tabs */}
        <Tabs value={activeChart} onValueChange={(value) => setActiveChart(value as ChartType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
            <TabsTrigger value="borrowed">Borrowed</TabsTrigger>
            <TabsTrigger value="lent">Lent</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Chart and Table Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Chart Section */}
          <Card className="flex flex-col h-full lg:col-span-3">
            <CardHeader>
              <CardTitle>Account Balance Progression</CardTitle>
              <CardDescription>
                Your total account balance month over month
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-[300px] w-full transition-all duration-500 animate-in fade-in">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    key={activeChart}
                    data={data}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <defs>
                      <linearGradient id={currentConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={currentConfig.color} stopOpacity={0.8}>
                          <animate 
                            attributeName="stop-color" 
                            dur="0.8s" 
                            values={`${currentConfig.color};${currentConfig.color}`}
                            begin="0s"
                            repeatCount="1"
                          />
                        </stop>
                        <stop offset="95%" stopColor={currentConfig.color} stopOpacity={0.1}>
                          <animate 
                            attributeName="stop-color" 
                            dur="0.8s" 
                            values={`${currentConfig.color};${currentConfig.color}`}
                            begin="0s"
                            repeatCount="1"
                          />
                        </stop>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="week" 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => {
                        if (isPrivacyMode) {
                          return '₹••••';
                        }
                        if (value >= 100000) {
                          return `₹${(value / 100000).toFixed(1)}L`;
                        } else if (value >= 1000) {
                          return `₹${(value / 1000).toFixed(0)}K`;
                        }
                        return `₹${value}`;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={activeChart}
                      stroke={currentConfig.color}
                      strokeWidth={3}
                      fill={`url(#${currentConfig.gradientId})`}
                      dot={{ fill: currentConfig.color, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: currentConfig.color, strokeWidth: 2, fill: "#ffffff" }}
                      connectNulls={false}
                      animationBegin={0}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      isAnimationActive={true}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Summary Table Section */}
          <Card className="flex flex-col h-full lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>
                Your monthly {currentConfig.label.toLowerCase()} overview across all groups
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-0 py-3 text-left text-sm font-medium text-foreground">Month</th>
                      <th className="px-0 py-3 text-right text-sm font-medium text-foreground">
                        {currentConfig.label}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data].reverse().map((row, index) => (
                      <tr 
                        key={row.week} 
                        className="transition-all duration-300 hover:bg-muted/50 animate-in slide-in-from-left border-b border-border/50 last:border-b-0"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <td className="px-0 py-3 text-sm font-medium text-foreground">
                          {row.week}
                        </td>
                        <td className="px-0 py-3 text-right text-sm font-bold">
                                                  <span className={`${
                          activeChart === 'outstanding' ? 'text-green-600' :
                          activeChart === 'borrowed' ? 'text-red-600' :
                          'text-green-600'
                        } transition-colors duration-300`}>
                            {isPrivacyMode ? '₹••••' : formatCurrency(row[activeChart])}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
} 