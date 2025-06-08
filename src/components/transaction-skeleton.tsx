import React from "react";

interface TransactionSkeletonProps {
  count?: number;
}

export function TransactionSkeleton({ count = 1 }: TransactionSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 bg-card border border-border rounded-xl animate-pulse"
        >
          {/* Left Section - Logo and Details */}
          <div className="flex items-center space-x-3 flex-1">
            {/* Logo Skeleton */}
            <div className="w-10 h-8 bg-muted rounded"></div>
            
            {/* Transaction Details Skeleton */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {/* Title Skeleton */}
                <div className="h-4 bg-muted rounded w-48"></div>
                {/* Badge Skeleton */}
                <div className="h-5 bg-muted rounded-full w-16"></div>
              </div>
              {/* Metadata Skeleton */}
              <div className="flex items-center space-x-2">
                <div className="h-3 bg-muted/60 rounded w-12"></div>
                <div className="w-1 h-1 bg-muted/60 rounded-full"></div>
                <div className="h-3 bg-muted/60 rounded w-20"></div>
              </div>
            </div>
          </div>

          {/* Right Section - Amount and Balance */}
          <div className="text-right flex-shrink-0 ml-4">
            {/* Amount Skeleton */}
            <div className="h-6 bg-muted rounded w-20 mb-1"></div>
            {/* Balance Skeleton */}
            <div className="h-3 bg-muted/60 rounded w-24"></div>
          </div>
        </div>
      ))}
    </>
  );
} 