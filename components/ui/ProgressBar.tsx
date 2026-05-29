import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  colorClass?: string;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  colorClass,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / (max || 1)) * 100));
  const auto =
    pct >= 90
      ? "bg-rose-500"
      : pct >= 70
        ? "bg-amber-400"
        : "bg-emerald-500";

  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          colorClass ?? auto
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
