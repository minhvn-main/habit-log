
import { useState } from "react";
import { Circle, Check, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Habit } from "@/types";
import { cn } from "@/lib/utils";
import { calculateHabitStats, getHabitGoalDisplay, getFrequencyDisplay, getCompletionIndicator } from "@/utils/habitStats";
import { useToast } from "@/hooks/use-toast";

interface CompactHabitCardProps {
  habit: Habit;
}

type CompletionStatus = 'none' | 'done' | 'skipped';

export const CompactHabitCard = ({ habit }: CompactHabitCardProps) => {
  const { habitCompletions, toggleHabitCompletion, markHabitSkipped } = useApp();
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  
  const stats = calculateHabitStats(habit, habitCompletions);
  const goalDisplay = getHabitGoalDisplay(habit);
  const frequencyDisplay = getFrequencyDisplay(habit);
  const completionIndicator = getCompletionIndicator(habit, stats);

  const completion = habitCompletions.find(c => c.habitId === habit.id && c.date === today);
  const currentStatus: CompletionStatus = 
    completion?.completed ? 'done' : 
    completion?.skipped ? 'skipped' : 'none';

  const handleToggle = () => {
    switch (currentStatus) {
      case 'none':
        // none -> done
        toggleHabitCompletion(habit.id, today);
        toast({
          title: "Great job! 🎉",
          description: `${habit.name} completed for today`,
          duration: 2000,
        });
        break;
      case 'done':
        // done -> skipped
        markHabitSkipped(habit.id, today);
        toast({
          title: "Habit skipped",
          description: `${habit.name} marked as skipped for today`,
          duration: 2000,
        });
        break;
      case 'skipped':
        // skipped -> none (reset)
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

  const showProgressBar = habit.goalType && habit.goalTarget;

  return (
    <div className="habit-card-compact flex">
      {/* Colored stripe on the left */}
      <div className={cn("w-1 absolute left-0 top-0 bottom-0 rounded-l-xl", `habit-stripe-${habit.color}`)} />
      
      {/* Left content area - takes most space */}
      <div className="flex-1 pr-3">
        {/* Row 1: Habit name */}
        <div className="mb-2">
          <h3 className="font-semibold text-foreground text-base">{habit.name}</h3>
        </div>

        {/* Row 2: Description (if exists) */}
        {habit.description && (
          <div className="mb-2">
            <p className="text-sm text-muted-foreground">{habit.description}</p>
          </div>
        )}

        {/* Row 3: Goal & Frequency with distinct styling */}
        <div className="flex items-center gap-2 mb-3">
          <span className={cn(
            "goal-pill",
            goalDisplay.type === 'indefinite' && "indefinite"
          )}>
            {goalDisplay.icon} {goalDisplay.text}
          </span>
          <span className={getFrequencyPillClass()}>
            {frequencyDisplay}
          </span>
        </div>

        {/* Row 4: Progress Bar */}
        {showProgressBar ? (
          <div className="pr-4 mb-2">
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <div className="text-xs text-muted-foreground">
                {completionIndicator && (
                  <span className={cn("completion-indicator", completionIndicator.className)}>
                    {completionIndicator.text}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.completionRate}%
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg py-2 text-center mb-2">
            <span className="text-xs font-medium text-muted-foreground">∞ No target set</span>
          </div>
        )}
      </div>

      {/* Right toggle area - fixed size */}
      <div className="w-16 flex items-stretch">
        <button
          onClick={handleToggle}
          className={getToggleClass()}
        >
          {getToggleIcon()}
        </button>
      </div>
    </div>
  );
};
