'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3 } from "lucide-react";
import { formatCurrencyInLakhs, formatPercentage, maskNumber } from "@/lib/utils";

interface TransactionMetrics {
  period: {
    start: string;
    end: string;
    days: number;
  };
  metrics: {
    totalExpenses: {
      current: number;
      previous: number;
      change: number;
    };
    dailyAvgSpending: {
      current: number;
      previous: number;
      change: number;
    };
    avgTransaction: {
      current: number;
      previous: number;
      change: number;
    };
    totalTransactions: {
      current: number;
      previous: number;
      change: number;
    };
  };
  topExpenses: Array<{
    merchant: string;
    amount: number;
    date: string;
  }>;
  last3MonthsSalary: Array<{
    month: string;
    amount: number;
    date: string;
  }>;
  breakdown: {
    topCategories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  insights: {
    recurringPayments: Array<{
      pattern: string;
      count: number;
      totalAmount: number;
      avgAmount: number;
      lastDate: string;
      category: string | null;
      type: string;
    }>;
  };
}

interface TransactionMetricsProps {
  isPrivacyMode?: boolean;
  searchQuery?: string;
  accountTypeFilter?: string;
  bankFilter?: string;
  timeRangeFilter?: string;
}

export function TransactionMetrics({ 
  isPrivacyMode = false,
  searchQuery,
  accountTypeFilter,
  bankFilter,
  timeRangeFilter
}: TransactionMetricsProps) {
  const [metrics, setMetrics] = useState<TransactionMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const params = new URLSearchParams();
        
        if (searchQuery) {
          params.append('search', searchQuery);
        }
        if (accountTypeFilter && accountTypeFilter !== 'all') {
          params.append('accountType', accountTypeFilter);
        }
        if (bankFilter && bankFilter !== 'all') {
          params.append('bank', bankFilter);
        }
        if (timeRangeFilter && timeRangeFilter !== 'all') {
          params.append('timeRange', timeRangeFilter);
        }

        const url = `/api/transaction-metrics${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching transaction metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [searchQuery, accountTypeFilter, bankFilter, timeRangeFilter]);

  const formatPercentageChangeWithAmount = (change: number) => {
    const isPositive = change >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    const sign = isPositive ? '+' : '-';
    
    // Get the time period text
    const getPeriodText = () => {
      switch (timeRangeFilter) {
        case "7days": return "last 7 days";
        case "30days": return "last 30 days";
        case "60days": return "last 60 days";
        default: return "previous period";
      }
    };
    
    return (
      <div className={`flex items-center space-x-1 ${colorClass}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">
          {sign}{formatPercentage(Math.abs(change), isPrivacyMode)} from {getPeriodText()}
        </span>
      </div>
    );
  };

  const formatCountChangeWithAmount = (change: number) => {
    const isPositive = change >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    const sign = isPositive ? '+' : '-';
    
    // Get the time period text
    const getPeriodText = () => {
      switch (timeRangeFilter) {
        case "7days": return "last 7 days";
        case "30days": return "last 30 days";
        case "60days": return "last 60 days";
        default: return "previous period";
      }
    };
    
    return (
      <div className={`flex items-center space-x-1 ${colorClass}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">
          {sign}{formatPercentage(Math.abs(change), isPrivacyMode)} from {getPeriodText()}
        </span>
      </div>
    );
  };



  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                        <div className="h-4 bg-muted rounded mb-2"></div>
        <div className="h-8 bg-muted rounded mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load transaction metrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* First Row - 4 Equal Sized Metric Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrencyInLakhs(metrics.metrics.totalExpenses.current, isPrivacyMode)}
            </div>
            <div className="mt-2">
              {formatPercentageChangeWithAmount(metrics.metrics.totalExpenses.change)}
            </div>
          </CardContent>
        </Card>

        {/* Daily Average Spending */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Spending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyInLakhs(metrics.metrics.dailyAvgSpending.current, isPrivacyMode)}
            </div>
            <div className="mt-2">
              {formatPercentageChangeWithAmount(metrics.metrics.dailyAvgSpending.change)}
            </div>
          </CardContent>
        </Card>

        {/* Average Transaction */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyInLakhs(metrics.metrics.avgTransaction.current, isPrivacyMode)}
            </div>
            <div className="mt-2">
              {formatPercentageChangeWithAmount(metrics.metrics.avgTransaction.change)}
            </div>
          </CardContent>
        </Card>

        {/* Number of Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maskNumber(metrics.metrics.totalTransactions.current, isPrivacyMode)}
            </div>
            <div className="mt-2">
              {formatCountChangeWithAmount(metrics.metrics.totalTransactions.change)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - 2 Detailed Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Salary - Last 3 months */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Salary - Last 3 months</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.last3MonthsSalary.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {metrics.last3MonthsSalary.map((salary, index) => (
                  <Card key={index} className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600 mb-1">
                        {formatCurrencyInLakhs(salary.amount, isPrivacyMode)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {salary.month}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No salary data found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 3 Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 3 Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topExpenses.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {metrics.topExpenses.slice(0, 3).map((expense, index) => (
                  <Card key={index} className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600 mb-1">
                        {formatCurrencyInLakhs(expense.amount, isPrivacyMode)}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {expense.merchant.length > 15 ? expense.merchant.substring(0, 15) + '...' : expense.merchant}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No expense data found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


    </div>
  );
} 