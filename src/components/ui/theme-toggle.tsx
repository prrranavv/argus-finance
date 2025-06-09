"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="px-3 relative">
        <div className="flex items-center justify-between w-10">
          <Sun className="h-4 w-4 opacity-50" />
          <Moon className="h-4 w-4 opacity-50" />
        </div>
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="px-3 relative"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="flex items-center justify-between w-10">
        <Sun className={`h-4 w-4 transition-opacity ${isDark ? 'opacity-30' : 'opacity-100 text-yellow-500'}`} />
        <Moon className={`h-4 w-4 transition-opacity ${isDark ? 'opacity-100 text-blue-400' : 'opacity-30'}`} />
      </div>
    </Button>
  );
} 