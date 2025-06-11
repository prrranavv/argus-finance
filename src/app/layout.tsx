import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthWrapper } from "@/components/auth-wrapper";
import { ThemeProvider } from "next-themes";


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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthWrapper>
            <main className="min-h-screen bg-background text-foreground">
              {children}
            </main>

          </AuthWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
