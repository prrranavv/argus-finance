import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrencyInLakhs } from "@/lib/utils";
import { Edit2, Check, X } from "lucide-react";
import Image from "next/image";

interface Transaction {
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

interface VirtualizedTransactionItemProps {
  transaction: Transaction;
  isPrivacyMode: boolean;
  editingCategory: string | null;
  newCategory: string;
  onCategoryEdit: (transactionId: string, currentCategory: string | null) => void;
  onCategorySave: (transactionId: string) => void;
  onCategoryCancel: () => void;
  onNewCategoryChange: (value: string) => void;
  style?: React.CSSProperties;
}

const VirtualizedTransactionItem = memo(function VirtualizedTransactionItem({
  transaction,
  isPrivacyMode,
  editingCategory,
  newCategory,
  onCategoryEdit,
  onCategorySave,
  onCategoryCancel,
  onNewCategoryChange,
  style
}: VirtualizedTransactionItemProps) {
  const getBankLogo = (bankName: string, accountType: string, source: string) => {
    // For credit cards, use specific card images
    if (accountType === 'Credit Card') {
      const cardImageMap: Record<string, string> = {
        'HDFC Diners': '/cardImages/diners3dCard.png',
        'HDFC Swiggy': '/cardImages/swiggyCard.png',
        'Axis Magnus': '/cardImages/magnusCard.webp',
        'Flipkart Axis': '/cardImages/flipkartCard.webp',
      };
      
      // Check if source matches any of our card types
      if (cardImageMap[source]) {
        return cardImageMap[source];
      }
      
      // If no exact match, try to match based on bankName + keywords
      if (source.includes('Swiggy') || bankName === 'HDFC Swiggy') {
        return '/cardImages/swiggyCard.png';
      }
      if (source.includes('Diners') || bankName === 'HDFC Diners') {
        return '/cardImages/diners3dCard.png';
      }
      if (source.includes('Magnus') || bankName === 'Axis Magnus') {
        return '/cardImages/magnusCard.webp';
      }
      if (source.includes('Flipkart') || bankName === 'Flipkart Axis') {
        return '/cardImages/flipkartCard.webp';
      }
    }
    
    // For bank accounts, use bank logos
    const logoMap: Record<string, string> = {
      'HDFC': '/cardImages/hdfclogo.png',
      'Axis': '/cardImages/axislogo.png',
    };
    return logoMap[bankName];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div style={style}>
      <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
        {/* Left Section - Transaction Info */}
        <div className="flex items-center space-x-3 flex-1">
          {/* Bank Logo */}
          <div className="flex-shrink-0">
            {getBankLogo(transaction.bankName, transaction.accountType, transaction.source) ? (
              <div className="w-12 h-8 rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                <Image
                  src={getBankLogo(transaction.bankName, transaction.accountType, transaction.source)}
                  alt={`${transaction.source || transaction.bankName} logo`}
                  width={transaction.accountType === 'Credit Card' ? 48 : 24}
                  height={transaction.accountType === 'Credit Card' ? 30 : 24}
                  className="object-contain"
                  quality={95}
                  priority={false}
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {transaction.bankName.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Transaction Details */}
          <div className="flex-1 min-w-0">
            <div className="mb-1">
              <h4 className="font-medium text-gray-900 truncate">
                {transaction.description}
              </h4>
            </div>
            <div className="text-xs text-gray-500">
              <span>{formatDate(transaction.date)}</span>
            </div>
          </div>
        </div>

        {/* Right Section - Amount and Balance */}
        <div className="text-right flex-shrink-0 ml-4">
          <div
            className={`text-lg font-semibold mb-1 ${
              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {transaction.type === 'income' ? '+' : '-'}
            {formatCurrencyInLakhs(transaction.amount, isPrivacyMode)}
          </div>
          {transaction.closingBalance !== null && (
            <div className="text-xs text-gray-500">
              Balance: {formatCurrencyInLakhs(transaction.closingBalance, isPrivacyMode)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default VirtualizedTransactionItem; 