
import { Habit, HabitCompletion } from "@/types";
import { parseLocalDate } from "@/lib/habitSchedule";

export interface HabitStats {
  completionRate: number;
  currentStreak: number;
  totalDone: number;
  totalSkipped: number;
  daysLeft?: number;
  timesLeft?: number;
  totalTarget?: number;
}

const calculateConsecutiveStreak = (completions: HabitCompletion[]): number => {
  if (completions.length === 0) return 0;
  
  // Get completed dates only, sorted descending (most recent first)
  const completedDates = completions
    .filter(c => c.completed)
    .map(c => c.date)
    .sort((a, b) => b.localeCompare(a));
  
  if (completedDates.length === 0) return 0;
  
  // Remove duplicates (in case of multiple completions on same day)
  const uniqueDates = [...new Set(completedDates)];
  
  let streak = 1; // Start with 1 for the most recent day
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i - 1]);
    const previousDate = new Date(uniqueDates[i]);
    
    // Calculate difference in days
    const diffInMs = currentDate.getTime() - previousDate.getTime();
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 1) {
      streak++;
    } else {
      break; // Gap found, stop counting
    }
  }
  
  return streak;
};

export const calculateHabitStats = (habit: Habit, completions: HabitCompletion[]): HabitStats => {
  const habitCompletions = completions.filter(c => c.habitId === habit.id);
  
  const totalDone = habitCompletions.filter(c => c.completed).length;
  const totalSkipped = habitCompletions.filter(c => c.skipped).length;
  const currentStreak = calculateConsecutiveStreak(habitCompletions);
  
  // For habits without goals, return basic stats with 0% completion
  if (!habit.goalType || !habit.goalTarget) {
    return { 
      completionRate: 0, 
      currentStreak,
      totalDone,
      totalSkipped,
      totalTarget: 0
    };
  }

  let completionRate = 0;
  let daysLeft: number | undefined;
  let timesLeft: number | undefined;
  const totalTarget = habit.goalTarget;

  switch (habit.goalType) {
    case "consecutive-days":
      // Progress = current consecutive streak / goal target
      completionRate = Math.min(Math.round((currentStreak / habit.goalTarget) * 100), 100);
      daysLeft = Math.max(0, habit.goalTarget - currentStreak);
      break;
      
    case "number-of-times":
      // Progress = total unique completion days / goal target
      completionRate = Math.min(Math.round((totalDone / habit.goalTarget) * 100), 100);
      timesLeft = Math.max(0, habit.goalTarget - totalDone);
      break;
      
    case "by-specific-date":
      if (habit.targetDate) {
        const startDate = habit.startDate
          ? parseLocalDate(habit.startDate)
          : new Date(habit.createdAt);
        const targetDate = parseLocalDate(habit.targetDate);
        const today = new Date();
        const totalDays = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const daysRemaining = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        completionRate = Math.min(Math.round((daysPassed / totalDays) * 100), 100);
        daysLeft = Math.max(0, daysRemaining);
      }
      break;
      
    default:
      completionRate = 0;
  }

  return { 
    completionRate, 
    currentStreak,
    totalDone,
    totalSkipped,
    daysLeft,
    timesLeft,
    totalTarget
  };
};

export const getHabitGoalDisplay = (habit: Habit): { text: string; icon: string; type: 'goal' | 'indefinite' } => {
  if (!habit.goalType || !habit.goalTarget) {
    return { text: "Indefinite", icon: "∞", type: "indefinite" };
  }

  switch (habit.goalType) {
    case "consecutive-days":
      return { text: `${habit.goalTarget} days`, icon: "🔁", type: "goal" };
    case "number-of-times":
      const period = habit.goalPeriod === "total" ? "" : habit.goalPeriod === "per-month" ? "/month" : "/week";
      return { text: `${habit.goalTarget}x${period}`, icon: "🎯", type: "goal" };
    case "by-specific-date":
      if (habit.targetDate) {
        return { text: `by ${new Date(habit.targetDate).toLocaleDateString('en-GB')}`, icon: "⏱", type: "goal" };
      }
      return { text: "No date set", icon: "⏱", type: "goal" };
    default:
      return { text: "Indefinite", icon: "∞", type: "indefinite" };
  }
};

export const getFrequencyDisplay = (habit: Habit): string => {
  switch (habit.frequency) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "as-needed":
      return "As Needed";
    case "custom":
      return `Every ${habit.customInterval || 1} days`;
    default:
      return "Unknown";
  }
};

export const isHabitFinished = (habit: Habit, completions: HabitCompletion[]): boolean => {
  if (!habit.goalType || !habit.goalTarget) return false;
  
  const stats = calculateHabitStats(habit, completions);
  return stats.completionRate >= 100;
};

