
import { useState } from "react";
import { Circle, Check, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Habit } from "@/types";
import { cn } from "@/lib/utils";
import { calculateHabitStats, getHabitGoalDisplay, getFrequencyDisplay } from "@/utils/habitStats";
import { useToast } from "@/hooks/use-toast";

interface UnifiedHabitCardProps {
  habit: Habit;
  variant?: 'today' | 'habits';
  isPaused?: boolean;
  isArchived?: boolean;
  isFinished?: boolean;
  onClick?: (habit: Habit) => void;
}

type CompletionStatus = 'none' | 'done' | 'skipped';

export const UnifiedHabitCard = ({ 
  habit, 
  variant = 'today',
  isPaused = false, 
  isArchived = false, 
  isFinished = false,
  onClick
}: UnifiedHabitCardProps) => {
  const { habitCompletions, toggleHabitCompletion, markHabitSkipped } = useApp();
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  
  const stats = calculateHabitStats(habit, habitCompletions);
  const goalDisplay = getHabitGoalDisplay(habit);
  const frequencyDisplay = getFrequencyDisplay(habit);

  const completion = habitCompletions.find(c => c.habitId === habit.id && c.date === today);
  const currentStatus: CompletionStatus = 
    completion?.completed ? 'done' : 
    completion?.skipped ? 'skipped' : 'none';

  const handleToggle = () => {
    if (variant !== 'today') return;
    
    switch (currentStatus) {
      case 'none':
        toggleHabitCompletion(habit.id, today);
        toast({
          title: "Great job! 🎉",
          description: `${habit.name} completed for today`,
          duration: 2000,
        });
        break;
      case 'done':
        markHabitSkipped(habit.id, today);
        toast({
          title: "Habit skipped",
          description: `${habit.name} marked as skipped for today`,
          duration: 2000,
        });
        break;
      case 'skipped':
        // Reset to none
        markHabitSkipped(habit.id, today);
        break;
    }
  };

  const getToggleIcon = () => {
    switch (currentStatus) {
      case 'done':
        return <Check size={20} />;
      case 'skipped':
        return <X size={20} />;
      default:
        return <Circle size={20} />;
    }
  };

  const getToggleClass = () => {
    switch (currentStatus) {
      case 'done':
        return 'toggle-icon-done';
      case 'skipped':
        return 'toggle-icon-skipped';
      default:
        return 'toggle-icon-default';
    }
  };

  const getFrequencyPillClass = () => {
    switch (habit.frequency) {
      case 'daily':
        return 'frequency-pill-daily';
      case 'weekly':
        return 'frequency-pill-weekly';
      case 'custom':
        return 'frequency-pill-custom';
      case 'as-needed':
        return 'frequency-pill-as-needed';
      default:
        return 'frequency-pill-as-needed';
    }
  };

  const cardOpacity = isArchived ? "opacity-60" : isFinished ? "opacity-80" : "opacity-100";
  const hasGoal = habit.goalType && habit.goalTarget;

  const handleCardClick = () => {
    if (variant === 'habits' && onClick) {
      onClick(habit);
    }
  };

  const getProgressIndicatorText = () => {
    if (!hasGoal) {
      return {
        left: `${stats.totalDone} days done`,
        right: "No target set"
      };
    }

    let leftText = "";
    switch (habit.goalType) {
      case "consecutive-days":
        leftText = `${Math.min(stats.currentStreak, habit.goalTarget!)} of ${habit.goalTarget} days done`;
        break;
      case "number-of-times":
        leftText = `${Math.min(stats.totalDone, habit.goalTarget!)} of ${habit.goalTarget} times done`;
        break;
      case "by-specific-date":
        leftText = `${stats.totalDone} days done`;
        break;
      default:
        leftText = `${stats.totalDone} days done`;
    }

    return {
      left: leftText,
      right: `${stats.completionRate}%`
    };
  };

  const progressText = getProgressIndicatorText();

  return (
    <div className={cn("habit-card-compact flex flex-col", cardOpacity)} onClick={handleCardClick}>
      {/* Colored stripe on the left */}
      <div className={cn("w-1 absolute left-0 top-0 bottom-0 rounded-l-xl", `habit-stripe-${habit.color}`)} />
      
      {/* Row 1: Name + inline status label */}
      <div className="flex items-center gap-2 mb-1 min-w-0">
        <h3 className="font-semibold text-foreground text-base truncate min-w-0">{habit.name}</h3>
        {variant === 'habits' && isPaused && (
          <span className="flex-shrink-0 inline-block px-2 py-0.5 text-[10px] font-medium bg-yellow-50 text-yellow-600 rounded border border-yellow-200">
            PAUSED
          </span>
        )}
        {variant === 'habits' && isArchived && (
          <span className="flex-shrink-0 inline-block px-2 py-0.5 text-[10px] font-medium bg-gray-50 text-gray-500 rounded border border-gray-200">
            ARCHIVED
          </span>
        )}
        {variant === 'habits' && isFinished && (
          <span className="flex-shrink-0 inline-block px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-600 rounded border border-emerald-200">
            COMPLETED
          </span>
        )}
      </div>

      {/* Row 2: Description */}
      {habit.description && (
        <p className="text-sm text-muted-foreground mb-1 truncate">{habit.description}</p>
      )}

      {/* Row 3: Goal pill only */}
      <div className="mb-2">
        <span className={cn("goal-pill", goalDisplay.type === 'indefinite' && "indefinite")}>
          {goalDisplay.icon} {goalDisplay.text}
        </span>
      </div>

      {/* Row 4: Progress bar */}
      <div className="mb-2">
        <div className={hasGoal ? "progress-bar" : "progress-bar-indefinite"}>
          <div 
            className={hasGoal ? "progress-bar-fill" : "progress-bar-indefinite-fill"} 
            style={{ width: hasGoal ? `${stats.completionRate}%` : '0%' }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <div className="progress-indicator-left">
            {progressText.left}
          </div>
          <div className="progress-indicator-right">
            {progressText.right}
          </div>
        </div>
      </div>

      {/* Row 5: Stats + frequency bottom row */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="text-emerald-600 flex items-center gap-0.5">
          <Check size={12} /> {stats.totalDone}
        </span>
        <span className="flex items-center gap-0.5">
          <X size={12} /> {stats.totalSkipped}
        </span>
        <span className={cn("ml-auto", getFrequencyPillClass())}>
          {frequencyDisplay}
        </span>
        {variant === 'today' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            className={getToggleClass()}
          >
            {getToggleIcon()}
          </button>
        )}
      </div>
    </div>
  );
};
