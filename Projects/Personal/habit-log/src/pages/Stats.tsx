import { useMemo } from "react";
import { format, startOfWeek } from "date-fns";
import { TrendingUp, TrendingDown, Flame, Star, AlertTriangle, SkipForward, Target } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  calculateWeekOverWeekChange,
  calculateCurrentStreak,
  getDailyCompletionRates,
  getMostConsistentHabit,
  getMostSkippedHabit,
  getAtRiskHabits,
  getGoalsSummary,
} from "@/utils/statsCalculations";

export const Stats = () => {
  const { habits, habitCompletions, goals, milestones } = useApp();

  const weekData = useMemo(() => {
    return calculateWeekOverWeekChange(habits, habitCompletions);
  }, [habits, habitCompletions]);

  const currentStreak = useMemo(() => {
    return calculateCurrentStreak(habits, habitCompletions);
  }, [habits, habitCompletions]);

  const dailyRates = useMemo(() => {
    return getDailyCompletionRates(habits, habitCompletions, 7);
  }, [habits, habitCompletions]);

  const mostConsistent = useMemo(() => {
    return getMostConsistentHabit(habits, habitCompletions);
  }, [habits, habitCompletions]);

  const mostSkipped = useMemo(() => {
    return getMostSkippedHabit(habits, habitCompletions);
  }, [habits, habitCompletions]);

  const atRiskHabits = useMemo(() => {
    return getAtRiskHabits(habits, habitCompletions);
  }, [habits, habitCompletions]);

  const goalsSummary = useMemo(() => {
    return getGoalsSummary(goals, milestones);
  }, [goals, milestones]);

  const weekStartFormatted = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "MMM d");

  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 50) return "bg-amber-500";
    return "bg-red-400";
  };

  const hasHabits = habits.filter(h => h.isActive && !h.archivedAt).length > 0;

  return (
    <PageLayout
      title="Weekly Review"
      subtitle={`Week of ${weekStartFormatted}`}
      headerRight={
        <div className="flex items-center gap-1">
          <ThemeToggle />
        </div>
      }
    >
      {/* Weekly Summary Hero Card */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            This Week
          </h3>
        </div>
        <div className="p-4">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-4xl font-bold text-foreground">
              {weekData.thisWeek}%
            </span>
            {weekData.change !== 0 && (
              <span className={`flex items-center gap-1 text-sm font-medium ${
                weekData.change > 0 ? "text-emerald-600" : "text-red-500"
              }`}>
                {weekData.change > 0 ? (
                  <TrendingUp size={16} />
                ) : (
                  <TrendingDown size={16} />
                )}
                {weekData.change > 0 ? "+" : ""}{weekData.change}% vs last week
              </span>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${weekData.thisWeek}%` }}
            />
          </div>

          {/* Streak */}
          {currentStreak > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Flame size={18} className="text-orange-500" />
              <span className="font-medium text-foreground">
                {currentStreak}-day streak
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Consistency Chart */}
      {hasHabits && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Last 7 Days
            </h3>
          </div>
          <div className="p-4">
            <div className="flex items-end justify-between gap-2 h-28">
              {dailyRates.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
                  <div className="flex flex-col items-center justify-end flex-1 w-full">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {day.percentage}%
                    </div>
                    <div
                      className={`w-full rounded-t ${getBarColor(day.percentage)} transition-all`}
                      style={{ height: `${Math.max(day.percentage * 0.6, 4)}px` }}
                    />
                  </div>
                  <div className={`text-xs ${day.isWeekend ? "text-muted-foreground" : "text-foreground"}`}>
                    {day.dayName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Habit Performance */}
      {(mostConsistent || mostSkipped || atRiskHabits.length > 0) && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Habit Performance
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {mostConsistent && mostConsistent.rate >= 50 && (
              <div className="flex items-start gap-3">
                <Star size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Most consistent</p>
                  <p className="text-sm text-muted-foreground">
                    {mostConsistent.habit.name} — {mostConsistent.rate}% this week
                  </p>
                </div>
              </div>
            )}

            {mostSkipped && (
              <div className="flex items-start gap-3">
                <SkipForward size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Most skipped</p>
                  <p className="text-sm text-muted-foreground">
                    {mostSkipped.habit.name} — skipped {mostSkipped.skipCount} {mostSkipped.skipCount === 1 ? "time" : "times"}
                  </p>
                </div>
              </div>
            )}

            {atRiskHabits.length > 0 && (
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">At risk</p>
                  <p className="text-sm text-muted-foreground">
                    {atRiskHabits[0].habit.name} — declining ({atRiskHabits[0].lastWeek}% → {atRiskHabits[0].thisWeek}%)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Goals Progress */}
      {goalsSummary.total > 0 && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Goals Progress
            </h3>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Target size={18} className="text-primary" />
              <span className="text-sm text-foreground">
                <span className="font-semibold">{goalsSummary.completed}/{goalsSummary.total}</span> milestones completed
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${goalsSummary.total > 0 ? (goalsSummary.completed / goalsSummary.total) * 100 : 0}%` }}
              />
            </div>

            {goalsSummary.upcomingCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {goalsSummary.upcomingCount} upcoming {goalsSummary.upcomingCount === 1 ? "milestone" : "milestones"} this month
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasHabits && goals.length === 0 && (
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Start your journey by adding your first habit or goal!
          </p>
        </div>
      )}
    </PageLayout>
  );
};
