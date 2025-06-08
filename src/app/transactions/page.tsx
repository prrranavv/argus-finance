'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/header";
import { Search, Filter, List, Grid3X3 } from "lucide-react";
import { TransactionsList } from "@/components/transactions-list";
import { TransactionMetrics } from "@/components/transaction-metrics";
import { formatCurrencyInLakhs } from "@/lib/utils";
import Image from "next/image";

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

interface TransactionsGridProps {
  transactions: TransactionData[];
  isPrivacyMode?: boolean;
  searchQuery: string;
  searchInput: string;
  accountTypeFilter: string;
  bankFilter: string;
  timeRangeFilter: string;
  onSearchChange: (value: string) => void;
  currentPage: number;
  itemsPerPage: number;
  onLoadMore: () => void;
  hasMore: boolean;
}

function TransactionsGrid({ 
  transactions, 
  isPrivacyMode = false,
  searchQuery,
  searchInput,
  accountTypeFilter,
  bankFilter,
  timeRangeFilter,
  onSearchChange,
  currentPage,
  itemsPerPage,
  onLoadMore,
  hasMore
}: TransactionsGridProps) {
  const getBankLogo = (bankName: string, accountType: string, source: string) => {
    // For credit cards, use specific card images - matching main page
    if (accountType === 'Credit Card') {
      const cardImageMap: Record<string, string> = {
        'HDFC Diners': '/cardImages/dinersCard.png',
        'HDFC Swiggy': '/cardImages/swiggyCard.png',
        'Axis Magnus': '/cardImages/magnusCard.png',
        'Flipkart Axis': '/cardImages/flipkartCard.webp',
      };
      
      // Check if source matches any of our card types
      if (cardImageMap[source]) {
        return cardImageMap[source];
      }
      
      // If no exact match, try to match based on bankName + keywords
      if (source.includes('Swiggy') || bankName === 'HDFC Swiggy') {
        return '/cardImages/swiggyCard.png';
      }
      if (source.includes('Diners') || bankName === 'HDFC Diners') {
        return '/cardImages/dinersCard.png';
      }
      if (source.includes('Magnus') || bankName === 'Axis Magnus') {
        return '/cardImages/magnusCard.png';
      }
      if (source.includes('Flipkart') || bankName === 'Flipkart Axis') {
        return '/cardImages/flipkartCard.webp';
      }
    }
    
    // For bank accounts, use bank logos
    const logoMap: Record<string, string> = {
      'HDFC': '/cardImages/hdfclogo.png',
      'Axis': '/cardImages/axislogo.png',
    };
    return logoMap[bankName];
  };

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
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
      let startDate = new Date();
      
      switch (timeRangeFilter) {
        case "7days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "60days":
          startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (timeRangeFilter !== "all") {
        filtered = filtered.filter(t => new Date(t.date) >= startDate);
      }
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery, accountTypeFilter, bankFilter, timeRangeFilter]);

  // Calculate transactions to show based on pagination
  const totalItemsToShow = currentPage * itemsPerPage;
  const gridTransactions = filteredTransactions.slice(0, totalItemsToShow);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search transactions by merchant, bank, or amount..."
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 relative">
        {gridTransactions.map((transaction) => (
          <Card 
            key={transaction.id} 
            className="p-4 cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.2] hover:z-10 relative group"
          >
            <div className="space-y-3">
              {/* Bank Logo - Centered and Consistent */}
              <div className="flex justify-center mb-3">
                {getBankLogo(transaction.bankName, transaction.accountType, transaction.source) ? (
                  <div className={`${transaction.accountType === 'Credit Card' ? 'w-20 h-12' : 'w-12 h-8'} rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden p-1`}>
                    <Image
                      src={getBankLogo(transaction.bankName, transaction.accountType, transaction.source)}
                      alt={`${transaction.source || transaction.bankName} logo`}
                      width={transaction.accountType === 'Credit Card' ? 64 : 40}
                      height={transaction.accountType === 'Credit Card' ? 40 : 25}
                      className="object-contain filter drop-shadow-sm max-w-full max-h-full"
                      quality={100}
                      priority={false}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm border border-gray-200 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-700">
                      {transaction.bankName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Amount */}
              <div className={`text-lg font-bold text-center ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                {transaction.type === 'expense' ? '-' : '+'}
                {formatCurrencyInLakhs(transaction.amount, isPrivacyMode)}
              </div>
              
              {/* Transaction Description */}
              <div className="text-sm font-medium text-gray-900 text-center truncate px-1">
                {transaction.description}
              </div>
              
              {/* Date */}
              <div className="text-xs text-muted-foreground text-center">
                {new Date(transaction.date).toLocaleDateString()}
              </div>
              
              {/* Closing Balance */}
              {transaction.closingBalance !== null && transaction.closingBalance !== 0 && (
                <div className="text-xs text-muted-foreground text-center">
                  Balance: {formatCurrencyInLakhs(transaction.closingBalance, isPrivacyMode)}
                </div>
              )}
            </div>
          </Card>
        ))}
        

      </div>
      
      {/* Load More Button */}
      {hasMore && gridTransactions.length < filteredTransactions.length && (
        <div className="flex justify-center pt-4">
          <Button 
            onClick={onLoadMore}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <span>Load More ({Math.min(itemsPerPage, filteredTransactions.length - gridTransactions.length)} more)</span>
          </Button>
        </div>
      )}
      
      <p className="text-sm text-muted-foreground text-center">
        Showing {gridTransactions.length} of {filteredTransactions.length} transactions
      </p>
    </div>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);

  // Load privacy preference from localStorage on mount
  useEffect(() => {
    const savedPrivacyMode = localStorage.getItem('privacyMode');
    if (savedPrivacyMode !== null) {
      setIsPrivacyMode(JSON.parse(savedPrivacyMode));
    }
  }, []);

  // Save privacy preference to localStorage when changed
  const handlePrivacyToggle = () => {
    const newPrivacyMode = !isPrivacyMode;
    setIsPrivacyMode(newPrivacyMode);
    localStorage.setItem('privacyMode', JSON.stringify(newPrivacyMode));
  };

  // Search states - separate input value from debounced search query
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Other filter states
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [bankFilter, setBankFilter] = useState("all");
  const [timeRangeFilter, setTimeRangeFilter] = useState("30days");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  
  // Pagination states for infinite scroll
  const [gridPage, setGridPage] = useState(1);
  const [listPage, setListPage] = useState(1);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  
  const ITEMS_PER_PAGE = 10;

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
    setGridPage(1);
    setListPage(1);
    setHasMoreTransactions(true);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setGridPage(1);
    setListPage(1);
    setHasMoreTransactions(true);
  }, [debouncedSearchQuery, accountTypeFilter, bankFilter, timeRangeFilter]);

  // Reset pagination when view mode changes
  useEffect(() => {
    setGridPage(1);
    setListPage(1);
    setHasMoreTransactions(true);
  }, [viewMode]);

  // Infinite scroll handler
  const loadMoreTransactions = useCallback(() => {
    if (viewMode === "grid") {
      setGridPage(prev => prev + 1);
    } else {
      setListPage(prev => prev + 1);
    }
  }, [viewMode]);

  const hasActiveFilters = debouncedSearchQuery || accountTypeFilter !== "all" || bankFilter !== "all" || timeRangeFilter !== "30days";

  // const getTimeRangeLabel = () => {
  //   switch (timeRangeFilter) {
  //     case "7days": return "Last 7 days";
  //     case "30days": return "Last 30 days";
  //     case "60days": return "Last 60 days";
  //     default: return "All time";
  //   }
  // };

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
      <Header 
        isPrivacyMode={isPrivacyMode}
        onPrivacyToggle={handlePrivacyToggle}
      />
      
      <div className="mb-8">
        
        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 items-center mt-6">
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
      </div>

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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">All Transactions</h2>
            <p className="text-muted-foreground mt-1">Complete transaction history with applied filters</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="flex items-center space-x-1"
            >
              <List className="h-4 w-4" />
              <span>List</span>
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="flex items-center space-x-1"
            >
              <Grid3X3 className="h-4 w-4" />
              <span>Grid</span>
            </Button>
          </div>
        </div>
        
        {viewMode === "list" ? (
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
                currentPage={listPage}
                itemsPerPage={ITEMS_PER_PAGE}
                onLoadMore={loadMoreTransactions}
                hasMore={hasMoreTransactions}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <TransactionsGrid 
                transactions={transactions} 
                isPrivacyMode={isPrivacyMode}
                searchQuery={debouncedSearchQuery}
                searchInput={searchInput}
                accountTypeFilter={accountTypeFilter}
                bankFilter={bankFilter}
                timeRangeFilter={timeRangeFilter}
                onSearchChange={setSearchInput}
                currentPage={gridPage}
                itemsPerPage={ITEMS_PER_PAGE}
                onLoadMore={loadMoreTransactions}
                hasMore={hasMoreTransactions}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 