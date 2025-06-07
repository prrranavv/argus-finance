'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TransactionsList } from "@/components/transactions-list";

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch transactions
        const transactionsResponse = await fetch('/api/transactions');
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.map((t: any) => ({
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

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-10 max-w-7xl">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalTransactions = transactions.length;
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 100000) {
      const lakhs = absAmount / 100000;
      return `₹ ${lakhs.toFixed(2)} lakhs`;
    } else if (absAmount >= 1000) {
      const thousands = absAmount / 1000;
      return `₹ ${thousands.toFixed(1)}K`;
    } else {
      return `₹ ${absAmount.toFixed(0)}`;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-10 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Transaction History</h1>
        <p className="text-muted-foreground mt-2">Your processed financial data</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions with Filter Tabs */}
      <Card>
        <CardContent className="pt-6">
          <TransactionsList transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
} 