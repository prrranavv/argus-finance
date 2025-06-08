'use client';

import { Button } from "@/components/ui/button";
import { StatementsModal } from "@/components/statements-modal";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, FileText, BarChart3, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface HeaderProps {
  isPrivacyMode: boolean;
  onPrivacyToggle: () => void;
  subtitle?: string;
}

export function Header({ isPrivacyMode, onPrivacyToggle, subtitle }: HeaderProps) {
  const [showStatementsModal, setShowStatementsModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const pathname = usePathname();

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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="relative">
            <Link 
              href="/" 
              className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
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
              </div>
            </Link>

            {/* Dictionary-Style Tooltip with Typewriter Effect */}
            <div className={`absolute top-full left-0 mt-4 z-50 w-80 max-w-md transform transition-all duration-300 ease-out ${
              showTooltip 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
            }`}>
              <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-5 backdrop-blur-sm font-serif">
                {/* Green Mythology Indicator */}
                <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <div className="text-green-600 font-semibold text-xs tracking-wide uppercase">Mythology</div>
                </div>

                {/* Dictionary Entry Header */}
                <div className="mb-3">
                  <div className="flex items-baseline space-x-3">
                    <h3 className="text-2xl font-bold text-gray-900">Argus</h3>
                    <span className="text-gray-500 text-sm italic">/ˈɑːrɡəs/</span>
                  </div>
                  <div className="text-xs text-gray-600 italic mt-1">noun • Greek mythology</div>
                </div>
                
                {/* Definition */}
                <div className="text-gray-800 leading-relaxed text-sm min-h-[2.5rem]">
                  <span className="font-medium">1.</span> <span className="transition-all duration-100 ease-out">{displayedText}</span>
                  {!isTypingComplete && (
                    <span className="inline-block w-0.5 h-4 bg-gray-800 ml-1 animate-pulse transition-opacity duration-150"></span>
                  )}
                </div>
                
                {/* All-Seeing Guardian */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" style={{animationDelay: '200ms'}}></div>
                      <div className="w-1 h-1 rounded-full bg-green-300 animate-pulse" style={{animationDelay: '400ms'}}></div>
                    </div>
                    <div className="text-xs text-gray-500 font-medium">All-Seeing Guardian</div>
                  </div>
                </div>
                
                {/* Arrow pointer */}
                <div className="absolute -top-2 left-8 w-4 h-4 bg-white border-l border-t border-gray-300 transform rotate-45"></div>
              </div>
            </div>
          </div>
          
          {/* Navigation and Control Buttons */}
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

            {/* Privacy Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={onPrivacyToggle}
              className="flex items-center space-x-2"
            >
              {isPrivacyMode ? (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Show Numbers</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>Hide Numbers</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Statements Modal */}
      <StatementsModal 
        isOpen={showStatementsModal} 
        onOpenChange={setShowStatementsModal} 
      />
    </div>
  );
} 