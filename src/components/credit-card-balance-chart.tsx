'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CreditCardBalanceData {
  week: string;
  Total?: number | null;
  'HDFC Diners'?: number | null;
  'HDFC Swiggy'?: number | null;
  'Axis Magnus'?: number | null;
  'Flipkart Axis'?: number | null;
  [key: string]: string | number | null | undefined;
}

interface CreditCardBalanceChartProps {
  selectedCard: string;
  isPrivacyMode?: boolean;
}

export function CreditCardBalanceChart({ selectedCard, isPrivacyMode = false }: CreditCardBalanceChartProps) {
  const [data, setData] = useState<CreditCardBalanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreditCardData = async () => {
      try {
        const response = await fetch('/api/credit-card-progression');
        if (!response.ok) {
          throw new Error('Failed to fetch credit card data');
        }
        const creditCardData = await response.json();
        setData(creditCardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCreditCardData();
  }, []);

  const formatCurrency = (value: number) => {
    if (isPrivacyMode) {
      return '₹••••';
    }
    
    const absValue = Math.abs(value);
    if (absValue >= 100000) {
      const lakhs = absValue / 100000;
      return `₹${lakhs.toFixed(2)}L`;
    } else if (absValue >= 1000) {
      const thousands = absValue / 1000;
      return `₹${thousands.toFixed(1)}K`;
    } else {
      return `₹${absValue.toFixed(0)}`;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-foreground mb-2">{`Month: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-foreground">
                {entry.dataKey}: {entry.value ? formatCurrency(entry.value) : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Define colors for each credit card
  const getCreditCardColor = (card: string) => {
    switch (card) {
      case 'Total': return '#8b5cf6';
      case 'HDFC Diners': return '#dc2626';
      case 'HDFC Swiggy': return '#ea580c';
      case 'Axis Magnus': return '#16a34a';
      case 'Flipkart Axis': return '#0891b2';
      default: return '#8b5cf6';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Card Outstanding</CardTitle>
          <CardDescription>Loading credit card data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
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
          <CardTitle>Credit Card Outstanding</CardTitle>
          <CardDescription>Error loading credit card data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
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
          <CardTitle>Credit Card Outstanding</CardTitle>
          <CardDescription>Track your credit card balances over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No credit card data available. Upload some credit card statements to see your outstanding balances.
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    // Always show only the selected card as area chart (including Total)
    const cardColor = getCreditCardColor(selectedCard);
    return (
      <AreaChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <defs>
          <linearGradient id={`${selectedCard.replace(/\s+/g, '')}Gradient`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={cardColor} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={cardColor} stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="week" 
          className="text-xs fill-muted-foreground"
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          className="text-xs fill-muted-foreground"
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => {
            if (isPrivacyMode) {
              return '₹••••';
            }
            if (Math.abs(value) >= 100000) {
              return `₹${(Math.abs(value) / 100000).toFixed(1)}L`;
            } else if (Math.abs(value) >= 1000) {
              return `₹${(Math.abs(value) / 1000).toFixed(0)}K`;
            }
            return `₹${Math.abs(value)}`;
          }}
        />
        <Area
          type="monotone"
          dataKey={selectedCard}
          stroke={cardColor}
          strokeWidth={3}
          fill={`url(#${selectedCard.replace(/\s+/g, '')}Gradient)`}
          dot={{ fill: cardColor, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: cardColor, strokeWidth: 2, fill: "#ffffff" }}
          connectNulls={false}
        />
        <Tooltip content={<CustomTooltip />} />
      </AreaChart>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Card Outstanding</CardTitle>
        <CardDescription>
          {selectedCard === 'Total' 
            ? 'Your credit card outstanding amounts month over month' 
            : `Your ${selectedCard} outstanding amount month over month`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 