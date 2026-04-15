import { Habit, HabitCompletion, Goal, Milestone } from "@/types";
import { format, subDays, startOfWeek, endOfWeek, subWeeks, isWeekend, getDay } from "date-fns";
import { isHabitDueOnDate } from "@/lib/habitSchedule";

// Calculate completion rate for a date range
export const calculateWeekCompletionRate = (
  habits: Habit[],
  completions: HabitCompletion[],
  weekStart: Date,
  weekEnd: Date
): number => {
  let totalDue = 0;
  let totalCompleted = 0;

  const activeHabits = habits.filter(h => h.isActive && !h.archivedAt && !h.isPaused);

  for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
    const dateStr = format(d, "yyyy-MM-dd");
    
    for (const habit of activeHabits) {
      if (isHabitDueOnDate(habit, new Date(d))) {
        totalDue++;
        const completion = completions.find(
          c => c.habitId === habit.id && c.date === dateStr && c.completed
        );
        if (completion) totalCompleted++;
      }
    }
  }

  return totalDue > 0 ? Math.round((totalCompleted / totalDue) * 100) : 0;
};

// Compare this week vs last week
export const calculateWeekOverWeekChange = (
  habits: Habit[],
  completions: HabitCompletion[]
): { thisWeek: number; lastWeek: number; change: number } => {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = new Date(Math.min(now.getTime(), endOfWeek(now, { weekStartsOn: 1 }).getTime()));
  
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const thisWeek = calculateWeekCompletionRate(habits, completions, thisWeekStart, thisWeekEnd);
  const lastWeek = calculateWeekCompletionRate(habits, completions, lastWeekStart, lastWeekEnd);

  return {
    thisWeek,
    lastWeek,
    change: thisWeek - lastWeek,
  };
};

// Calculate current streak
export const calculateCurrentStreak = (
  habits: Habit[],
  completions: HabitCompletion[]
): number => {
  let streak = 0;
  const activeHabits = habits.filter(h => h.isActive && !h.archivedAt && !h.isPaused);
  
  for (let i = 0; i < 365; i++) {
    const checkDate = subDays(new Date(), i);
    const dateStr = format(checkDate, "yyyy-MM-dd");
    
    let dueCount = 0;
    let completedCount = 0;
    
    for (const habit of activeHabits) {
      if (isHabitDueOnDate(habit, checkDate)) {
        dueCount++;
        const completion = completions.find(
          c => c.habitId === habit.id && c.date === dateStr && c.completed
        );
        if (completion) completedCount++;
      }
    }
    
    // Skip days with no habits due
    if (dueCount === 0) continue;
    
    // If at least 50% completed, count as streak day
    if (completedCount / dueCount >= 0.5) {
      streak++;
    } else if (i > 0) {
      // Don't break on today (i=0), only on past days
      break;
    }
  }
  
  return streak;
};

// Get daily completion rates for chart
export const getDailyCompletionRates = (
  habits: Habit[],
  completions: HabitCompletion[],
  days: number = 7
): { date: string; percentage: number; dayName: string; isWeekend: boolean }[] => {
  const result: { date: string; percentage: number; dayName: string; isWeekend: boolean }[] = [];
  const activeHabits = habits.filter(h => h.isActive && !h.archivedAt && !h.isPaused);

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, "yyyy-MM-dd");
    
    let dueCount = 0;
    let completedCount = 0;
    
    for (const habit of activeHabits) {
      if (isHabitDueOnDate(habit, date)) {
        dueCount++;
        const completion = completions.find(
          c => c.habitId === habit.id && c.date === dateStr && c.completed
        );
        if (completion) completedCount++;
      }
    }
    
    result.push({
      date: dateStr,
      percentage: dueCount > 0 ? Math.round((completedCount / dueCount) * 100) : 0,
      dayName: format(date, "EEE"),
      isWeekend: isWeekend(date),
    });
  }
  
  return result;
};

