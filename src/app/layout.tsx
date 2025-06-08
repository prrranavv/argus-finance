import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { AuthWrapper } from "@/components/auth-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Argus - AI-Powered Financial Intelligence",
  description: "Take control of your finances with Argus. AI-powered transaction analysis, beautiful 3D card visualization, and privacy-first local storage. Transform your bank statements into actionable insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AuthWrapper>
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
          </AuthWrapper>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
