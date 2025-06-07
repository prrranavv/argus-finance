'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
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
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

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

  // Keep transactions for the TransactionsList component

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
          Detailed insights from your financial data • Last 30 days
        </p>
      </div>

      {/* Enhanced Metrics Section */}
      <TransactionMetrics isPrivacyMode={isPrivacyMode} />

      {/* Transactions List Section */}
      <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">All Transactions</h2>
          <p className="text-muted-foreground mt-1">Complete transaction history with filters</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <TransactionsList transactions={transactions} isPrivacyMode={isPrivacyMode} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 