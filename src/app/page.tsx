'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadModal } from "@/components/upload-modal";
import { UploadedStatementsModal } from "@/components/uploaded-statements-modal";
import { AccountBalanceChart } from "@/components/account-balance-chart";
import { MonthlySummary } from "@/components/monthly-summary";
import { CreditCardBalanceChart } from "@/components/credit-card-balance-chart";
import { CreditCardMonthlySummary } from "@/components/credit-card-monthly-summary";
import { KeyMetrics } from "@/components/key-metrics";
import Link from "next/link";
import Image from "next/image";
import { BarChart3, Brain, CreditCard, Eye, EyeOff } from "lucide-react";

export default function Home() {
  const [selectedBank, setSelectedBank] = useState('Total');
  const [selectedCreditCard, setSelectedCreditCard] = useState('Total');
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const banks = ['Total', 'HDFC', 'Axis'];
  const creditCards = ['Total', 'HDFC Diners', 'HDFC Swiggy', 'Axis Magnus', 'Flipkart Axis'];

  // Card image mapping
  const getCardImage = (cardName: string) => {
    const imageMap: Record<string, string> = {
      'HDFC Diners': '/cardImages/dinersCard.png',
      'HDFC Swiggy': '/cardImages/swiggyCard.png',
      'Axis Magnus': '/cardImages/magnusCard.webp',
      'Flipkart Axis': '/cardImages/flipkartCard.webp',
    };
    return imageMap[cardName];
  };

  return (
    <div className="container mx-auto p-4 md:p-10 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Personal Finance Dashboard</h1>
            <p className="text-muted-foreground mt-2">Upload your financial statements and get AI-powered insights</p>
          </div>
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
      </div>
      
      {/* Main Action Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Upload Statements</CardTitle>
            <CardDescription>Upload your bank and credit card statements</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <div className="flex-1"></div>
            <div className="space-y-3">
              <UploadModal />
              <UploadedStatementsModal />
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Spending Analysis</CardTitle>
            <CardDescription>View your spending patterns and trends</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="text-sm text-muted-foreground mb-4">View your spending patterns and trends</p>
            <div className="flex-1"></div>
            <Link href="/transactions">
              <Button variant="outline" className="w-full">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Transactions
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Get personalized financial insights</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="text-sm text-muted-foreground mb-4">Get personalized financial insights powered by GPT-4.5</p>
            <div className="flex-1"></div>
            <Button variant="outline" className="w-full" disabled>
              <Brain className="mr-2 h-4 w-4" />
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Section */}
      <KeyMetrics isPrivacyMode={isPrivacyMode} />

      {/* Bank Accounts Section */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts</CardTitle>
            <CardDescription>Select a bank to view account balance progression and monthly summary</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedBank} onValueChange={setSelectedBank}>
              <TabsList className="grid w-full grid-cols-3">
                {banks.map(bank => (
                  <TabsTrigger key={bank} value={bank}>
                    {bank}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={selectedBank} className="space-y-8 mt-6">
                {/* Charts Section - Now above the table */}
                <div>
                  <AccountBalanceChart selectedBank={selectedBank} isPrivacyMode={isPrivacyMode} />
                </div>
                
                {/* Monthly Summary Table */}
                <div>
                  <MonthlySummary selectedBank={selectedBank} isPrivacyMode={isPrivacyMode} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Credit Cards Section */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Credit Cards</CardTitle>
            <CardDescription>Select a credit card to view outstanding balances and monthly spending</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedCreditCard} onValueChange={setSelectedCreditCard}>
              <TabsList className="grid w-full grid-cols-5 h-16">
                {creditCards.map(card => (
                  <TabsTrigger key={card} value={card} className="text-xs flex flex-col items-center gap-1 h-14 p-2">
                    {card === 'Total' ? (
                      <div className="flex flex-col items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-[10px] font-medium">Total</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <div className="relative w-8 h-5 rounded-sm overflow-hidden">
                          <Image
                            src={getCardImage(card)}
                            alt={`${card} card`}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                        <span className="text-[10px] font-medium leading-tight text-center">
                          {card === 'Flipkart Axis' ? 'Flipkart' : card.replace('HDFC ', '').replace('Axis ', '')}
                        </span>
                      </div>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={selectedCreditCard} className="space-y-8 mt-6">
                {/* Credit Card Balance Chart */}
                <div>
                  <CreditCardBalanceChart selectedCard={selectedCreditCard} isPrivacyMode={isPrivacyMode} />
                </div>
                
                {/* Credit Card Monthly Summary */}
                <div>
                  <CreditCardMonthlySummary selectedCard={selectedCreditCard} isPrivacyMode={isPrivacyMode} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
