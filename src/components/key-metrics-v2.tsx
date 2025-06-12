'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyInLakhs } from '@/lib/utils';
import { Wallet, CreditCard, Gift, ArrowDownAZ } from 'lucide-react';

interface MetricData {
  value: number;
  month?: string | null;
}

interface KeyMetricsData {
  currentBankBalance: MetricData;
  currentMonthExpenses: MetricData;
  creditCardDues: MetricData;
  rewardPoints: MetricData;
}

interface KeyMetricsV2Props {
  isPrivacyMode?: boolean;
}

export function KeyMetricsV2({ isPrivacyMode = false }: KeyMetricsV2Props) {
  const [data, setData] = useState<KeyMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const url = '/api/key-metrics-v2';
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
  }, []);

  // Helper to format month with year
  const formatMonthYear = (monthStr: string | null | undefined) => {
    if (!monthStr) return '';
    
    // Check if the month already has a year
    if (monthStr.includes(' ')) {
      return monthStr;
    } else {
      // If no year is present, add the current year or filtered year
      const year = new Date().getFullYear();
      return `${monthStr} ${year}`;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 md:p-6">
              <div className="animate-pulse">
                <div className="h-3 md:h-4 bg-muted rounded mb-2"></div>
                <div className="h-6 md:h-8 bg-muted rounded mb-2"></div>
                <div className="h-3 md:h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="text-xs md:text-sm text-muted-foreground">Error loading metrics: {error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 mb-8">
      {/* Current Bank Balance */}
      <Card>
        <CardContent className="p-3 md:p-6">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <div className="text-xs md:text-sm font-medium text-muted-foreground">CURRENT BANK BALANCE</div>
            </div>
          </div>
          <div className="text-lg md:text-2xl font-bold text-green-600">
            {formatCurrencyInLakhs(data.currentBankBalance.value, isPrivacyMode)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Balance from {formatMonthYear(data.currentBankBalance.month)} statement + recent transactions
          </div>
        </CardContent>
      </Card>

      {/* Current Month Expenses */}
      <Card>
        <CardContent className="p-3 md:p-6">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <div className="flex items-center gap-2">
              <ArrowDownAZ className="h-4 w-4 text-muted-foreground" />
              <div className="text-xs md:text-sm font-medium text-muted-foreground">CURRENT MONTH EXPENSES</div>
            </div>
          </div>
          <div className="text-lg md:text-2xl font-bold text-amber-600">
            {formatCurrencyInLakhs(data.currentMonthExpenses.value, isPrivacyMode)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Expenses after {formatMonthYear(data.currentMonthExpenses.month)} statement
          </div>
        </CardContent>
      </Card>

      {/* Credit Card Dues */}
      <Card>
        <CardContent className="p-3 md:p-6">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div className="text-xs md:text-sm font-medium text-muted-foreground">CREDIT CARD DUES</div>
            </div>
          </div>
          <div className="text-lg md:text-2xl font-bold text-red-600">
            {formatCurrencyInLakhs(data.creditCardDues.value, isPrivacyMode)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Total dues from {formatMonthYear(data.creditCardDues.month)} statement + new charges
          </div>
        </CardContent>
      </Card>

      {/* Reward Points */}
      <Card>
        <CardContent className="p-3 md:p-6">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-muted-foreground" />
              <div className="text-xs md:text-sm font-medium text-muted-foreground">REWARD POINTS</div>
            </div>
          </div>
          <div className="text-lg md:text-2xl font-bold text-purple-600">
            {isPrivacyMode ? "••••" : data.rewardPoints.value.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Total points as of {formatMonthYear(data.rewardPoints.month)} statement
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 