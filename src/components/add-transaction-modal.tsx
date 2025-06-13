'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

import { Plus, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AddTransactionModalProps {
  onTransactionAdded: () => void;
  bankOptions: string[];
}

interface BanksByType {
  [accountType: string]: string[];
}

const CATEGORIES = [
  { id: 'food', name: 'Food', image: '/category-images/food.png' },
  { id: 'shopping', name: 'Shopping', image: '/category-images/shopping.png' },
  { id: 'transport', name: 'Transport', image: '/category-images/transport.png' },
  { id: 'movies', name: 'Movies', image: '/category-images/movies.png' }
];

export function AddTransactionModal({ onTransactionAdded }: AddTransactionModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banksByType, setBanksByType] = useState<BanksByType>({});
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    bank_name: '',
    account_type: '',
    category: ''
  });

  // Fetch banks grouped by account type
  useEffect(() => {
    const fetchBanksWithTypes = async () => {
      try {
        const response = await fetch('/api/banks-with-types');
        if (response.ok) {
          const data = await response.json();
          setBanksByType(data);
        }
      } catch (error) {
        console.error('Failed to fetch banks with types:', error);
      }
    };
    fetchBanksWithTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.bank_name || !formData.account_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        category: formData.category || null,
        account_type: formData.account_type
      };

      const response = await fetch('/api/all-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      await response.json();
      
      toast.success(`Transaction ${formData.type === 'income' ? 'income' : 'expense'} of ₹${parseFloat(formData.amount).toLocaleString()} added successfully!`);
      
      // Reset form
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        bank_name: '',
        account_type: '',
        category: ''
      });
      
      // Close modal
      setOpen(false);
      
      // Refresh transactions list
      onTransactionAdded();
      
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setFormData(prev => ({ ...prev, amount: sanitized }));
  };

  const formatAmountDisplay = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    if (num >= 100000) {
      const lakhs = num / 100000;
      return `₹${lakhs.toLocaleString('en-IN', { maximumFractionDigits: 2 })}L`;
    } else if (num >= 1000) {
      const thousands = num / 1000;
      return `₹${thousands.toLocaleString('en-IN', { maximumFractionDigits: 1 })}K`;
    } else {
      return `₹${num.toLocaleString('en-IN')}`;
    }
  };

  const getBankLogo = (bankName: string, accountType: string) => {
    if (accountType === 'Credit Card') {
      const cardImageMap: Record<string, string> = {
        'HDFC Diners': '/cardImages/dinersCard.png',
        'HDFC Swiggy': '/cardImages/swiggyCard.png',
        'Axis Magnus': '/cardImages/magnusCard.png',
        'Flipkart Axis': '/cardImages/flipkartCard.webp',
      };
      return cardImageMap[bankName] || '/cardImages/defaultCard.png';
    }
    
    const logoMap: Record<string, string> = {
      'HDFC': '/cardImages/hdfclogo.png',
      'Axis': '/cardImages/axislogo.png',
    };
    return logoMap[bankName] || '/cardImages/defaultBank.png';
  };

  const selectBank = (bankName: string, accountType: string) => {
    setFormData(prev => ({ 
      ...prev, 
      bank_name: bankName,
      account_type: accountType
    }));
  };

  const selectCategory = (categoryName: string) => {
    setFormData(prev => ({ ...prev, category: categoryName }));
  };

  // Flatten all banks into a single array for the 4-column grid
  const allBanks = Object.entries(banksByType).flatMap(([accountType, banks]) => 
    banks.map(bank => ({ bank, accountType }))
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div className="fixed bottom-6 right-6 z-50 group">
            <Button 
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
              size="icon"
            >
              <Plus className="h-6 w-6 transition-transform group-hover:rotate-90" />
            </Button>
            {/* Hover tooltip */}
            <div className="absolute bottom-16 right-0 bg-black/80 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              🤑 Spent &apos;em monies?
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add New Transaction</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transaction Type - Small Dark Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200",
                  formData.type === 'expense' 
                    ? "bg-slate-800 text-white hover:bg-slate-700" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <TrendingDown className="h-4 w-4" />
                Expense
                <span className="text-xs opacity-70">Money going out</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200",
                  formData.type === 'income' 
                    ? "bg-slate-800 text-white hover:bg-slate-700" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <TrendingUp className="h-4 w-4" />
                Income
                <span className="text-xs opacity-70">Money coming in</span>
              </Button>
            </div>

            {/* Amount Field - No Label */}
            <div>
              <Input
                id="amount"
                type="text"
                placeholder="₹106"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="text-3xl font-bold h-16 text-center border-2 bg-background"
                required
              />
              {formData.amount && (
                <p className="text-center text-sm text-muted-foreground mt-1">
                  {formatAmountDisplay(formData.amount)}
                </p>
              )}
            </div>

            {/* Description Field - No Label */}
            <div>
              <Input
                id="description"
                type="text"
                placeholder="Enter transaction description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="h-10"
                required
              />
            </div>

            {/* Bank/Account Selection - Unified Animation */}
            <div className="space-y-2">
              
              <div className="grid grid-cols-4 gap-2">
                {allBanks.slice(0, 8).map(({ bank, accountType }) => (
                  <Card 
                    key={`${accountType}-${bank}`}
                    className={cn(
                      "cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 group",
                      formData.bank_name === bank && formData.account_type === accountType 
                        ? "ring-3 ring-primary bg-primary/10 shadow-lg scale-105" 
                        : "hover:bg-muted/50 hover:ring-2 hover:ring-primary/30"
                    )}
                    onClick={() => selectBank(bank, accountType)}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-3 h-20 relative overflow-hidden">
                      {/* Shine effect */}
                      <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                        "bg-gradient-to-r from-transparent via-white/20 to-transparent",
                        "transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                      )} />
                      
                      <div className={cn(
                        "relative h-10 w-10 mb-1 transition-all duration-300",
                        formData.bank_name === bank && formData.account_type === accountType 
                          ? "scale-110 filter drop-shadow-lg animate-bounce" 
                          : "group-hover:scale-110"
                      )}
                      style={{
                        animationIterationCount: formData.bank_name === bank && formData.account_type === accountType ? '1' : 'infinite'
                      }}>
                        <Image
                          src={getBankLogo(bank, accountType)}
                          alt={bank}
                          fill
                          className="object-contain transition-all duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = accountType === 'Credit Card' 
                              ? '/cardImages/defaultCard.png' 
                              : '/cardImages/defaultBank.png';
                          }}
                        />
                      </div>
                      <p className={cn(
                        "font-medium text-xs text-center truncate w-full transition-all duration-300",
                        formData.bank_name === bank && formData.account_type === accountType 
                          ? "text-primary font-semibold" 
                          : "group-hover:text-primary"
                      )}>{bank}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Category Selection - Unified Animation */}
            <div className="space-y-2">
              
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((category) => (
                  <Card 
                    key={category.id}
                    className={cn(
                      "cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 group",
                      formData.category === category.name 
                        ? "ring-3 ring-primary bg-primary/10 shadow-lg scale-105" 
                        : "hover:bg-muted/50 hover:ring-2 hover:ring-primary/30"
                    )}
                    onClick={() => selectCategory(category.name)}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-3 h-24 relative overflow-hidden">
                      {/* Shine effect */}
                      <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                        "bg-gradient-to-r from-transparent via-white/30 to-transparent",
                        "transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                      )} />
                      
                      <div className={cn(
                        "relative h-12 w-12 mb-2 transition-all duration-300",
                        formData.category === category.name 
                          ? "scale-125 filter drop-shadow-xl animate-bounce" 
                          : "group-hover:scale-115 group-hover:filter group-hover:drop-shadow-lg"
                      )}
                      style={{
                        animationIterationCount: formData.category === category.name ? '1' : 'infinite'
                      }}>
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className={cn(
                            "object-contain transition-all duration-300",
                            formData.category === category.name 
                              ? "brightness-110 saturate-110" 
                              : "group-hover:brightness-110"
                          )}
                        />
                      </div>
                      <p className={cn(
                        "font-medium text-xs text-center transition-all duration-300",
                        formData.category === category.name 
                          ? "text-primary font-bold scale-105" 
                          : "group-hover:text-primary group-hover:font-semibold"
                      )}>{category.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Transaction
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 