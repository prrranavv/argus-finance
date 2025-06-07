'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyInLakhs } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricData {
  value: number;
  change: number;
  month?: string;
  paymentMonth?: string; // For credit card dues
}

interface KeyMetricsData {
  currentBalance: MetricData;
  creditCardBill: MetricData;
  realBalance: MetricData;
  rewardPoints: MetricData;
}

export function KeyMetrics() {
  const [data, setData] = useState<KeyMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/key-metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const metricsData = await response.json();
        setData(metricsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const formatChange = (change: number) => {
    const absChange = Math.abs(change);
    const sign = change > 0 ? '+' : change < 0 ? '-' : '';
    return `${sign}${absChange.toFixed(1)}%`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Error loading metrics</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* Current Bank Balance */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">CURRENT BANK BALANCE</div>
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {formatCurrencyInLakhs(data.currentBalance.value)}
          </div>
          <div className={`flex items-center text-sm ${getChangeColor(data.currentBalance.change)}`}>
            {getChangeIcon(data.currentBalance.change)}
            <span className="ml-1">{formatChange(data.currentBalance.change)} from last month</span>
          </div>
          {data.currentBalance.month && (
            <div className="text-xs text-muted-foreground mt-1">
              Latest: {data.currentBalance.month}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Card Bills */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">CREDIT CARD DUES</div>
          </div>
          <div className="text-2xl font-bold text-red-600 mb-1">
            {formatCurrencyInLakhs(data.creditCardBill.value)}
          </div>
          <div className={`flex items-center text-sm ${getChangeColor(-data.creditCardBill.change)}`}>
            {getChangeIcon(-data.creditCardBill.change)}
            <span className="ml-1">{formatChange(data.creditCardBill.change)} from last month</span>
          </div>
          {data.creditCardBill.month && data.creditCardBill.paymentMonth && (
            <div className="text-xs text-muted-foreground mt-1">
              {data.creditCardBill.month} expenses due in {data.creditCardBill.paymentMonth}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real Balance */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">AVAILABLE CREDIT</div>
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {formatCurrencyInLakhs(data.realBalance.value)}
          </div>
          <div className={`flex items-center text-sm ${getChangeColor(data.realBalance.change)}`}>
            {getChangeIcon(data.realBalance.change)}
            <span className="ml-1">{formatChange(data.realBalance.change)} from last month</span>
          </div>
          {data.realBalance.month && (
            <div className="text-xs text-muted-foreground mt-1">
              Bank balance minus pending dues as of {data.realBalance.month}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reward Points */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">REWARD POINTS</div>
          </div>
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {data.rewardPoints.value.toLocaleString()}
          </div>
          <div className={`flex items-center text-sm ${getChangeColor(data.rewardPoints.change)}`}>
            {getChangeIcon(data.rewardPoints.change)}
            <span className="ml-1">{formatChange(data.rewardPoints.change)} from last month</span>
          </div>
          {data.rewardPoints.month && (
            <div className="text-xs text-muted-foreground mt-1">
              HDFC Diners points as of {data.rewardPoints.month}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 