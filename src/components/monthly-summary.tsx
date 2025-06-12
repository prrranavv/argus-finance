'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrencyInLakhs } from '@/lib/utils';

interface MonthlySummaryData {
  month: string;
  accountBalance: number | null;
  credited: number;
  debited: number;
}

interface MonthlySummaryProps {
  selectedBank: string;
  isPrivacyMode?: boolean;
}

export function MonthlySummary({ selectedBank, isPrivacyMode = false }: MonthlySummaryProps) {
  const [data, setData] = useState<MonthlySummaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = `/api/monthly-summary-v2?bank=${selectedBank}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch monthly summary');
        }
        const summaryData = await response.json();
        console.log('Monthly summary data:', summaryData);
        
        // Sort months in descending order (most recent first) if needed
        // API should already return data sorted correctly
        setData(summaryData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBank]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
          <CardDescription>Your monthly financial overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading monthly summary...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
          <CardDescription>Your monthly financial overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
          <CardDescription>Your monthly financial overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No transaction data available for {selectedBank}. Upload your statements to see monthly summaries.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full animate-in fade-in duration-500">
      <CardHeader>
        <CardTitle>Monthly Summary</CardTitle>
        <CardDescription>
          {selectedBank === 'Total' 
            ? 'Your monthly financial overview across all banks' 
            : `Your monthly financial overview for ${selectedBank}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="overflow-x-auto">
          <Table key={selectedBank}>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Account Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.month}</TableCell>
                  <TableCell className="text-right">
                    {row.accountBalance !== null ? formatCurrencyInLakhs(row.accountBalance, isPrivacyMode) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 