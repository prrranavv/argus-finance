'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


interface CreditCardSummaryData {
  month: string;
  amount: number;
}

interface CreditCardMonthlySummaryProps {
  selectedCard: string;
  isPrivacyMode?: boolean;
}

export function CreditCardMonthlySummary({ selectedCard, isPrivacyMode = false }: CreditCardMonthlySummaryProps) {
  const [data, setData] = useState<CreditCardSummaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreditCardSummary = async () => {
      try {
        const response = await fetch(`/api/credit-card-summary?card=${encodeURIComponent(selectedCard)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch credit card summary');
        }
        const summaryData = await response.json();
        setData(summaryData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCreditCardSummary();
  }, [selectedCard]);

  const formatCurrency = (amount: number) => {
    if (isPrivacyMode) {
      return '₹••••';
    }
    
    const absAmount = Math.abs(amount);
    if (absAmount >= 100000) {
      const lakhs = absAmount / 100000;
      return `₹${lakhs.toFixed(2)}L`;
    } else if (absAmount >= 1000) {
      const thousands = absAmount / 1000;
      return `₹${thousands.toFixed(1)}K`;
    } else {
      return `₹${absAmount.toFixed(0)}`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Card Monthly Summary</CardTitle>
          <CardDescription>Loading credit card summary...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Card Monthly Summary</CardTitle>
          <CardDescription>Error loading credit card summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Card Monthly Summary</CardTitle>
          <CardDescription>Monthly credit card spending breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No credit card data available. Upload credit card statements to see monthly spending.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Card Monthly Summary</CardTitle>
        <CardDescription>
          {selectedCard === 'Total' 
            ? 'Monthly credit card spending breakdown' 
            : `Monthly ${selectedCard} spending breakdown`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{row.month}</TableCell>
                <TableCell className="text-right text-red-600 font-medium">
                  {formatCurrency(row.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 