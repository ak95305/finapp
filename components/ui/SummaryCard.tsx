import { cn } from "@/lib/utils";
import { formatMoneyCompact } from "@/lib/calculations";

interface SummaryCardProps {
  label: string;
  amount: number;
  icon: string;
  colorClass: string;
  bgClass: string;
}

export function SummaryCard({
  label,
  amount,
  icon,
  colorClass,
  bgClass,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
      <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl text-lg mb-3", bgClass)}>
        {icon}
      </div>
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
      <p className={cn("text-lg font-bold tabular-nums", colorClass)}>
        {formatMoneyCompact(amount)}
      </p>
    </div>
  );
}
