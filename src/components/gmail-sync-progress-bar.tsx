"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

export interface SyncStep {
  id: string;
  title: string;
  emoji: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
}

interface GmailSyncProgressBarProps {
  isVisible: boolean;
  currentStep: number;
  steps: SyncStep[];
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function GmailSyncProgressBar({ 
  isVisible, 
  currentStep, 
  steps, 
  onComplete, 
  onError 
}: GmailSyncProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (steps.length > 0) {
      const completedSteps = steps.filter(step => step.status === 'completed').length;
      const newProgress = (completedSteps / steps.length) * 100;
      setProgress(newProgress);

      // Check if all steps are completed
      if (completedSteps === steps.length && steps.every(step => step.status === 'completed')) {
        onComplete?.();
      }

      // Check if any step has error
      const errorStep = steps.find(step => step.status === 'error');
      if (errorStep) {
        onError?.(errorStep.message || 'An error occurred during sync');
      }
    }
  }, [steps, onComplete, onError]);

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const hasError = steps.some(step => step.status === 'error');

  // Clean step titles without emojis
  const getCleanTitle = (title: string) => {
    const cleanTitles: Record<string, string> = {
      'Checking existing emails': 'Checking existing emails..',
      'Fetching your emails': 'Fetching emails..',
      'Reading and cleaning them': 'Reading contents..',
      'Saving emails to database': 'Saving emails..',
      'Analyzing with AI': 'Analyzing emails..',
      'Saving transactions': 'Saving transactions..'
    };
    return cleanTitles[title] || title;
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-80 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-4 animate-in slide-in-from-top-2">
      <div className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">Gmail Sync</span>
            <span className="text-muted-foreground font-mono text-xs">
              {Math.round(progress)}%
            </span>
          </div>
          
          <Progress 
            value={progress} 
            className={`h-2 transition-all duration-300 ${
              hasError ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'
            }`}
          />
          
          {/* Current Step Status */}
          {currentStepData && !hasError && (
            <div className="text-xs text-muted-foreground">
              {getCleanTitle(currentStepData.title)}
            </div>
          )}

          {/* Error Message */}
          {hasError && (
            <div className="text-xs text-red-500">
              {steps.find(step => step.status === 'error')?.message || 'Sync failed'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 