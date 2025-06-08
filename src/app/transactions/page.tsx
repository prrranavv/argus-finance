'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Search, Filter } from "lucide-react";
import { TransactionsList } from "@/components/transactions-list";
import { TransactionMetrics } from "@/components/transaction-metrics";

interface TransactionData {
  id: string;
  date: Date;
  description: string;
  amount: number;
  closingBalance: number | null;
  category: string | null;
  type: string;
  source: string;
  accountType: string;
  bankName: string;
  statementId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);

  // Search states - separate input value from debounced search query
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Other filter states
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [bankFilter, setBankFilter] = useState("all");
  const [timeRangeFilter, setTimeRangeFilter] = useState("30days");

  // Debounce search input with 1 second delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchInput);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch transactions
        const transactionsResponse = await fetch('/api/transactions');
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.map((t: TransactionData) => ({
          ...t,
          date: new Date(t.date),
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt)
        })));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique banks and sources for filter options
  const bankOptions = useMemo(() => {
    const banks = new Set<string>();
    transactions.forEach(t => {
      banks.add(t.bankName);
      if (t.source && t.source !== t.bankName) {
        banks.add(t.source);
      }
    });
    return Array.from(banks).sort();
  }, [transactions]);

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearchQuery("");
    setAccountTypeFilter("all");
    setBankFilter("all");
    setTimeRangeFilter("30days");
  };

  const hasActiveFilters = debouncedSearchQuery || accountTypeFilter !== "all" || bankFilter !== "all" || timeRangeFilter !== "30days";

  const getTimeRangeLabel = () => {
    switch (timeRangeFilter) {
      case "7days": return "Last 7 days";
      case "30days": return "Last 30 days";
      case "60days": return "Last 60 days";
      default: return "All time";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-10 max-w-7xl">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-10 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
            className="flex items-center space-x-2"
          >
            {isPrivacyMode ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Show Numbers</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Hide Numbers</span>
              </>
            )}
          </Button>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Transaction Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Detailed insights from your financial data • {getTimeRangeLabel()}
        </p>
      </div>

      {/* Global Filters Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
          <CardDescription>Apply filters to all sections below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Row */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            {/* Account Type Filter */}
            <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Account Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Bank Account">Bank Account</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
              </SelectContent>
            </Select>

            {/* Bank/Card Filter */}
            <Select value={bankFilter} onValueChange={setBankFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Bank/Card" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Banks/Cards</SelectItem>
                {bankOptions.map(bank => (
                  <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Time Range Filter */}
            <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="60days">Last 60 days</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Metrics Section */}
      <TransactionMetrics 
        isPrivacyMode={isPrivacyMode}
        searchQuery={debouncedSearchQuery}
        accountTypeFilter={accountTypeFilter}
        bankFilter={bankFilter}
        timeRangeFilter={timeRangeFilter}
      />

      {/* Transactions List Section */}
      <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">All Transactions</h2>
          <p className="text-muted-foreground mt-1">Complete transaction history with applied filters</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <TransactionsList 
              transactions={transactions} 
              isPrivacyMode={isPrivacyMode}
              searchQuery={debouncedSearchQuery}
              searchInput={searchInput}
              accountTypeFilter={accountTypeFilter}
              bankFilter={bankFilter}
              timeRangeFilter={timeRangeFilter}
              onSearchChange={setSearchInput}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 