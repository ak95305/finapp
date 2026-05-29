"use client";

import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export function TopBar({ title, subtitle, left, right, className }: TopBarProps) {
  const { theme, toggle } = useTheme();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center justify-between px-4",
        "bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md",
        "border-b border-gray-100 dark:border-gray-900",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {left}
        <div className="min-w-0">
          {title && (
            <h1 className="text-[17px] font-bold text-gray-900 dark:text-gray-50 truncate leading-tight">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {right}
        <button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
