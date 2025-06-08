'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Repeat, Calendar, DollarSign, BarChart3, Building2, ShoppingBag } from "lucide-react";
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

  const formatPercentageChangeWithAmount = (change: number, previousAmount: number) => {
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

  const formatCountChangeWithAmount = (change: number, previousCount: number) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {[...Array(6)].map((_, i) => (
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
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Last {metrics.period.days} days</p>
              {formatPercentageChangeWithAmount(metrics.metrics.totalExpenses.change, metrics.metrics.totalExpenses.previous)}
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
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Per day average</p>
              {formatPercentageChangeWithAmount(metrics.metrics.dailyAvgSpending.change, metrics.metrics.dailyAvgSpending.previous)}
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
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Average amount</p>
              {formatPercentageChangeWithAmount(metrics.metrics.avgTransaction.change, metrics.metrics.avgTransaction.previous)}
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
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Last {metrics.period.days} days</p>
              {formatCountChangeWithAmount(metrics.metrics.totalTransactions.change, metrics.metrics.totalTransactions.previous)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - 2 Detailed Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Quizizz Salary Card - Only Last 3 Months */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizizz Salary</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metrics.last3MonthsSalary.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-2">Last 3 months</p>
                {metrics.last3MonthsSalary.map((salary, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">{salary.month}</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrencyInLakhs(salary.amount, isPrivacyMode)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No Quizizz salary data found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 3 Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top 3 Expenses</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.topExpenses.slice(0, 3).map((expense, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{expense.merchant}</p>
                    <p className="text-sm font-medium text-muted-foreground">{formatDate(expense.date)}</p>
                  </div>
                  <div className="text-sm font-bold text-red-600 ml-2">
                    {formatCurrencyInLakhs(expense.amount, isPrivacyMode)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown and Recurring Payments */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Spending Categories</CardTitle>
            <CardDescription>Last 30 days breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.breakdown.topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {category.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatPercentage(category.percentage, isPrivacyMode)}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrencyInLakhs(category.amount, isPrivacyMode)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Repeat className="h-4 w-4" />
              <span>Recurring Patterns</span>
            </CardTitle>
            <CardDescription>Detected recurring transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.insights.recurringPayments.length > 0 ? (
                metrics.insights.recurringPayments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{payment.pattern}</p>
                      <p className="text-xs text-muted-foreground">
                        {maskNumber(payment.count, isPrivacyMode)} transactions • Avg: {formatCurrencyInLakhs(payment.avgAmount, isPrivacyMode)}
                      </p>
                    </div>
                    <Badge variant={payment.type === 'expense' ? 'destructive' : 'default'} className="text-xs">
                      {maskNumber(payment.count, isPrivacyMode)}x
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recurring patterns detected</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 