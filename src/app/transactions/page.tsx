'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/header";
import { Search, Filter, Calendar, Mail, FileText, Wallet, Edit2, Trash2, UserPlus } from "lucide-react";
import { TransactionMetrics } from "@/components/transaction-metrics";
import { AddTransactionModal } from "@/components/add-transaction-modal";
import { DeleteTransactionModal } from "@/components/delete-transaction-modal";
import { formatCurrencyInLakhs } from "@/lib/utils";
import Image from "next/image";

interface TransactionData {
  id: string;
  date: Date;
  description: string;
  amount: number;
  closing_balance: number | null;
  category: string | null;
  type: string;
  source: string;
  account_type: string;
  bank_name: string;
  statement_id: string | null;
  created_at: Date;
  updated_at: Date;
  gmail_message_id?: string;
  reference_number?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<"all" | "statement" | "email">("all");

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
  const [bankOptions, setBankOptions] = useState<string[]>([]);
  const [timeRangeFilter, setTimeRangeFilter] = useState("30days");
  
  // Pagination states for infinite scroll
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  
  // Modal states for delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null);

  // Inline editing states
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    description: string;
    amount: string;
  }>({ description: "", amount: "" });
  
  const ITEMS_PER_PAGE = 10;

  // Debounce search input with 1 second delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchInput);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch all possible bank names for the filter dropdown on initial load
  useEffect(() => {
    const fetchBankOptions = async () => {
      try {
        const response = await fetch('/api/bank-names');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setBankOptions(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch bank options:", error);
      }
    };
    fetchBankOptions();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Build query parameters for filters
        const params = new URLSearchParams();
        
        if (sourceFilter !== "all") {
          params.append('source', sourceFilter);
        }
        
        if (accountTypeFilter !== "all") {
          params.append('account_type', accountTypeFilter);
        }
        
        if (bankFilter !== "all") {
          params.append('bank_name', bankFilter);
        }
        
        if (timeRangeFilter !== "all") {
          params.append('time_range', timeRangeFilter);
        }
        
        // Fetch from unified all-transactions endpoint
        const response = await fetch(`/api/all-transactions?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const transactionsData = await response.json();
        
        if (Array.isArray(transactionsData)) {
          setTransactions(transactionsData.map((t: TransactionData) => ({
            ...t,
            date: new Date(t.date),
            created_at: new Date(t.created_at),
            updated_at: new Date(t.updated_at)
          })));
        } else {
          console.error('API did not return an array:', transactionsData);
          setTransactions([]);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sourceFilter, accountTypeFilter, bankFilter, timeRangeFilter]);

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearchQuery("");
    setSourceFilter("all");
    setAccountTypeFilter("all");
    setBankFilter("all");
    setTimeRangeFilter("30days");
    setCurrentPage(1);
    setHasMoreTransactions(true);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setHasMoreTransactions(true);
  }, [debouncedSearchQuery, sourceFilter, accountTypeFilter, bankFilter, timeRangeFilter]);

  // Infinite scroll handler
  const loadMoreTransactions = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const hasActiveFilters = debouncedSearchQuery || sourceFilter !== "all" || accountTypeFilter !== "all" || bankFilter !== "all" || timeRangeFilter !== "30days";

  // Function to refresh transactions when a new one is added
  const refreshTransactions = useCallback(async () => {
    try {
      // Build query parameters for filters
      const params = new URLSearchParams();
      
      if (sourceFilter !== "all") {
        params.append('source', sourceFilter);
      }
      
      if (accountTypeFilter !== "all") {
        params.append('account_type', accountTypeFilter);
      }
      
      if (bankFilter !== "all") {
        params.append('bank_name', bankFilter);
      }
      
      if (timeRangeFilter !== "all") {
        params.append('time_range', timeRangeFilter);
      }
      
      // Fetch from unified all-transactions endpoint
      const response = await fetch(`/api/all-transactions?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const transactionsData = await response.json();
      
      if (Array.isArray(transactionsData)) {
        setTransactions(transactionsData.map((t: TransactionData) => ({
          ...t,
          date: new Date(t.date),
          created_at: new Date(t.created_at),
          updated_at: new Date(t.updated_at)
        })));
      } else {
        console.error('API did not return an array:', transactionsData);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    }
  }, [sourceFilter, accountTypeFilter, bankFilter, timeRangeFilter]);

  // Inline editing handlers
  const handleStartEdit = useCallback((transaction: TransactionData) => {
    setEditingTransaction(transaction.id);
    setEditValues({
      description: transaction.description,
      amount: transaction.amount.toString()
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingTransaction(null);
    setEditValues({ description: "", amount: "" });
  }, []);

  const handleSaveEdit = useCallback(async (transactionId: string) => {
    if (!editValues.description.trim() || !editValues.amount || parseFloat(editValues.amount) <= 0) {
      return;
    }

    try {
      const response = await fetch(`/api/all-transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: editValues.description.trim(),
          amount: parseFloat(editValues.amount)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }

      await refreshTransactions();
      setEditingTransaction(null);
      setEditValues({ description: "", amount: "" });
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  }, [editValues, refreshTransactions]);

  // Delete handler
  const handleDeleteTransaction = useCallback((transaction: TransactionData) => {
    setSelectedTransaction(transaction);
    setDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setSelectedTransaction(null);
  }, []);

  // Utility functions
  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();

    let suffix = "th";
    if (day === 1 || day === 21 || day === 31) suffix = "st";
    else if (day === 2 || day === 22) suffix = "nd";
    else if (day === 3 || day === 23) suffix = "rd";

    return `${month} ${day}${suffix}, ${year}`;
  };

  const getBankLogo = (bankName: string, accountType: string, source: string) => {
    // For credit cards, use specific card images
    if (accountType === 'Credit Card' || accountType === 'credit_card') {
      const cardImageMap: Record<string, string> = {
        'HDFC Diners': '/cardImages/dinersCard.png',
        'HDFC Swiggy': '/cardImages/swiggyCard.png',
        'Axis Magnus': '/cardImages/magnusCard.png',
        'Flipkart Axis': '/cardImages/flipkartCard.webp',
      };
      
      if (cardImageMap[source]) {
        return cardImageMap[source];
      }
      
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
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.bank_name.toLowerCase().includes(query) ||
        t.source.toLowerCase().includes(query) ||
        t.amount.toString().includes(query) ||
        formatCurrencyInLakhs(t.amount, false).toLowerCase().includes(query)
      );
    }

    // Account type filter
    if (accountTypeFilter !== "all") {
      filtered = filtered.filter(t => t.account_type === accountTypeFilter);
    }

    // Bank/Source filter
    if (bankFilter !== "all") {
      filtered = filtered.filter(t => t.bank_name === bankFilter || t.source === bankFilter);
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
  }, [transactions, debouncedSearchQuery, accountTypeFilter, bankFilter, timeRangeFilter]);

  // Group transactions by date periods
  const groupTransactionsByDate = (transactions: TransactionData[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last15Days = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [] as TransactionData[],
      yesterday: [] as TransactionData[],
      last7Days: [] as TransactionData[],
      last15Days: [] as TransactionData[],
      last30Days: [] as TransactionData[],
      older: [] as TransactionData[]
    };

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());

      if (transactionDay.getTime() === today.getTime()) {
        groups.today.push(transaction);
      } else if (transactionDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(transaction);
      } else if (transactionDay >= last7Days) {
        groups.last7Days.push(transaction);
      } else if (transactionDay >= last15Days) {
        groups.last15Days.push(transaction);
      } else if (transactionDay >= last30Days) {
        groups.last30Days.push(transaction);
      } else {
        groups.older.push(transaction);
      }
    });

    return groups;
  };

  // Calculate transactions to show based on pagination
  const totalItemsToShow = currentPage * ITEMS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(0, totalItemsToShow);
  const groupedTransactions = groupTransactionsByDate(paginatedTransactions);

  // Render transaction card with inline editing
  const renderTransactionCard = (transaction: TransactionData) => {
    const isEditing = editingTransaction === transaction.id;
    
    return (
      <Card
        key={transaction.id}
        className="p-3 sm:p-4 cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02] sm:hover:scale-[1.02] hover:z-10 relative group flex flex-col justify-between"
      >
        {/* Source Icon - top right corner (hidden on hover to show edit/delete) */}
        <div
          className={`absolute top-2 right-2 text-muted-foreground transition-opacity duration-200 ${
            isEditing ? 'opacity-0' : 'group-hover:opacity-0'
          }`}
          title={
            transaction.source === "email" 
              ? "Email" 
              : transaction.source === "manual" 
                ? "Manual" 
                : "Statement"
          }
        >
          {transaction.source === "email" ? (
            <Mail className="h-4 w-4" />
          ) : transaction.source === "manual" ? (
            <UserPlus className="h-4 w-4" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
        </div>

        {/* Hover Actions - Edit and Delete Icons */}
        {!isEditing && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                handleStartEdit(transaction);
              }}
              title="Edit transaction"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTransaction(transaction);
              }}
              title="Delete transaction"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Edit Mode Actions */}
        {isEditing && (
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
              onClick={(e) => {
                e.stopPropagation();
                handleSaveEdit(transaction.id);
              }}
              title="Save changes"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-gray-100 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                handleCancelEdit();
              }}
              title="Cancel editing"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        )}

        {/* Centered Bank Logo */}
        <div className="flex justify-center mb-2">
          <div
            className={`${
              transaction.account_type === "Credit Card"
                ? "w-16 h-10 sm:w-20 sm:h-12"
                : "w-10 h-6 sm:w-12 sm:h-8"
            } rounded-lg bg-card shadow-sm border border-border flex items-center justify-center overflow-hidden p-1`}
          >
            <Image
              src={getBankLogo(
                transaction.bank_name,
                transaction.account_type,
                transaction.source
              )}
              alt={`${transaction.bank_name} logo`}
              width={transaction.account_type === "Credit Card" ? 80 : 48}
              height={transaction.account_type === "Credit Card" ? 48 : 32}
              className="object-contain filter drop-shadow-sm max-w-full max-h-full"
              quality={100}
              priority={false}
            />
          </div>
        </div>

        {/* Middle section: Amount and description */}
        <div className="text-center my-1 flex-grow">
          {/* Amount - Editable */}
          {isEditing ? (
            <Input
              type="number"
              step="0.01"
              min="0"
              value={editValues.amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setEditValues(prev => ({ ...prev, amount: e.target.value }))
              }
              className="text-center text-lg font-bold mb-2"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className={`text-lg sm:text-xl font-bold ${
                transaction.type === "expense" ? "text-red-600" : "text-green-600"
              }`}
            >
              {transaction.type === "expense" ? "-" : "+"}
              {formatCurrencyInLakhs(transaction.amount, isPrivacyMode)}
            </div>
          )}

          {/* Description - Editable */}
          {isEditing ? (
            <Input
              value={editValues.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setEditValues(prev => ({ ...prev, description: e.target.value }))
              }
              className="text-center text-sm mt-1"
              onClick={(e) => e.stopPropagation()}
              placeholder="Transaction description"
            />
          ) : (
            <div className="text-sm font-medium text-foreground truncate px-1 mt-1">
              {transaction.description}
            </div>
          )}
        </div>

        {/* Bottom section: Date */}
        <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1 mt-auto">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(new Date(transaction.date))}</span>
        </div>
      </Card>
    );
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
      <Header 
        isPrivacyMode={isPrivacyMode}
        onPrivacyToggle={handlePrivacyToggle}
      />
      
      <div className="mb-8">
        
        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 items-center mt-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters:</span>
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

          {/* Source Filter */}
          <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as "all" | "statement" | "email")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="statement">Statements</SelectItem>
              <SelectItem value="email">Emails</SelectItem>
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
        dataSource={sourceFilter === "all" ? undefined : sourceFilter}
      />

      {/* Transactions Section */}
      <div className="mt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">All Transactions</h2>
            <p className="text-muted-foreground mt-1">Complete transaction history with applied filters</p>
          </div>
        </div>

        {/* Transactions Grid */}
        <Card>
          <CardContent className="pt-6">
            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search transactions by merchant, bank, or amount..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date-Grouped Transactions */}
            <div className="space-y-6">
              {/* Today */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Today</h3>
                {groupedTransactions.today.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 relative">
                    {groupedTransactions.today.map((transaction) =>
                      renderTransactionCard(transaction)
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted rounded-lg text-center">
                    <Wallet className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="font-semibold text-foreground">
                      I see we&apos;re saving some 💵 today!
                    </p>
                  </div>
                )}
              </div>

              {/* Yesterday */}
              {groupedTransactions.yesterday.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Yesterday</h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 relative">
                    {groupedTransactions.yesterday.map((transaction) =>
                      renderTransactionCard(transaction)
                    )}
                  </div>
                </div>
              )}

              {/* Last 7 days */}
              {groupedTransactions.last7Days.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Last 7 days</h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 relative">
                    {groupedTransactions.last7Days.map((transaction) =>
                      renderTransactionCard(transaction)
                    )}
                  </div>
                </div>
              )}
              
              {/* Last 15 days */}
              {groupedTransactions.last15Days.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Last 15 days</h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 relative">
                    {groupedTransactions.last15Days.map((transaction) =>
                      renderTransactionCard(transaction)
                    )}
                  </div>
                </div>
              )}

              {/* Last 30 days */}
              {groupedTransactions.last30Days.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Last 30 days</h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 relative">
                    {groupedTransactions.last30Days.map((transaction) =>
                      renderTransactionCard(transaction)
                    )}
                  </div>
                </div>
              )}

              {/* Older */}
              {groupedTransactions.older.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Older</h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 relative">
                    {groupedTransactions.older.map((transaction) =>
                      renderTransactionCard(transaction)
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Load More Button */}
            {hasMoreTransactions && paginatedTransactions.length < filteredTransactions.length && (
              <div className="flex justify-center pt-6">
                <Button 
                  onClick={loadMoreTransactions}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <span>Load More ({Math.min(ITEMS_PER_PAGE, filteredTransactions.length - paginatedTransactions.length)} more)</span>
                </Button>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground text-center pt-4">
              Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Floating Add Transaction Button */}
      <AddTransactionModal 
        onTransactionAdded={refreshTransactions}
        bankOptions={bankOptions}
      />

      {/* Delete Transaction Modal */}
      <DeleteTransactionModal
        transaction={selectedTransaction}
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onTransactionDeleted={refreshTransactions}
      />
    </div>
  );
} 