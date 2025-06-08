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

interface KeyMetricsProps {
  isPrivacyMode?: boolean;
  filterYear?: number;
}

export function KeyMetrics({ isPrivacyMode = false, filterYear }: KeyMetricsProps) {
  const [data, setData] = useState<KeyMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const url = filterYear ? `/api/key-metrics?year=${filterYear}` : '/api/key-metrics';
        const response = await fetch(url);
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
  }, [filterYear]);

  const formatChange = (change: number) => {
    if (isPrivacyMode) {
      return "••%";
    }
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
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrencyInLakhs(data.currentBalance.value, isPrivacyMode)}
            </div>
            <div className={`flex items-center text-sm ${getChangeColor(data.currentBalance.change)}`}>
              {getChangeIcon(data.currentBalance.change)}
              <span className="ml-1">{formatChange(data.currentBalance.change)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Card Bills */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">CREDIT CARD DUES</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrencyInLakhs(data.creditCardBill.value, isPrivacyMode)}
            </div>
            <div className={`flex items-center text-sm ${getChangeColor(-data.creditCardBill.change)}`}>
              {getChangeIcon(-data.creditCardBill.change)}
              <span className="ml-1">{formatChange(data.creditCardBill.change)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real Balance */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">AVAILABLE CREDIT</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrencyInLakhs(data.realBalance.value, isPrivacyMode)}
            </div>
            <div className={`flex items-center text-sm ${getChangeColor(data.realBalance.change)}`}>
              {getChangeIcon(data.realBalance.change)}
              <span className="ml-1">{formatChange(data.realBalance.change)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reward Points */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">REWARD POINTS</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-purple-600">
              {isPrivacyMode ? "••••" : data.rewardPoints.value.toLocaleString()}
            </div>
            <div className={`flex items-center text-sm ${getChangeColor(data.rewardPoints.change)}`}>
              {getChangeIcon(data.rewardPoints.change)}
              <span className="ml-1">{formatChange(data.rewardPoints.change)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 