// Find most consistent habit this week
export const getMostConsistentHabit = (
  habits: Habit[],
  completions: HabitCompletion[]
): { habit: Habit; rate: number } | null => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const now = new Date();
  const activeHabits = habits.filter(h => h.isActive && !h.archivedAt && !h.isPaused);

  let best: { habit: Habit; rate: number } | null = null;

  for (const habit of activeHabits) {
    let dueCount = 0;
    let completedCount = 0;

    for (let d = new Date(weekStart); d <= now; d.setDate(d.getDate() + 1)) {
      if (isHabitDueOnDate(habit, new Date(d))) {
        dueCount++;
        const dateStr = format(d, "yyyy-MM-dd");
        const completion = completions.find(
          c => c.habitId === habit.id && c.date === dateStr && c.completed
        );
        if (completion) completedCount++;
      }
    }

    if (dueCount > 0) {
      const rate = Math.round((completedCount / dueCount) * 100);
      if (!best || rate > best.rate) {
        best = { habit, rate };
      }
    }
  }

  return best;
};

// Find most skipped habit this week
export const getMostSkippedHabit = (
  habits: Habit[],
  completions: HabitCompletion[]
): { habit: Habit; skipCount: number } | null => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const activeHabits = habits.filter(h => h.isActive && !h.archivedAt && !h.isPaused);

  let worst: { habit: Habit; skipCount: number } | null = null;

  for (const habit of activeHabits) {
    const skips = completions.filter(
      c => c.habitId === habit.id && c.date >= weekStartStr && c.skipped
    ).length;

    if (skips > 0 && (!worst || skips > worst.skipCount)) {
      worst = { habit, skipCount: skips };
    }
  }

  return worst;
};

// Find habits with declining performance
export const getAtRiskHabits = (
  habits: Habit[],
  completions: HabitCompletion[]
): { habit: Habit; thisWeek: number; lastWeek: number }[] => {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  
  const activeHabits = habits.filter(h => h.isActive && !h.archivedAt && !h.isPaused);
  const atRisk: { habit: Habit; thisWeek: number; lastWeek: number }[] = [];

  for (const habit of activeHabits) {
    let thisWeekDue = 0, thisWeekDone = 0;
    let lastWeekDue = 0, lastWeekDone = 0;

    // This week
    for (let d = new Date(thisWeekStart); d <= now; d.setDate(d.getDate() + 1)) {
      if (isHabitDueOnDate(habit, new Date(d))) {
        thisWeekDue++;
        const dateStr = format(d, "yyyy-MM-dd");
        if (completions.find(c => c.habitId === habit.id && c.date === dateStr && c.completed)) {
          thisWeekDone++;
        }
      }
    }

    // Last week
    for (let d = new Date(lastWeekStart); d <= lastWeekEnd; d.setDate(d.getDate() + 1)) {
      if (isHabitDueOnDate(habit, new Date(d))) {
        lastWeekDue++;
        const dateStr = format(d, "yyyy-MM-dd");
        if (completions.find(c => c.habitId === habit.id && c.date === dateStr && c.completed)) {
          lastWeekDone++;
        }
      }
    }

    const thisWeekRate = thisWeekDue > 0 ? Math.round((thisWeekDone / thisWeekDue) * 100) : 0;
    const lastWeekRate = lastWeekDue > 0 ? Math.round((lastWeekDone / lastWeekDue) * 100) : 0;

    // Consider at risk if declining by more than 20% AND last week was good
    if (lastWeekRate >= 50 && lastWeekRate - thisWeekRate >= 20) {
      atRisk.push({ habit, thisWeek: thisWeekRate, lastWeek: lastWeekRate });
    }
  }

  return atRisk.sort((a, b) => (b.lastWeek - b.thisWeek) - (a.lastWeek - a.thisWeek));
};

