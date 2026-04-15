// src/components/AllDoneCard.tsx
import { Flame } from "lucide-react";

interface AllDoneCardProps {
  streak: number;
  tomorrowCount: number;
}

export const AllDoneCard = ({ streak, tomorrowCount }: AllDoneCardProps) => {
  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm p-6 text-center space-y-3">
      <div className="text-4xl">✓</div>
      <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
        All done for today
      </h3>
      {streak > 0 && (
        <div className="flex items-center justify-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
          <Flame size={16} className="text-orange-500" />
          <span>{streak}-day streak</span>
        </div>
      )}
      {tomorrowCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {tomorrowCount} habit{tomorrowCount !== 1 ? "s" : ""} scheduled for tomorrow
        </p>
      )}
    </div>
  );
};
