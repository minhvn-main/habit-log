import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Clock, Settings } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { TodayHabitCard } from "@/components/TodayHabitCard";
import { TodayProgressCard } from "@/components/TodayProgressCard";
import { TodayDeadlinesCard } from "@/components/TodayDeadlinesCard";
import { AppSettingsModal } from "@/components/AppSettingsModal";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PageLayout } from "@/components/PageLayout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isHabitFinished } from "@/utils/habitStats";
import { isHabitDueToday, isHabitDueOnDate } from "@/lib/habitSchedule";
import { useTodaySettings } from "@/hooks/useTodaySettings";
import { AllDoneCard } from "@/components/AllDoneCard";
import { calculateCurrentStreak } from "@/utils/statsCalculations";

export const Today = () => {
  const { habits, habitCompletions, goals, milestones } = useApp();
  const { settings, updateSetting } = useTodaySettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  
  // Get active habits (excluding finished ones)
  const activeHabits = useMemo(
    () => habits.filter(habit =>
      habit.isActive &&
      !habit.archivedAt &&
      !habit.isPaused &&
      !isHabitFinished(habit, habitCompletions)
    ),
    [habits, habitCompletions]
  );
  
  // Split habits: as-needed habits go to their own bucket if setting allows
  const asNeededHabits = activeHabits.filter(habit => habit.frequency === "as-needed");
  const scheduledHabits = activeHabits.filter(habit => habit.frequency !== "as-needed");
  
  // Split scheduled habits into "due today"
  const dueToday = scheduledHabits.filter(habit => isHabitDueToday(habit));

  // Habits that are scheduled (non-as-needed) but not due today
  const notDueToday = scheduledHabits.filter(habit => !isHabitDueToday(habit));
  
  // Get today's completions for progress calculation
  const getTodayCompletions = () => {
    return habitCompletions.filter(completion => 
      completion.date === today && 
      completion.completed &&
      dueToday.some(h => h.id === completion.habitId)
    );
  };

  const todayCompletions = getTodayCompletions();
  const completedCount = todayCompletions.length;
  const totalHabits = dueToday.length;
  const completionPercentage = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  const streak = useMemo(
    () => calculateCurrentStreak(habits, habitCompletions),
    [habits, habitCompletions]
  );

  const tomorrowCount = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return activeHabits.filter(
      h => h.frequency !== "as-needed" && isHabitDueOnDate(h, tomorrow)
    ).length;
  }, [activeHabits]);

  // Get upcoming deadlines (including overdue)
  const getUpcomingDeadlines = () => {
    return goals
      .filter(goal => {
        if (!goal.targetDate || goal.completedAt || goal.archivedAt) return false;
        if (settings.showOnlyMyGoals) {
          return goal.assignedTo.toLowerCase() === "myself";
        }
        return true;
      })
      .map(goal => {
        const daysUntil = Math.ceil((new Date(goal.targetDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        // Find first incomplete milestone for this goal
        const goalMilestones = milestones
          .filter(m => m.goalId === goal.id && !m.completed)
          .sort((a, b) => a.order - b.order);
        
        const nextMilestone = goalMilestones[0] 
          ? { title: goalMilestones[0].title, deadline: goalMilestones[0].deadline }
          : undefined;
        
        return { id: goal.id, title: goal.title, targetDate: goal.targetDate!, daysUntil, assignedTo: goal.assignedTo, nextMilestone };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);
  };

  const upcomingDeadlines = getUpcomingDeadlines();

  return (
    <PageLayout
      title="Today"
      subtitle={format(new Date(), "EEEE, MMMM d")}
      headerRight={
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button 
            onClick={() => setSettingsOpen(true)}
            className="text-muted-foreground hover:text-foreground transition-colors p-2"
          >
            <Settings size={20} />
          </button>
        </div>
      }
    >
      {/* Progress Summary Card */}
      <TodayProgressCard 
        completedCount={completedCount}
        totalCount={totalHabits}
        percentage={completionPercentage}
      />

      {/* All done celebration */}
      {dueToday.length > 0 && completedCount === totalHabits && (
        <AllDoneCard streak={streak} tomorrowCount={tomorrowCount} />
      )}

      {/* Today Section — hidden when all done */}
      {dueToday.length > 0 && completedCount < totalHabits && (
        <CollapsibleSection
          title="Today"
          count={dueToday.length}
          sectionId="today-due"
          variant="active"
          defaultCollapsed={false}
        >
          {dueToday.map(habit => (
            <TodayHabitCard key={habit.id} habit={habit} enableSkipState={settings.enableSkipState} />
          ))}
        </CollapsibleSection>
      )}

      {/* Optional Section (As Needed) - Collapsed by default */}
      {settings.showAsNeeded && asNeededHabits.length > 0 && (
        <CollapsibleSection
          title="Optional"
          count={asNeededHabits.length}
          sectionId="today-optional"
          variant="paused"
          defaultCollapsed={true}
        >
          {asNeededHabits.map(habit => (
            <TodayHabitCard key={habit.id} habit={habit} enableSkipState={settings.enableSkipState} />
          ))}
        </CollapsibleSection>
      )}

      {/* Not Due Today — collapsed by default */}
      {settings.showNotDueToday && notDueToday.length > 0 && (
        <CollapsibleSection
          title="Not Due Today"
          count={notDueToday.length}
          sectionId="today-not-due"
          variant="paused"
          defaultCollapsed={true}
        >
          {notDueToday.map(habit => (
            <TodayHabitCard key={habit.id} habit={habit} enableSkipState={false} />
          ))}
        </CollapsibleSection>
      )}

      {/* Deadlines Card */}
      <TodayDeadlinesCard deadlines={upcomingDeadlines} showOwner={!settings.showOnlyMyGoals} />
      
      {/* Empty State */}
      {activeHabits.length === 0 && (
        <div className="bg-card border border-border rounded-2xl shadow-sm text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="text-muted-foreground" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No habits today</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Create your first habit to start building better routines.
          </p>
        </div>
      )}

      {/* Settings Modal */}
      <AppSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onUpdateSetting={updateSetting}
      />
    </PageLayout>
  );
};