// Generate contextual insights
export const generateInsights = (
  habits: Habit[],
  completions: HabitCompletion[]
): string[] => {
  const insights: string[] = [];
  const dailyRates = getDailyCompletionRates(habits, completions, 14);
  
  // Weekend vs weekday analysis
  const weekdayRates = dailyRates.filter(d => !d.isWeekend).map(d => d.percentage);
  const weekendRates = dailyRates.filter(d => d.isWeekend).map(d => d.percentage);
  
  if (weekdayRates.length > 0 && weekendRates.length > 0) {
    const avgWeekday = weekdayRates.reduce((a, b) => a + b, 0) / weekdayRates.length;
    const avgWeekend = weekendRates.reduce((a, b) => a + b, 0) / weekendRates.length;
    
    if (avgWeekday > 0 && avgWeekend < avgWeekday * 0.7) {
      const dropPercent = Math.round(((avgWeekday - avgWeekend) / avgWeekday) * 100);
      insights.push(`Weekends reduce your completion rate by ${dropPercent}%`);
    }
  }

  // As-needed habit analysis
  const activeHabits = habits.filter(h => h.isActive && !h.archivedAt && !h.isPaused);
  const asNeededHabits = activeHabits.filter(h => h.frequency === "as-needed");
  const scheduledHabits = activeHabits.filter(h => h.frequency !== "as-needed");
  
  if (asNeededHabits.length > 0 && scheduledHabits.length > 0) {
    const last14Days = Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), i), "yyyy-MM-dd"));
    
    const asNeededCompletions = completions.filter(
      c => asNeededHabits.some(h => h.id === c.habitId) && last14Days.includes(c.date) && c.completed
    ).length;
    const scheduledCompletions = completions.filter(
      c => scheduledHabits.some(h => h.id === c.habitId) && last14Days.includes(c.date) && c.completed
    ).length;
    
    const asNeededRate = asNeededCompletions / (asNeededHabits.length * 14);
    const scheduledRate = scheduledCompletions / (scheduledHabits.length * 14);
    
    if (scheduledRate > 0 && asNeededRate < scheduledRate * 0.5) {
      const multiplier = Math.round(scheduledRate / Math.max(asNeededRate, 0.01));
      if (multiplier >= 2 && multiplier <= 10) {
        insights.push(`As-needed habits are completed ${multiplier}× less often`);
      }
    }
  }

  // Day of week pattern
  const dayStats: Record<number, number[]> = {};
  for (const day of dailyRates) {
    const dayNum = getDay(new Date(day.date));
    if (!dayStats[dayNum]) dayStats[dayNum] = [];
    dayStats[dayNum].push(day.percentage);
  }
  
  let worstDay = { day: -1, avg: 100 };
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  for (const [day, rates] of Object.entries(dayStats)) {
    if (rates.length > 0) {
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
      if (avg < worstDay.avg && avg < 50) {
        worstDay = { day: parseInt(day), avg };
      }
    }
  }
  
  if (worstDay.day >= 0) {
    insights.push(`${dayNames[worstDay.day]}s are your lowest completion day (${Math.round(worstDay.avg)}%)`);
  }

  return insights.slice(0, 3); // Max 3 insights
};

// Goals and milestones summary
export const getGoalsSummary = (
  goals: Goal[],
  milestones: Milestone[]
): { completed: number; total: number; upcomingCount: number } => {
  const activeGoals = goals.filter(g => !g.completedAt && !g.archivedAt);
  const relevantMilestones = milestones.filter(
    m => activeGoals.some(g => g.id === m.goalId)
  );
  
  const completed = relevantMilestones.filter(m => m.completed).length;
  const total = relevantMilestones.length;
  
  // Upcoming = not completed, with deadline this month
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const upcomingCount = relevantMilestones.filter(
    m => !m.completed && m.deadline && new Date(m.deadline) <= endOfMonth
  ).length;

  return { completed, total, upcomingCount };
};
