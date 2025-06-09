'use client';

import { Button } from "@/components/ui/button";
import { StatementsModal } from "@/components/statements-modal";
import { GmailSyncModal } from "@/components/gmail-sync-modal";
import { GmailSyncProgressBar } from "@/components/gmail-sync-progress-bar";
import { useGmailSync } from "@/hooks/use-gmail-sync";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, FileText, BarChart3, Users, Menu, RefreshCw, CheckCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface HeaderProps {
  isPrivacyMode: boolean;
  onPrivacyToggle: () => void;
}

export function Header({ isPrivacyMode, onPrivacyToggle }: HeaderProps) {
  const [showStatementsModal, setShowStatementsModal] = useState(false);
  const [showGmailSyncModal, setShowGmailSyncModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = usePathname();

  // Gmail sync functionality
  const { isRunning, currentStep, steps, results, error, runSync, reset } = useGmailSync();

  // Handle sync button click
  const handleSyncClick = () => {
    if (results && !isRunning) {
      // Show results modal if sync is complete
      setShowGmailSyncModal(true);
    } else if (!isRunning) {
      // Test toast before starting sync
      console.log('🧪 Testing toast system...');
      toast.info("Starting Gmail sync...", {
        description: "Checking for new emails",
        duration: 3000,
      });
      
      // Start sync process
      runSync();
    }
  };

  // Show toast 500ms after sync completes
  useEffect(() => {
    if (results) {
      console.log('🎉 Sync completed, showing toast in 500ms!');
      
      const toastTimer = setTimeout(() => {
        const newEmails = results.syncStats?.newEmails || results.emails?.length || 0;
        const newTransactions = results.transactions?.length || 0;
        const totalFound = results.syncStats?.totalFound || 0;
        
        // Show toast with dismiss button
        if (newEmails === 0 && totalFound > 0) {
          toast.success("Gmail sync completed!", {
            description: `${totalFound} emails found, all already synced`,
            duration: 5000,
            action: {
              label: "Dismiss",
              onClick: () => toast.dismiss(),
            },
          });
        } else if (newEmails === 0) {
          toast.success("Gmail sync completed!", {
            description: `No new emails found`,
            duration: 5000,
            action: {
              label: "Dismiss",
              onClick: () => toast.dismiss(),
            },
          });
        } else {
          toast.success("Gmail sync completed!", {
            description: `${newEmails} emails processed, ${newTransactions} transactions added`,
            duration: 5000,
            action: {
              label: "Dismiss",
              onClick: () => toast.dismiss(),
            },
          });
        }
      }, 500);

      // Auto-hide progress bar after showing toast
      const hideTimer = setTimeout(() => {
        reset();
      }, 8000);
      
      return () => {
        clearTimeout(toastTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [results, reset]);

  const mythText = "a giant in Greek mythology with a hundred eyes, known for his role as an all-seeing guardian.";

  // Typewriter effect - faster and smoother
  useEffect(() => {
    if (showTooltip) {
      setDisplayedText("");
      setIsTypingComplete(false);
      let currentIndex = 0;
      const timer = setInterval(() => {
        if (currentIndex <= mythText.length) {
          setDisplayedText(mythText.slice(0, currentIndex));
          currentIndex++;
        } else {
          setIsTypingComplete(true);
          clearInterval(timer);
        }
      }, 15); // Very fast typing - 15ms intervals

      return () => clearInterval(timer);
    } else {
      setDisplayedText("");
      setIsTypingComplete(false);
    }
  }, [showTooltip, mythText]);

  return (
    <div className="mb-8">
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="relative flex-shrink-0">
            <Link 
              href="/" 
              className="flex items-center space-x-2 sm:space-x-4 hover:opacity-80 transition-opacity"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 relative">
                <Image
                  src="/cardImages/argusLogo.png"
                  alt="Argus Logo"
                  fill
                  className="object-contain"
                  priority={true}
                />
              </div>
              <div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">Argus</h1>
                  <div className="relative">
                    {/* Core 3D indicator */}
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full relative transform hover:scale-110 transition-transform duration-300">
                      {/* Base shadow for depth */}
                      <div className="absolute inset-0 rounded-full bg-green-600 blur-sm opacity-60"></div>
                      {/* Main body with gradient */}
                      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-green-400 via-green-500 to-green-600 shadow-lg animate-pulse">
                        {/* Highlight for 3D effect */}
                        <div className="absolute top-0.5 left-0.5 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gradient-to-br from-green-200 to-green-300 opacity-80"></div>
                        {/* Inner glow */}
                        <div className="absolute inset-0.5 rounded-full bg-green-400 opacity-50 animate-pulse" style={{animationDelay: '0.3s'}}></div>
                      </div>
                    </div>
                    
                    {/* Outer ping rings */}
                    <div className="absolute inset-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-green-400 animate-ping opacity-60"></div>
                    <div className="absolute inset-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-green-300 animate-ping opacity-40" style={{animationDelay: '0.7s'}}></div>
                    
                    {/* Subtle outer glow */}
                    <div className="absolute -inset-1 rounded-full bg-green-400 opacity-20 blur-md animate-pulse" style={{animationDelay: '1s'}}></div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Dictionary-Style Tooltip with Typewriter Effect */}
            <div className={`absolute top-full left-0 mt-4 z-50 w-80 max-w-md transform transition-all duration-300 ease-out ${
              showTooltip 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
            }`}>
              <div className="bg-popover rounded-lg shadow-xl border border-border p-5 backdrop-blur-sm font-serif text-popover-foreground">
                {/* Green Mythology Indicator */}
                <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-border">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <div className="text-green-600 dark:text-green-400 font-semibold text-xs tracking-wide uppercase">Mythology</div>
                </div>

                {/* Dictionary Entry Header */}
                <div className="mb-3">
                  <div className="flex items-baseline space-x-3">
                    <h3 className="text-2xl font-bold text-foreground">Argus</h3>
                    <span className="text-muted-foreground text-sm italic">/ˈɑːrɡəs/</span>
                  </div>
                  <div className="text-xs text-muted-foreground italic mt-1">noun • Greek mythology</div>
                </div>
                
                {/* Definition */}
                <div className="text-foreground leading-relaxed text-sm min-h-[2.5rem]">
                  <span className="font-medium">1.</span> <span className="transition-all duration-100 ease-out">{displayedText}</span>
                  {!isTypingComplete && (
                    <span className="inline-block w-0.5 h-4 bg-foreground ml-1 animate-pulse transition-opacity duration-150"></span>
                  )}
                </div>
                
                {/* All-Seeing Guardian */}
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" style={{animationDelay: '200ms'}}></div>
                      <div className="w-1 h-1 rounded-full bg-green-300 animate-pulse" style={{animationDelay: '400ms'}}></div>
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">All-Seeing Guardian</div>
                  </div>
                </div>
                
                {/* Arrow pointer */}
                <div className="absolute -top-2 left-8 w-4 h-4 bg-popover border-l border-t border-border transform rotate-45"></div>
              </div>
            </div>
          </div>
          
          {/* Navigation and Control Buttons */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden lg:flex items-center space-x-3">
              {/* Section 1: Navigation */}
              <div className="flex items-center space-x-3">
                {/* Transactions Button */}
                <Link href="/transactions">
                  <Button 
                    variant={pathname === "/transactions" ? "default" : "outline"} 
                    size="sm" 
                    className="flex items-center space-x-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Transactions</span>
                  </Button>
                </Link>

                {/* Splitwise Button */}
                <Link href="/splitwise">
                  <Button 
                    variant={pathname === "/splitwise" ? "default" : "outline"} 
                    size="sm" 
                    className="flex items-center space-x-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Splitwise</span>
                  </Button>
                </Link>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-border"></div>

              {/* Section 2: Actions */}
              <div className="flex items-center space-x-3">
                {/* Statements Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStatementsModal(true)}
                  className="flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Statements</span>
                </Button>

                {/* Sync Button */}
                <Button
                  variant={results ? "default" : "outline"}
                  size="sm"
                  onClick={handleSyncClick}
                  disabled={isRunning}
                  className={`flex items-center space-x-2 transition-all duration-200 ${
                    results 
                      ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200' 
                      : 'hover:bg-accent'
                  }`}
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span>
                    {isRunning ? 'Syncing...' : results ? 'Synced' : 'Sync'}
                  </span>
                </Button>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-border"></div>

              {/* Section 3: Settings */}
              <div className="flex items-center space-x-3">
                {/* Privacy Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrivacyToggle}
                  className="px-3 relative"
                  title={isPrivacyMode ? "Show money numbers" : "Hide money numbers"}
                >
                  <div className="flex items-center justify-between w-14">
                    <span className="text-sm font-medium text-muted-foreground">₹</span>
                    <Eye className={`h-4 w-4 transition-opacity ${isPrivacyMode ? 'opacity-30' : 'opacity-100 text-green-500'}`} />
                    <EyeOff className={`h-4 w-4 transition-opacity ${isPrivacyMode ? 'opacity-100 text-red-500' : 'opacity-30'}`} />
                  </div>
                </Button>

                {/* Theme Toggle */}
                <ThemeToggle />
              </div>
            </div>

            {/* Tablet Navigation - Show icons only for md to lg */}
            <div className="hidden md:flex lg:hidden items-center space-x-1">
              {/* Section 1: Navigation */}
              <div className="flex items-center space-x-1">
                {/* Transactions Button - Icon only */}
                <Link href="/transactions">
                  <Button 
                    variant={pathname === "/transactions" ? "default" : "outline"} 
                    size="sm" 
                    className="px-2"
                    title="Transactions"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </Link>

                {/* Splitwise Button - Icon only */}
                <Link href="/splitwise">
                  <Button 
                    variant={pathname === "/splitwise" ? "default" : "outline"} 
                    size="sm" 
                    className="px-2"
                    title="Splitwise"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-border mx-2"></div>

              {/* Section 2: Actions */}
              <div className="flex items-center space-x-1">
                {/* Statements Button - Icon only */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStatementsModal(true)}
                  className="px-2"
                  title="Statements"
                >
                  <FileText className="h-4 w-4" />
                </Button>

                {/* Sync Button - Icon only */}
                <Button
                  variant={results ? "default" : "outline"}
                  size="sm"
                  onClick={handleSyncClick}
                  disabled={isRunning}
                  className={`px-2 transition-all duration-200 ${
                    results 
                      ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200' 
                      : 'hover:bg-accent'
                  }`}
                  title={isRunning ? 'Syncing...' : results ? 'Synced' : 'Gmail Sync'}
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-border mx-2"></div>

              {/* Section 3: Settings */}
              <div className="flex items-center space-x-1">
                {/* Privacy Toggle - Icon only */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrivacyToggle}
                  className="px-3 relative"
                  title={isPrivacyMode ? "Show money numbers" : "Hide money numbers"}
                >
                  <div className="flex items-center justify-between w-14">
                    <span className="text-sm font-medium text-muted-foreground">₹</span>
                    <Eye className={`h-4 w-4 transition-opacity ${isPrivacyMode ? 'opacity-30' : 'opacity-100 text-green-500'}`} />
                    <EyeOff className={`h-4 w-4 transition-opacity ${isPrivacyMode ? 'opacity-100 text-red-500' : 'opacity-30'}`} />
                  </div>
                </Button>

                {/* Theme Toggle */}
                <ThemeToggle />
              </div>
            </div>

            {/* Mobile Navigation - Sheet menu for small screens */}
            <div className="flex md:hidden items-center space-x-1">
              {/* Privacy Toggle - Always visible on mobile */}
              <Button
                variant="outline"
                size="sm"
                onClick={onPrivacyToggle}
                className="px-3 relative"
                title={isPrivacyMode ? "Show money numbers" : "Hide money numbers"}
              >
                <div className="flex items-center justify-between w-14">
                  <span className="text-sm font-medium text-muted-foreground">₹</span>
                  <Eye className={`h-4 w-4 transition-opacity ${isPrivacyMode ? 'opacity-30' : 'opacity-100 text-green-500'}`} />
                  <EyeOff className={`h-4 w-4 transition-opacity ${isPrivacyMode ? 'opacity-100 text-red-500' : 'opacity-30'}`} />
                </div>
              </Button>

              {/* Dark Mode Toggle - Before hamburger menu */}
              <ThemeToggle />

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="px-2">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 p-0">
                  <SheetHeader className="p-6 pb-4">
                    <SheetTitle className="text-xl font-semibold">Navigation</SheetTitle>
                  </SheetHeader>
                  <div className="px-6 py-2">
                    <div className="flex flex-col space-y-4">
                      {/* Section 1: Main Navigation */}
                      <div className="space-y-3">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2">
                          Navigation
                        </div>
                        {/* Transactions */}
                        <Link href="/transactions" onClick={() => setMobileMenuOpen(false)}>
                          <Button 
                            variant={pathname === "/transactions" ? "default" : "ghost"} 
                            className="w-full justify-start h-12 px-4 text-base font-medium"
                          >
                            <BarChart3 className="h-5 w-5 mr-3" />
                            Transactions
                          </Button>
                        </Link>

                        {/* Splitwise */}
                        <Link href="/splitwise" onClick={() => setMobileMenuOpen(false)}>
                          <Button 
                            variant={pathname === "/splitwise" ? "default" : "ghost"} 
                            className="w-full justify-start h-12 px-4 text-base font-medium"
                          >
                            <Users className="h-5 w-5 mr-3" />
                            Splitwise
                          </Button>
                        </Link>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-border"></div>

                      {/* Section 2: Actions */}
                      <div className="space-y-3">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2">
                          Actions
                        </div>
                        {/* Statements */}
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowStatementsModal(true);
                            setMobileMenuOpen(false);
                          }}
                          className="w-full justify-start h-12 px-4 text-base font-medium"
                        >
                          <FileText className="h-5 w-5 mr-3" />
                          Statements
                        </Button>

                        {/* Gmail Sync */}
                        <Button
                          variant={results ? "default" : "ghost"}
                          onClick={() => {
                            handleSyncClick();
                            setMobileMenuOpen(false);
                          }}
                          disabled={isRunning}
                          className={`w-full justify-start h-12 px-4 text-base font-medium transition-all duration-200 ${
                            results 
                              ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200' 
                              : 'hover:bg-accent'
                          }`}
                        >
                          {isRunning ? (
                            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-5 w-5 mr-3" />
                          )}
                          {isRunning ? 'Syncing...' : results ? 'Synced' : 'Gmail Sync'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Statements Modal */}
      <StatementsModal 
        isOpen={showStatementsModal} 
        onOpenChange={setShowStatementsModal} 
      />

      {/* Gmail Sync Modal */}
      <GmailSyncModal 
        isOpen={showGmailSyncModal} 
        onOpenChange={setShowGmailSyncModal} 
        syncResults={results}
      />

      {/* Gmail Sync Progress Bar */}
      <GmailSyncProgressBar
        isVisible={isRunning || (steps.length > 0 && !steps.every(step => step.status === 'completed'))}
        currentStep={currentStep}
        steps={steps}
        onComplete={() => {
          console.log('🎉 Gmail sync completed!');
        }}
        onError={(error) => {
          console.error('❌ Gmail sync failed:', error);
        }}
      />
    </div>
  );
} 