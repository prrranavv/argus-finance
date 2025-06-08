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

  // Card image mapping - Updated to use 3D renders
  const getCardImage = (cardName: string) => {
    const imageMap: Record<string, string> = {
      'HDFC Diners': '/cardImages/dinersCard.png',
      'HDFC Swiggy': '/cardImages/swiggyCard.png',
      'Axis Magnus': '/cardImages/magnusCardHor.png',
      'Flipkart Axis': '/cardImages/flipkartCard.webp',
      'Total': '/cardImages/allcards.svg',
    };
    return imageMap[cardName];
  };

  return (
    <div className="container mx-auto p-4 md:p-10 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 relative">
              <Image
                src="/cardImages/argusLogo.png"
                alt="Argus Logo"
                fill
                className="object-contain"
                priority={true}
              />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-4xl font-bold tracking-tight">Argus</h1>
                <div className="relative">
                  {/* Core 3D indicator */}
                  <div className="w-4 h-4 rounded-full relative transform hover:scale-110 transition-transform duration-300">
                    {/* Base shadow for depth */}
                    <div className="absolute inset-0 rounded-full bg-green-600 blur-sm opacity-60"></div>
                    {/* Main body with gradient */}
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-green-400 via-green-500 to-green-600 shadow-lg animate-pulse">
                      {/* Highlight for 3D effect */}
                      <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-green-200 to-green-300 opacity-80"></div>
                      {/* Inner glow */}
                      <div className="absolute inset-0.5 rounded-full bg-green-400 opacity-50 animate-pulse" style={{animationDelay: '0.3s'}}></div>
                    </div>
                  </div>
                  
                  {/* Outer ping rings */}
                  <div className="absolute inset-0 w-4 h-4 rounded-full border-2 border-green-400 animate-ping opacity-60"></div>
                  <div className="absolute inset-0 w-4 h-4 rounded-full border border-green-300 animate-ping opacity-40" style={{animationDelay: '0.7s'}}></div>
                  
                  {/* Subtle outer glow */}
                  <div className="absolute -inset-1 rounded-full bg-green-400 opacity-20 blur-md animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
              </div>
              <p className="text-muted-foreground mt-2">AI-powered financial intelligence that protects your privacy</p>
            </div>
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
            <CardTitle>Import Statements</CardTitle>
            <CardDescription>Securely process any bank or credit card statement</CardDescription>
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
            <CardTitle>Transaction Intelligence</CardTitle>
            <CardDescription>Discover patterns in your spending behavior</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="text-sm text-muted-foreground mb-4">Explore intelligent categorization and spending insights</p>
            <div className="flex-1"></div>
            <Link href="/transactions">
              <Button variant="outline" className="w-full">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analyze Transactions
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Smart Insights</CardTitle>
            <CardDescription>AI-powered financial recommendations</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="text-sm text-muted-foreground mb-4">Personalized insights powered by advanced AI models</p>
            <div className="flex-1"></div>
            <Button variant="outline" className="w-full" disabled>
              <Brain className="mr-2 h-4 w-4" />
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Section Divider */}
      <div className="mb-12">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-6 bg-white text-gray-500 font-medium">Financial Overview</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Section */}
      <KeyMetrics isPrivacyMode={isPrivacyMode} />

      {/* Bank Accounts Section */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>Track balance trends and monthly spending across all your accounts</CardDescription>
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

      {/* Credit Cards Section - Left Sidebar with 2x2 Grid */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Credit Card Portfolio</CardTitle>
            <CardDescription>Interactive 3D card selection with real-time spending analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8">
              {/* Left Sidebar - Credit Card Selection */}
              <div className="w-80 flex-shrink-0">
                {/* Total Card - Full Width at Top */}
                <div
                  onClick={() => setSelectedCreditCard('Total')}
                  className={`relative cursor-pointer transition-all duration-200 p-4 mb-4 ${
                    selectedCreditCard === 'Total' 
                      ? 'scale-[1.4]' 
                      : 'hover:scale-[1.4]'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <div className="w-48 h-32 relative">
                      <Image
                        src={getCardImage('Total')}
                        alt="All cards"
                        fill
                        className={`object-contain rounded-lg ${
                          selectedCreditCard === 'Total'
                            ? 'drop-shadow-2xl shadow-2xl'
                            : ''
                        }`}
                        quality={95}
                        priority={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Horizontal Divider */}
                <div className="border-t border-border/20 my-4"></div>

                {/* Individual Cards - Vertical List */}
                <div className="space-y-8">
                  {creditCards.filter(card => card !== 'Total').map((card) => (
                    <div
                      key={card}
                      onClick={() => setSelectedCreditCard(card)}
                      className={`relative cursor-pointer transition-all duration-200 p-3 ${
                        selectedCreditCard === card 
                          ? 'scale-[1.4]' 
                          : 'hover:scale-[1.4]'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <div className="w-40 h-24 relative">
                          <Image
                            src={getCardImage(card)}
                            alt={`${card} card`}
                            fill
                            className={`object-contain rounded-lg ${
                              selectedCreditCard === card
                                ? 'drop-shadow-2xl shadow-2xl'
                                : ''
                            }`}
                            quality={95}
                            priority={false}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Charts and Data */}
              <div className="flex-1 space-y-8">
                {/* Credit Card Balance Chart */}
                <div>
                  <CreditCardBalanceChart selectedCard={selectedCreditCard} isPrivacyMode={isPrivacyMode} />
                </div>
                
                {/* Credit Card Monthly Summary */}
                <div>
                  <CreditCardMonthlySummary selectedCard={selectedCreditCard} isPrivacyMode={isPrivacyMode} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
