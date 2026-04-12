import { Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { Habit } from "@/types";

interface CalendarHabitRowProps {
  habit: Habit;
  date: string;
  isFinished?: boolean;
  isGoalCompletionDay?: boolean;
  isOptional?: boolean;
}

export const CalendarHabitRow = ({ habit, date, isFinished, isGoalCompletionDay, isOptional }: CalendarHabitRowProps) => {
  const { habitCompletions, updateHabitCompletion } = useApp();
  const navigate = useNavigate();
  
  // Check if date is before habit's start date
  const isBeforeStartDate = habit.startDate && date < habit.startDate;
  
  const completion = habitCompletions.find(c => c.habitId === habit.id && c.date === date);
  const status = isBeforeStartDate ? 'not-started' : (completion?.completed ? 'done' : completion?.skipped ? 'skipped' : 'none');
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBeforeStartDate) return; // Can't toggle before start date
    
    // 3-state cycle: none -> done -> skipped -> none
    if (status === 'none') {
      updateHabitCompletion({ habitId: habit.id, date, completed: true, skipped: false });
    } else if (status === 'done') {
      updateHabitCompletion({ habitId: habit.id, date, completed: false, skipped: true });
    } else {
      updateHabitCompletion({ habitId: habit.id, date, completed: false, skipped: false });
    }
  };

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/habits?edit=${habit.id}`);
  };

  const getToggleIcon = () => {
    if (status === 'done') return <Check className="w-4 h-4 text-white" />;
    if (status === 'skipped') return <X className="w-4 h-4 text-amber-600" />;
    return null;
  };

  const getToggleStyles = () => {
    if (status === 'not-started') return "bg-muted border-2 border-border cursor-not-allowed";
    if (status === 'done') return "bg-emerald-500 border-2 border-emerald-500";
    if (status === 'skipped') return "bg-amber-100 dark:bg-amber-900/50 border-2 border-amber-500";
    return "bg-card border-2 border-border hover:border-primary";
  };

  return (
    <div className={cn(
      "rounded-xl overflow-hidden transition-colors",
      status === "not-started" && "bg-muted/60 border border-border opacity-50",
      status === "done" && "bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800",
      status === "skipped" && "bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
      status === "none" && "bg-card border border-border"
    )}>
      <div className="flex items-center">
        {/* Left accent bar */}
        <div className={cn("w-1 self-stretch", `bg-${habit.color}-400`)} />
        
        {/* Content */}
        <div className="flex-1 px-4 py-3 flex items-center gap-3">
          {/* Toggle */}
          <button 
            onClick={handleToggle} 
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0",
              getToggleStyles()
            )}
          >
            {getToggleIcon()}
          </button>
          
          {/* Clickable name */}
          <button
            onClick={handleNameClick}
            className={cn(
              "font-medium text-sm truncate flex-1 text-left hover:underline transition-colors cursor-pointer",
              status === "not-started" && "text-muted-foreground",
              status === "done" && "line-through text-muted-foreground hover:text-foreground",
              status === "skipped" && "text-muted-foreground hover:text-foreground",
              status === "none" && "text-foreground hover:text-primary"
            )}
          >
            {habit.name}
            {status === "not-started" && <span className="ml-2 text-xs text-muted-foreground">(not started)</span>}
          </button>

          {/* Goal reached badge */}
          {isGoalCompletionDay && (
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full shrink-0">
              🎉 Goal reached
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
