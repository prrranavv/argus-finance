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
  totalCreditBill: number;
}

interface MonthlySummaryProps {
  selectedBank: string;
}

export function MonthlySummary({ selectedBank }: MonthlySummaryProps) {
  const [data, setData] = useState<MonthlySummaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/monthly-summary?bank=${selectedBank}`);
        if (!response.ok) {
          throw new Error('Failed to fetch monthly summary');
        }
        const summaryData = await response.json();
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
    <Card>
      <CardHeader>
        <CardTitle>Monthly Summary</CardTitle>
        <CardDescription>
          {selectedBank === 'Total' 
            ? 'Your monthly financial overview across all banks' 
            : `Your monthly financial overview for ${selectedBank}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Account Balance</TableHead>
                <TableHead className="text-right">Credited</TableHead>
                <TableHead className="text-right">Debited</TableHead>
                <TableHead className="text-right">Total Credit Bill</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.month}</TableCell>
                  <TableCell className="text-right">
                    {row.accountBalance !== null ? formatCurrencyInLakhs(row.accountBalance) : '-'}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrencyInLakhs(row.credited)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {formatCurrencyInLakhs(row.debited)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyInLakhs(row.totalCreditBill)}
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