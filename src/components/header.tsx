'use client';

import { Button } from "@/components/ui/button";
import { StatementsModal } from "@/components/statements-modal";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, FileText, BarChart3 } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

interface HeaderProps {
  isPrivacyMode: boolean;
  onPrivacyToggle: () => void;
  subtitle?: string;
}

export function Header({ isPrivacyMode, onPrivacyToggle, subtitle }: HeaderProps) {
  const [showStatementsModal, setShowStatementsModal] = useState(false);
  const pathname = usePathname();

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
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