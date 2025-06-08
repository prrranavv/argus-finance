"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { formatCurrencyInLakhs } from "@/lib/utils";
import VirtualizedTransactionItem from './virtualized-transaction-item';
import { TransactionSkeleton } from './transaction-skeleton';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface Transaction {
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

interface TransactionMetrics {
  totalExpenses: {
    current: number;
    previous: number;
    change: number;
    previousAmount: number;
  };
  avgDailySpending: {
    current: number;
    previous: number;
    change: number;
    previousAmount: number;
  };
  avgTransaction: {
    current: number;
    previous: number;
    change: number;
    previousAmount: number;
  };
  totalTransactions: {
    current: number;
    previous: number;
    change: number;
    previousAmount: number;
  };
  comparisonPeriod: string;
}

interface TransactionsListProps {
  transactions: Transaction[];
  isPrivacyMode?: boolean;
  searchQuery: string;
  searchInput: string;
  accountTypeFilter: string;
  bankFilter: string;
  timeRangeFilter: string;
  onSearchChange: (value: string) => void;
  currentPage?: number;
  itemsPerPage?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function TransactionsList({ 
  transactions, 
  isPrivacyMode = false,
  searchQuery,
  searchInput,
  accountTypeFilter,
  bankFilter,
  timeRangeFilter,
  onSearchChange,
  currentPage = 1,
  itemsPerPage = 25,
  onLoadMore,
  hasMore = true
}: TransactionsListProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions);
  const [timeFilteredMetrics, setTimeFilteredMetrics] = useState<TransactionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate metrics for the current time filter
  const calculateTimeFilteredMetrics = useMemo(() => {
    if (timeRangeFilter === "all") {
      return null;
    }

    let currentPeriodTransactions: Transaction[] = [];
    let previousPeriodTransactions: Transaction[] = [];
    
    const now = new Date();
    let currentStart = new Date();
    let currentEnd = new Date();
    let previousStart = new Date();
    let previousEnd = new Date();

    // Handle predefined periods
    let days = 0;
    switch (timeRangeFilter) {
      case "7days": days = 7; break;
      case "30days": days = 30; break;
      case "60days": days = 60; break;
    }
    
    currentEnd = now;
    currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    previousEnd = new Date(currentStart.getTime() - 1);
    previousStart = new Date(previousEnd.getTime() - days * 24 * 60 * 60 * 1000);

    // Filter transactions for current and previous periods
    currentPeriodTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= currentStart && date <= currentEnd;
    });

    previousPeriodTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= previousStart && date <= previousEnd;
    });

    // Calculate metrics
    const currentExpenses = currentPeriodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const previousExpenses = previousPeriodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentDays = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (24 * 60 * 60 * 1000));
    const avgDailyCurrent = currentExpenses / Math.max(currentDays, 1);
    const avgDailyPrevious = previousExpenses / Math.max(currentDays, 1);

    const currentTransactionCount = currentPeriodTransactions.filter(t => t.type === 'expense').length;
    const previousTransactionCount = previousPeriodTransactions.filter(t => t.type === 'expense').length;
    
    const avgTransactionCurrent = currentTransactionCount > 0 ? currentExpenses / currentTransactionCount : 0;
    const avgTransactionPrevious = previousTransactionCount > 0 ? previousExpenses / previousTransactionCount : 0;

    return {
      totalExpenses: {
        current: currentExpenses,
        previous: previousExpenses,
        change: previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0,
        previousAmount: previousExpenses
      },
      avgDailySpending: {
        current: avgDailyCurrent,
        previous: avgDailyPrevious,
        change: avgDailyPrevious > 0 ? ((avgDailyCurrent - avgDailyPrevious) / avgDailyPrevious) * 100 : 0,
        previousAmount: avgDailyPrevious
      },
      avgTransaction: {
        current: avgTransactionCurrent,
        previous: avgTransactionPrevious,
        change: avgTransactionPrevious > 0 ? ((avgTransactionCurrent - avgTransactionPrevious) / avgTransactionPrevious) * 100 : 0,
        previousAmount: avgTransactionPrevious
      },
      totalTransactions: {
        current: currentTransactionCount,
        previous: previousTransactionCount,
        change: previousTransactionCount > 0 ? ((currentTransactionCount - previousTransactionCount) / previousTransactionCount) * 100 : 0,
        previousAmount: previousTransactionCount
      },
      comparisonPeriod: "previous period"
    };
  }, [transactions, timeRangeFilter]);

  useEffect(() => {
    setTimeFilteredMetrics(calculateTimeFilteredMetrics);
  }, [calculateTimeFilteredMetrics]);

  // Filter and search logic with debouncing simulation
  const filteredAndSearchedTransactions = useMemo(() => {
    setIsLoading(true);
    
    let filtered = [...transactions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.bankName.toLowerCase().includes(query) ||
        t.source.toLowerCase().includes(query) ||
        t.amount.toString().includes(query) ||
        formatCurrencyInLakhs(t.amount, false).toLowerCase().includes(query)
      );
    }

    // Account type filter
    if (accountTypeFilter !== "all") {
      filtered = filtered.filter(t => t.accountType === accountTypeFilter);
    }

    // Bank/Source filter
    if (bankFilter !== "all") {
      filtered = filtered.filter(t => t.bankName === bankFilter || t.source === bankFilter);
    }

    // Time range filter
    if (timeRangeFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (timeRangeFilter) {
        case "7days":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "30days":
          filterDate.setDate(now.getDate() - 30);
          break;
        case "60days":
          filterDate.setDate(now.getDate() - 60);
          break;
      }
      
      filtered = filtered.filter(t => new Date(t.date) >= filterDate);
    }

    const sortedFiltered = filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Simulate loading delay for large datasets
    setTimeout(() => setIsLoading(false), 100);
    
    return sortedFiltered;
  }, [transactions, searchQuery, accountTypeFilter, bankFilter, timeRangeFilter]);

  useEffect(() => {
    setFilteredTransactions(filteredAndSearchedTransactions);
  }, [filteredAndSearchedTransactions]);

  // Apply pagination to filtered transactions
  const paginatedTransactions = useMemo(() => {
    const totalItemsToShow = currentPage * itemsPerPage;
    return filteredTransactions.slice(0, totalItemsToShow);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const formatPercentageChange = (change: number, previousAmount: number) => {
    if (change === 0) return "No change";
    const direction = change > 0 ? "higher" : "lower";
    const absChange = Math.abs(change);
    return `${absChange.toFixed(1)}% ${direction} from ${formatCurrencyInLakhs(previousAmount, isPrivacyMode)}`;
  };

  const handleCategoryEdit = useCallback((transactionId: string, currentCategory: string | null) => {
    setEditingCategory(transactionId);
    setNewCategory(currentCategory || "");
  }, []);

  const handleCategorySave = useCallback(async (transactionId: string) => {
    // Here you would typically call an API to update the category
    // For now, we'll just update the local state
    console.log('Saving category:', transactionId, newCategory);
    setEditingCategory(null);
    setNewCategory("");
  }, [newCategory]);

  const handleCategoryCancel = useCallback(() => {
    setEditingCategory(null);
    setNewCategory("");
  }, []);

  const handleNewCategoryChange = useCallback((value: string) => {
    setNewCategory(value);
  }, []);

  const getTimeRangeLabel = () => {
    switch (timeRangeFilter) {
      case "7days": return "Last 7 days";
      case "30days": return "Last 30 days";
      case "60days": return "Last 60 days";
      default: return "All time";
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="mb-3 text-lg">🎉 All cleaned up!</div>
        <div className="text-sm max-w-md mx-auto">
          Upload a financial statement to start building your transaction history with AI-powered categorization and duplicate prevention.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search transactions by merchant, bank, or amount..."
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>



      {/* Regular List View - No Virtualization Container */}
      <div className="space-y-3">
        {isLoading ? (
          <TransactionSkeleton count={5} />
        ) : paginatedTransactions.length > 0 ? (
                     <div className="space-y-4">
             {paginatedTransactions.map((transaction) => (
               <VirtualizedTransactionItem
                 key={transaction.id}
                 transaction={transaction}
                 isPrivacyMode={isPrivacyMode}
                 editingCategory={editingCategory}
                 newCategory={newCategory}
                 onCategoryEdit={handleCategoryEdit}
                 onCategorySave={handleCategorySave}
                 onCategoryCancel={handleCategoryCancel}
                 onNewCategoryChange={handleNewCategoryChange}
                 style={{ padding: 0 }} // Remove extra padding since we're not using virtualization
               />
             ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="mb-2 text-lg">No transactions found</div>
            <div className="text-sm">Try adjusting your search or filter criteria.</div>
          </div>
        ) : null}

        {/* Load More Button */}
        {onLoadMore && hasMore && paginatedTransactions.length < filteredTransactions.length && (
          <div className="flex justify-center pt-6">
            <Button 
              onClick={onLoadMore}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <span>Load More ({Math.min(itemsPerPage, filteredTransactions.length - paginatedTransactions.length)} more)</span>
            </Button>
          </div>
        )}

        {/* Transaction Count Display */}
        {paginatedTransactions.length > 0 && (
          <p className="text-sm text-muted-foreground text-center pt-4">
            Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
          </p>
        )}
      </div>
    </div>
  );
} 