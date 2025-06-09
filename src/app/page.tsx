'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountBalanceChart } from "@/components/account-balance-chart";
import { MonthlySummary } from "@/components/monthly-summary";
import { CreditCardBalanceChart } from "@/components/credit-card-balance-chart";
import { CreditCardMonthlySummary } from "@/components/credit-card-monthly-summary";
import { KeyMetrics } from "@/components/key-metrics";
import { Header } from "@/components/header";
import Image from "next/image";

export default function Home() {
  const [selectedBank, setSelectedBank] = useState('Total');
  const [selectedCreditCard, setSelectedCreditCard] = useState('Total');
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);
  const [filterYear] = useState(2025); // Fixed filter for 2025 data only
  const banks = ['Total', 'HDFC', 'Axis'];
  const creditCards = ['Total', 'HDFC Diners', 'HDFC Swiggy', 'Axis Magnus', 'Flipkart Axis'];

  // Get shorter card names for mobile
  const getCardDisplayName = (card: string, isMobile: boolean = false) => {
    if (card === 'Total') return 'All';
    
    if (isMobile) {
      const mobileNames: Record<string, string> = {
        'HDFC Diners': 'Diners',
        'HDFC Swiggy': 'Swiggy', 
        'Axis Magnus': 'Magnus',
        'Flipkart Axis': 'Flipkart'
      };
      return mobileNames[card] || card.split(' ').pop() || card;
    }
    
    return card.split(' ').pop() || card;
  };

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
  


  // Card image mapping - Updated to use 3D renders
  const getCardImage = (cardName: string) => {
    const imageMap: Record<string, string> = {
      'HDFC Diners': '/cardImages/dinersCard.png',
      'HDFC Swiggy': '/cardImages/swiggyCard.png',
      'Axis Magnus': '/cardImages/magnusCard.png',
      'Flipkart Axis': '/cardImages/flipkartCard.webp',
      'Total': '/cardImages/allcards.svg',
    };
    return imageMap[cardName];
  };

  return (
    <div className="container mx-auto p-4 md:p-10 max-w-7xl">
      <Header 
        isPrivacyMode={isPrivacyMode}
        onPrivacyToggle={handlePrivacyToggle}
      />

      
      {/* Key Metrics Section */}
      <KeyMetrics isPrivacyMode={isPrivacyMode} filterYear={filterYear} />

      {/* Bank Accounts Section */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>Track balance trends and monthly spending across all your accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedBank} onValueChange={setSelectedBank}>
              <TabsList className="grid w-full grid-cols-3 h-10 sm:h-20 md:h-32 gap-1 md:gap-0">
                {banks.map(bank => (
                  <TabsTrigger key={bank} value={bank} className="flex flex-col items-center justify-center space-y-0 sm:space-y-2 md:space-y-3 px-1 sm:p-2 md:p-4 h-full text-[10px] sm:text-sm">
                    <div className="hidden sm:block w-16 h-10 sm:w-16 sm:h-10 md:w-20 md:h-12 relative">
                      <Image
                        src={bank === 'Total' ? '/cardImages/axisplushdfclogo.png' : `/cardImages/${bank.toLowerCase()}logo.png`}
                        alt={`${bank} logo`}
                        fill
                        className="object-contain"
                        quality={95}
                      />
                    </div>
                    <span className="font-medium leading-tight text-center">{bank === 'Total' ? 'All' : bank}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={selectedBank} className="mt-6">
                {/* Side-by-side layout: Chart on left, Table on right - 3:2 ratio */}
                <div className="flex flex-col lg:flex-row gap-6 w-full">
                  {/* Left: Account Balance Chart - Takes 3/5 of width */}
                  <div className="w-full lg:w-3/5">
                    <AccountBalanceChart selectedBank={selectedBank} isPrivacyMode={isPrivacyMode} filterYear={filterYear} />
                  </div>
                  
                  {/* Right: Monthly Summary Table - Takes 2/5 of width */}
                  <div className="w-full lg:w-2/5">
                    <MonthlySummary selectedBank={selectedBank} isPrivacyMode={isPrivacyMode} filterYear={filterYear} />
                  </div>
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
            <CardTitle>Credit Card Portfolio</CardTitle>
            <CardDescription>Track credit card spending and outstanding balances across all your cards</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedCreditCard} onValueChange={setSelectedCreditCard}>
              <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-3 md:grid-cols-5 h-10 sm:h-20 md:h-32 gap-1 md:gap-0 scrollbar-hide">
                {creditCards.map(card => (
                  <TabsTrigger key={card} value={card} className="flex-shrink-0 flex flex-col items-center justify-center space-y-0 sm:space-y-2 md:space-y-3 px-2 sm:p-2 md:p-4 h-full text-[10px] sm:text-sm min-w-16 sm:min-w-0">
                    <div className="hidden sm:block w-16 h-10 sm:w-16 sm:h-10 md:w-20 md:h-12 relative">
                      <Image
                        src={getCardImage(card)}
                        alt={`${card} card`}
                        fill
                        className="object-contain rounded-sm md:rounded-md"
                        quality={95}
                      />
                    </div>
                    <span className="font-medium leading-tight text-center whitespace-nowrap">
                      <span className="block sm:hidden">{getCardDisplayName(card, true)}</span>
                      <span className="hidden sm:block">{getCardDisplayName(card, false)}</span>
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={selectedCreditCard} className="mt-6">
                {/* Side-by-side layout: Chart on left, Table on right - 3:2 ratio */}
                <div className="flex flex-col lg:flex-row gap-6 w-full">
                  {/* Left: Credit Card Balance Chart - Takes 3/5 of width */}
                  <div className="w-full lg:w-3/5">
                    <CreditCardBalanceChart selectedCard={selectedCreditCard} isPrivacyMode={isPrivacyMode} filterYear={filterYear} />
                  </div>
                  
                  {/* Right: Credit Card Monthly Summary - Takes 2/5 of width */}
                  <div className="w-full lg:w-2/5">
                    <CreditCardMonthlySummary selectedCard={selectedCreditCard} isPrivacyMode={isPrivacyMode} filterYear={filterYear} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
