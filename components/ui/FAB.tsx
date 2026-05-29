"use client";

import { cn } from "@/lib/utils";

interface FABProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

export function FAB({ onClick, icon, label, className }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label ?? "Add"}
      style={{ right: "max(1rem, calc((100vw - 430px) / 2 + 1rem))" }}
      className={cn(
        "fixed bottom-20 z-40",
        "flex items-center gap-2 rounded-2xl shadow-lg shadow-blue-500/25",
        "bg-blue-600 text-white",
        "active:scale-95 transition-transform",
        "h-14",
        label ? "px-5" : "w-14",
        className
      )}
    >
      {icon ?? (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      )}
      {label && <span className="text-sm font-semibold">{label}</span>}
    </button>
  );
}
