import { Habit, HabitCompletion } from "@/types";
import { cn } from "@/lib/utils";
import {
  calculateHabitStats,
  getFrequencyDisplay,
  getRecentCompletionDots,
} from "@/utils/habitStats";
import { format } from "date-fns";

interface HabitListCardProps {
  habit: Habit;
  completions: HabitCompletion[];
  status: 'active' | 'completed' | 'paused' | 'archived';
  onClick: () => void;
}

const getAccentColor = (status: HabitListCardProps['status']) => {
  switch (status) {
    case 'active': return 'bg-indigo-400';
    case 'completed': return 'bg-emerald-500';
    case 'paused': return 'bg-amber-500';
    case 'archived': return 'bg-slate-300';
  }
};

const getStatusBadge = (status: HabitListCardProps['status']) => {
  switch (status) {
    case 'completed':
      return <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Completed</span>;
    case 'paused':
      return <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Paused</span>;
    case 'archived':
      return <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Archived</span>;
    default:
      return null;
  }
};

const getFrequencyText = (habit: Habit): string => {
  return getFrequencyDisplay(habit).toLowerCase();
};

const getTargetMicrotext = (habit: Habit): string => {
  if (habit.goalType === "consecutive-days" && habit.goalTarget) {
    return `${habit.goalTarget}×`;
  } else if (habit.goalType === "number-of-times" && habit.goalTarget) {
    return `${habit.goalTarget}×`;
  } else if (habit.goalType === "by-specific-date" && habit.targetDate) {
    return `by ${format(new Date(habit.targetDate), "MMM d, yyyy").toLowerCase()}`;
  }
  return "indefinite";
};

const getProgressData = (habit: Habit, stats: ReturnType<typeof calculateHabitStats>) => {
  if (!habit.goalType || !habit.goalTarget) {
    return null;
  }
  
  switch (habit.goalType) {
    case "consecutive-days":
      return {
        current: stats.currentStreak,
        total: habit.goalTarget,
        percentage: Math.min((stats.currentStreak / habit.goalTarget) * 100, 100)
      };
    case "number-of-times":
      return {
        current: stats.totalDone,
        total: habit.goalTarget,
        percentage: Math.min((stats.totalDone / habit.goalTarget) * 100, 100)
      };
    case "by-specific-date":
      if (habit.targetDate && habit.createdAt) {
        const created = new Date(habit.createdAt).getTime();
        const target = new Date(habit.targetDate).getTime();
        const now = Date.now();
        const elapsed = now - created;
        const total = target - created;
        if (total > 0) {
          return {
            current: Math.floor(elapsed / (1000 * 60 * 60 * 24)),
            total: Math.floor(total / (1000 * 60 * 60 * 24)),
            percentage: Math.min((elapsed / total) * 100, 100)
          };
        }
      }
      return null;
    default:
      return null;
  }
};

export const HabitListCard = ({ habit, completions, status, onClick }: HabitListCardProps) => {
  const stats = calculateHabitStats(habit, completions);
  const frequencyText = getFrequencyText(habit);
  const targetMicrotext = getTargetMicrotext(habit);
  const progressData = getProgressData(habit, stats);
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow",
        status === 'archived' 
          ? "bg-muted border border-border" 
          : "bg-card border border-border"
      )}
    >
      <div className="flex">
        {/* Left accent bar */}
        <div className={cn("w-1 flex-shrink-0 self-stretch", getAccentColor(status))} />
        
        {/* Content */}
        <div className="flex-1 p-4 space-y-2">
          {/* Row 1: Name + Status Badge + Target Microtext */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className={cn(
                "font-semibold truncate min-w-0",
                status === 'archived' ? "text-muted-foreground" : "text-foreground"
              )}>
                {habit.name}
              </h3>
              <div className="flex-shrink-0">
                {getStatusBadge(status)}
              </div>
            </div>
            <span className="text-sm text-muted-foreground flex-shrink-0">{targetMicrotext}</span>
          </div>
          
          {/* Row 3: Progress Bar */}
          {progressData && (
            <div className="space-y-1">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${progressData.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {Math.min(progressData.current, progressData.total)} of {progressData.total} {habit.goalType === "number-of-times" ? "times" : "days"}
                </span>
                <span className="text-muted-foreground">{Math.round(progressData.percentage)}%</span>
              </div>
            </div>
          )}
          
          {/* Completion dots for by-specific-date */}
          {habit.goalType === "by-specific-date" && (() => {
            const dots = getRecentCompletionDots(habit.id, completions);
            const doneCount = dots.filter(Boolean).length;
            return (
              <div className="space-y-1 pt-0.5">
                <div className="flex gap-0.5 flex-wrap">
                  {dots.map((done, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        done ? "bg-emerald-500" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{doneCount} of last 14 days done</p>
              </div>
            );
          })()}

          {/* Row 4: Stats + frequency */}
          <div className="flex items-center gap-4 text-sm border-t border-border pt-2 mt-2">
            <span className="text-emerald-600 dark:text-emerald-400">✓ {stats.totalDone}</span>
            <span className="text-muted-foreground">✗ {stats.totalSkipped}</span>
            <span className="ml-auto text-xs text-muted-foreground">{frequencyText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
