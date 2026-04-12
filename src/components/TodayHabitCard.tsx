import { Check, X } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Habit } from "@/types";
import { calculateHabitStats, getFrequencyDisplay } from "@/utils/habitStats";
import { cn } from "@/lib/utils";

interface TodayHabitCardProps {
  habit: Habit;
  enableSkipState?: boolean;
}

const getTargetMicrotext = (habit: Habit): string => {
  if (habit.goalType === "consecutive-days" && habit.goalTarget) {
    return `${habit.goalTarget}×`;
  } else if (habit.goalType === "number-of-times" && habit.goalTarget) {
    return `${habit.goalTarget}×`;
  } else if (habit.goalType === "by-specific-date" && habit.targetDate) {
    return `by ${format(new Date(habit.targetDate), "MMM d").toLowerCase()}`;
  }
  return "indefinite";
};

const getFrequencyText = (habit: Habit): string => {
  return getFrequencyDisplay(habit).toLowerCase();
};

export const TodayHabitCard = ({ habit, enableSkipState = true }: TodayHabitCardProps) => {
  const { habitCompletions, toggleHabitCompletion, markHabitSkipped, updateHabitCompletion } = useApp();
  const navigate = useNavigate();
  
  const today = format(new Date(), "yyyy-MM-dd");
  const todayCompletion = habitCompletions.find(
    c => c.habitId === habit.id && c.date === today
  );
  
  const isCompleted = todayCompletion?.completed || false;
  const isSkipped = todayCompletion?.skipped || false;
  
  const stats = calculateHabitStats(habit, habitCompletions);
  const targetMicrotext = getTargetMicrotext(habit);
  const frequencyText = getFrequencyText(habit);

  // Get progress bar data
  const getProgressData = () => {
    if (!habit.goalType || !habit.goalTarget) {
      return null;
    }
    
    switch (habit.goalType) {
      case "consecutive-days":
        return {
          percentage: Math.min((stats.currentStreak / habit.goalTarget) * 100, 100),
          contextText: `${stats.currentStreak} of ${habit.goalTarget} days`
        };
      case "number-of-times":
        return {
          percentage: Math.min((stats.totalDone / habit.goalTarget) * 100, 100),
          contextText: `${stats.totalDone} of ${habit.goalTarget} times`
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
              percentage: Math.min((elapsed / total) * 100, 100),
              contextText: `${stats.totalDone} of ${habit.goalTarget} days`
            };
          }
        }
        return null;
      default:
        return null;
    }
  };

  const progressData = getProgressData();

  // Toggle cycle logic
  const handleToggleCycle = () => {
    if (enableSkipState) {
      // 3-state: none → completed → skipped → none
      if (!isCompleted && !isSkipped) {
        toggleHabitCompletion(habit.id, today);
      } else if (isCompleted) {
        markHabitSkipped(habit.id, today);
      } else {
        updateHabitCompletion({ habitId: habit.id, date: today, completed: false, skipped: false });
      }
    } else {
      // 2-state: none → completed → none
      toggleHabitCompletion(habit.id, today);
    }
  };

  const getToggleState = () => {
    if (isCompleted) return "done";
    if (isSkipped && enableSkipState) return "skipped";
    return "default";
  };

  const toggleState = getToggleState();

  // Accent bar color based on toggle state
  const getAccentColor = () => {
    if (toggleState === "done") return "bg-emerald-500";
    if (toggleState === "skipped") return "bg-amber-500";
    return "bg-indigo-400";
  };

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/habits?edit=${habit.id}`);
  };

  return (
    <div
      className={cn(
        "rounded-2xl shadow-sm overflow-hidden transition-colors",
        toggleState === "done" && "bg-emerald-50/40 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/60 opacity-75",
        toggleState === "skipped" && "bg-amber-50/40 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
        toggleState === "default" && "bg-card border border-border"
      )}
    >
      <div className="flex">
        {/* Left accent bar */}
        <div className={cn("w-1 flex-shrink-0 self-stretch", getAccentColor())} />
        
        {/* Content */}
        <div className="flex-1 p-4 space-y-2">
          {/* Row 1: Toggle + Name + Target Microtext */}
          <div className="flex items-center gap-3">
            {/* Toggle Circle */}
            <button
              onClick={handleToggleCycle}
              className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                toggleState === "default" && "border-muted-foreground/40 text-muted-foreground ring-2 ring-muted/40 hover:border-primary hover:ring-primary/30 active:ring-4 active:ring-primary/20",
                toggleState === "done" && "border-emerald-500 bg-emerald-500 text-white hover:ring-2 hover:ring-emerald-200 dark:hover:ring-emerald-800",
                toggleState === "skipped" && "border-amber-500 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 hover:ring-2 hover:ring-amber-200 dark:hover:ring-amber-800"
              )}
            >
              {toggleState === "done" && <Check size={16} strokeWidth={3} />}
              {toggleState === "skipped" && <X size={14} strokeWidth={3} />}
            </button>

            {/* Habit Name - Clickable */}
            <button
              onClick={handleNameClick}
              className={cn(
                "font-semibold truncate flex-1 text-left hover:underline transition-colors cursor-pointer",
                toggleState === "done" && "line-through text-muted-foreground hover:text-foreground",
                toggleState === "skipped" && "text-muted-foreground hover:text-foreground",
                toggleState === "default" && "text-foreground hover:text-primary"
              )}
            >
              {habit.name}
            </button>

            {/* Target Microtext */}
            <span className="text-sm text-muted-foreground flex-shrink-0">
              {targetMicrotext}
            </span>
          </div>

          {/* Row 2: Frequency only */}
          <p className="text-sm text-muted-foreground pl-10">{frequencyText}</p>

          {/* Row 3: Progress Bar with micro context */}
          {progressData && (
            <div className="pl-10 pt-1 space-y-1">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${progressData.percentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">{progressData.contextText}</p>
                <p className="text-xs text-muted-foreground">{Math.round(progressData.percentage)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