export const getCompletionIndicator = (habit: Habit, stats: HabitStats): { text: string; className: string } | null => {
  if (!habit.goalType || !habit.goalTarget) return null;
  
  switch (habit.goalType) {
    case "consecutive-days":
      if (stats.daysLeft !== undefined) {
        return {
          text: `${stats.daysLeft} days left`,
          className: "completion-indicator-days"
        };
      }
      break;
    case "number-of-times":
      if (stats.timesLeft !== undefined) {
        return {
          text: `${stats.timesLeft} times left`,
          className: "completion-indicator-times"
        };
      }
      break;
    case "by-specific-date":
      if (stats.daysLeft !== undefined) {
        return {
          text: `${stats.daysLeft} days left`,
          className: "completion-indicator-date"
        };
      }
      break;
  }
  
  return null;
};

// Format compact microtext for habit progress (e.g., "3/30", "12x", "∞")
export const formatHabitMicrotext = (habit: Habit, stats: HabitStats): string => {
  if (!habit.goalType || !habit.goalTarget) {
    return "∞";
  }

  switch (habit.goalType) {
    case "consecutive-days":
      return `${stats.currentStreak}/${habit.goalTarget}`;
    case "number-of-times":
      return `${stats.totalDone}/${habit.goalTarget}`;
    case "by-specific-date":
      if (habit.targetDate) {
        const date = new Date(habit.targetDate);
        return `by ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
      }
      return "∞";
    default:
      return "∞";
  }
};

// Format human-readable details line for habit (e.g., "Daily • 3 of 30 days done")
export const formatHabitDetailsLine = (habit: Habit, stats: HabitStats): string => {
  const parts: string[] = [];
  
  // Frequency part
  switch (habit.frequency) {
    case "daily":
      parts.push("Daily");
      break;
    case "weekly":
      if (habit.weeklyDays && habit.weeklyDays.length > 0) {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const days = habit.weeklyDays.map(d => dayNames[d]).join(", ");
        parts.push(days);
      } else {
        parts.push("Weekly");
      }
      break;
    case "custom":
      parts.push(`Every ${habit.customInterval || 1} days`);
      break;
    case "as-needed":
      parts.push("As needed");
      break;
  }
  
  // Goal part
  if (!habit.goalType || !habit.goalTarget) {
    parts.push("indefinite");
  } else {
    switch (habit.goalType) {
      case "consecutive-days":
        parts.push(`${stats.currentStreak} of ${habit.goalTarget} days streak`);
        break;
      case "number-of-times":
        const period = habit.goalPeriod === "total" ? "" : habit.goalPeriod === "per-month" ? "/month" : "/week";
        parts.push(`${stats.totalDone} of ${habit.goalTarget}${period} done`);
        break;
    case "by-specific-date":
      // Don't repeat target date here - microtext already shows "by <date>"
      if (stats.daysLeft !== undefined && stats.daysLeft > 0) {
        parts.push(`${stats.daysLeft} days remaining`);
      } else if (stats.daysLeft === 0) {
        parts.push("due today");
      }
      break;
    }
  }
  
  return parts.join(" • ");
};

// Get the date when a habit reached its goal (for "Goal reached" badge)
export const getGoalCompletionDate = (habit: Habit, completions: HabitCompletion[]): string | null => {
  if (!habit.goalType || !habit.goalTarget) return null;
  
  const habitCompletions = completions
    .filter(c => c.habitId === habit.id && c.completed)
    .sort((a, b) => a.date.localeCompare(b.date)); // Sort ascending (oldest first)
  
  if (habit.goalType === "number-of-times") {
    // The Nth completion is when the goal was reached
    if (habitCompletions.length >= habit.goalTarget) {
      return habitCompletions[habit.goalTarget - 1].date;
    }
  }
  
  if (habit.goalType === "consecutive-days") {
    // Find when the streak first hit the target
    // We need to find a sequence of consecutive days that equals the target
    if (habitCompletions.length < habit.goalTarget) return null;
    
    let streak = 1;
    for (let i = 1; i < habitCompletions.length; i++) {
      const prevDate = new Date(habitCompletions[i - 1].date);
      const currDate = new Date(habitCompletions[i].date);
      const diffInMs = currDate.getTime() - prevDate.getTime();
      const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 1) {
        streak++;
        if (streak >= habit.goalTarget) {
          return habitCompletions[i].date;
        }
      } else {
        streak = 1;
      }
    }
  }
  
  if (habit.goalType === "by-specific-date" && habit.targetDate) {
    // Goal is reached if completed on or before target date
    const targetDate = habit.targetDate;
    const completedOnOrBefore = habitCompletions.find(c => c.date <= targetDate);
    if (completedOnOrBefore) {
      // Return the target date as the "completion" date
      return targetDate;
    }
  }
  
  return null;
};

