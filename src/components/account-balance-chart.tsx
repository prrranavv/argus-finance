'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BalanceData {
  week: string;
  Total?: number | null;
  HDFC?: number | null;
  Axis?: number | null;
  [key: string]: string | number | null | undefined;
}

interface AccountBalanceChartProps {
  selectedBank: string;
  isPrivacyMode?: boolean;
}

export function AccountBalanceChart({ selectedBank, isPrivacyMode = false }: AccountBalanceChartProps) {
  const [data, setData] = useState<BalanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalanceData = async () => {
      try {
        const response = await fetch('/api/balance-progression');
        if (!response.ok) {
          throw new Error('Failed to fetch balance data');
        }
        const balanceData = await response.json();
        setData(balanceData);
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
      return '₹ ••••';
    }
    
    const absValue = Math.abs(value);
    if (absValue >= 100000) {
      const lakhs = absValue / 100000;
      const sign = value < 0 ? '-' : '';
      return `${sign}₹ ${lakhs.toFixed(2)} lakhs`;
    } else if (absValue >= 1000) {
      const thousands = absValue / 1000;
      const sign = value < 0 ? '-' : '';
      return `${sign}₹ ${thousands.toFixed(1)}K`;
    } else {
      return `₹ ${value.toFixed(0)}`;
    }
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
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
                {entry.dataKey}: {entry.value ? formatCurrency(entry.value) : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Define colors and gradients for each bank
  const getBankConfig = (bank: string) => {
    switch (bank) {
      case 'Total': 
        return {
          color: '#2563eb',
          gradientId: 'totalGradient'
        };
      case 'HDFC': 
        return {
          color: '#dc2626',
          gradientId: 'hdfcGradient'
        };
      case 'Axis': 
        return {
          color: '#16a34a',
          gradientId: 'axisGradient'
        };
      default: 
        return {
          color: '#2563eb',
          gradientId: 'defaultGradient'
        };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Balance Progression</CardTitle>
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
          <CardTitle>Account Balance Progression</CardTitle>
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
          <CardTitle>Account Balance Progression</CardTitle>
          <CardDescription>Track your account balance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No balance data available. Upload some bank statements to see your balance progression.
          </div>
        </CardContent>
      </Card>
    );
  }

  const bankConfig = getBankConfig(selectedBank);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Balance Progression</CardTitle>
        <CardDescription>
          {selectedBank === 'Total' 
            ? 'Your total account balance month over month' 
            : `Your ${selectedBank} account balance month over month`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id={bankConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={bankConfig.color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={bankConfig.color} stopOpacity={0.1}/>
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
                    return '₹ ••••';
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
                dataKey={selectedBank}
                stroke={bankConfig.color}
                strokeWidth={3}
                fill={`url(#${bankConfig.gradientId})`}
                dot={{ fill: bankConfig.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: bankConfig.color, strokeWidth: 2, fill: "#ffffff" }}
                connectNulls={false}
              />
              <Tooltip content={<CustomTooltip />} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 