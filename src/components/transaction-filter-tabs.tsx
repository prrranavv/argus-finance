"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type FilterType = "all" | "credit" | "debit";

interface Transaction {
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
}

interface TransactionFilterTabsProps {
  transactions: Transaction[];
  onFilterChange: (filteredTransactions: Transaction[]) => void;
}

export function TransactionFilterTabs({ 
  transactions, 
  onFilterChange 
}: TransactionFilterTabsProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    
    let filteredTransactions = transactions;
    
    if (filter === "credit") {
      filteredTransactions = transactions.filter(t => t.type === "income");
    } else if (filter === "debit") {
      filteredTransactions = transactions.filter(t => t.type === "expense");
    }
    
    onFilterChange(filteredTransactions);
  };

  const filters = [
    { key: "all" as FilterType, label: "All" },
    { key: "credit" as FilterType, label: "Credit" },
    { key: "debit" as FilterType, label: "Debit" },
  ];

  // Calculate counts for each filter
  const allCount = transactions.length;
  const creditCount = transactions.filter(t => t.type === "income").length;
  const debitCount = transactions.filter(t => t.type === "expense").length;

  const getCounts = (filter: FilterType) => {
    switch (filter) {
      case "all": return allCount;
      case "credit": return creditCount;
      case "debit": return debitCount;
      default: return 0;
    }
  };

  return (
    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 min-w-fit">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => handleFilterChange(filter.key)}
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
            "flex items-center space-x-1.5 whitespace-nowrap",
            activeFilter === filter.key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          )}
        >
          <span>{filter.label}</span>
          {getCounts(filter.key) > 0 && (
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
              activeFilter === filter.key
                ? "bg-gray-100 text-gray-600"
                : "bg-gray-200 text-gray-500"
            )}>
              {getCounts(filter.key)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
} 