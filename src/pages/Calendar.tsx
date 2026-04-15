import { useState, useMemo } from "react";
import { Settings } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import { CalendarHabitRow } from "@/components/CalendarHabitRow";
import { isHabitFinished, getGoalCompletionDate } from "@/utils/habitStats";
import { PageLayout } from "@/components/PageLayout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Habit } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { isHabitDueOnDate } from "@/lib/habitSchedule";

export const CalendarPage = () => {
  const { habits, habitCompletions } = useApp();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const [showCompleted, setShowCompleted] = useState(true);
  const [showSkipped, setShowSkipped] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isSelectedToday = isToday(selectedDate);

  const handleTodayClick = () => {
    const today = new Date();
    setSelectedDate(today);
    setMonth(today);
  };

  // Include ALL active habits (including finished ones) for calendar display and dot calculations
  const allActiveHabits = habits.filter(habit => 
    habit.isActive && !habit.archivedAt && !habit.isPaused
  );

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedDateCompletions = habitCompletions.filter(c => c.date === selectedDateStr);

  const getHabitStatus = (habitId: string) => {
    const completion = selectedDateCompletions.find(c => c.habitId === habitId);
    if (completion?.completed) return 'completed';
    if (completion?.skipped) return 'skipped';
    return 'none';
  };

  const filteredHabits = allActiveHabits.filter(habit => {
    // Don't show finished habits on dates after their goal completion
    const goalCompletionDate = getGoalCompletionDate(habit, habitCompletions);
    if (goalCompletionDate && selectedDateStr > goalCompletionDate) {
      return false;
    }
    
    const status = getHabitStatus(habit.id);
    if (status === 'completed' && !showCompleted) return false;
    if (status === 'skipped' && !showSkipped) return false;
    return true;
  });

  // Split habits into mandatory and optional (as-needed)
  const mandatoryHabits = filteredHabits.filter(h => h.frequency !== "as-needed");
  const optionalHabits = filteredHabits.filter(h => h.frequency === "as-needed");

  // Helper to check if this is the goal completion day for a habit
  const getIsGoalCompletionDay = (habit: Habit) => {
    const completionDate = getGoalCompletionDate(habit, habitCompletions);
    return completionDate === selectedDateStr;
  };

  // Calculate day statuses for calendar indicators using completion quality logic
  const { perfectDates, skippedDates, pendingDates } = useMemo(() => {
    const dateStatusMap = new Map<string, { completions: { habitId: string; completed: boolean; skipped: boolean }[] }>();
    
    habitCompletions.forEach(completion => {
      const existing = dateStatusMap.get(completion.date) || { completions: [] };
      existing.completions.push({
        habitId: completion.habitId,
        completed: completion.completed,
        skipped: completion.skipped
      });
      dateStatusMap.set(completion.date, existing);
    });

    const perfect: Date[] = [];
    const skipped: Date[] = [];
    const pending: Date[] = [];

    dateStatusMap.forEach((data, dateStr) => {
      const date = new Date(dateStr + "T00:00:00");
      
      // No entries = no indicator (but we have entries if we're here)
      if (data.completions.length === 0) return;
      
      // Get MANDATORY habits that were due on this date (exclude as-needed)
      // Also exclude habits that were FINISHED before this date
      const mandatoryDueHabits = allActiveHabits.filter(habit => {
        if (habit.frequency === "as-needed") return false;
        if (!isHabitDueOnDate(habit, date)) return false;
        
        // If the habit is finished, only count it for dates up to and including
        // its goal completion date
        const goalCompletionDate = getGoalCompletionDate(habit, habitCompletions);
        if (goalCompletionDate && dateStr > goalCompletionDate) {
          return false; // This habit finished before this date, don't count it
        }
        
        return true;
      });
      
      if (mandatoryDueHabits.length === 0) return;
      
      // Check status of each mandatory habit
      const statuses = mandatoryDueHabits.map(habit => {
        const completion = data.completions.find(c => c.habitId === habit.id);
        if (completion?.completed) return 'completed';
        if (completion?.skipped) return 'skipped';
        return 'none';
      });
      
      const allCompleted = statuses.every(s => s === 'completed');
      const allAccountedFor = statuses.every(s => s !== 'none');
      const hasAnyActivity = statuses.some(s => s !== 'none');
      
      if (allCompleted) {
        perfect.push(date);
      } else if (allAccountedFor) {
        // All habits have a status, but some were skipped
        skipped.push(date);
      } else if (hasAnyActivity) {
        // Some activity but not all habits accounted for
        pending.push(date);
      }
    });

    return { perfectDates: perfect, skippedDates: skipped, pendingDates: pending };
  }, [habitCompletions, allActiveHabits]);

  return (
    <PageLayout
      title="Calendar"
      subtitle="Review and edit past entries"
      headerRight={
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button onClick={() => setSettingsOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors p-2">
            <Settings size={20} />
          </button>
        </div>
      }
    >
      {/* Today button row */}
      <div className="flex justify-end">
        <button
          onClick={handleTodayClick}
          disabled={isSelectedToday}
          className={cn(
            "text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
            isSelectedToday
              ? "text-muted-foreground opacity-40 cursor-default"
              : "text-primary hover:text-primary/80 hover:bg-primary/10"
          )}
        >
          Today
        </button>
      </div>

      {/* Calendar Grid - Full width on mobile */}
      <div className="bg-card rounded-xl border border-border shadow-sm -mx-4 sm:mx-0 sm:rounded-xl overflow-hidden">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          month={month}
          onMonthChange={setMonth}
          modifiers={{
            hasPerfect: perfectDates,
            hasSkipped: skippedDates,
            hasPending: pendingDates,
          }}
          modifiersClassNames={{
            hasPerfect: "calendar-day-completed",
            hasSkipped: "calendar-day-skipped",
            hasPending: "calendar-day-pending",
          }}
          className="rounded-md pointer-events-auto w-full"
        />
      </div>

      {/* Habit Rows below calendar directly */}

      {/* Calendar Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Calendar Settings</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label>Show completed entries</Label>
              <Switch checked={showCompleted} onCheckedChange={setShowCompleted} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show skipped entries</Label>
              <Switch checked={showSkipped} onCheckedChange={setShowSkipped} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Habit Rows - Mandatory */}
      <div className="space-y-2">
        {mandatoryHabits.length > 0 ? (
          mandatoryHabits.map(habit => (
            <CalendarHabitRow 
              key={habit.id} 
              habit={habit} 
              date={selectedDateStr}
              isFinished={isHabitFinished(habit, habitCompletions)}
              isGoalCompletionDay={getIsGoalCompletionDay(habit)}
            />
          ))
        ) : optionalHabits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">
              No habits logged for this day
            </p>
          </div>
        ) : null}
      </div>

      {/* Optional Habits Section */}
      {optionalHabits.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">
            Optional
          </div>
          {optionalHabits.map(habit => (
            <CalendarHabitRow 
              key={habit.id} 
              habit={habit} 
              date={selectedDateStr}
              isFinished={isHabitFinished(habit, habitCompletions)}
              isGoalCompletionDay={getIsGoalCompletionDay(habit)}
              isOptional
            />
          ))}
        </div>
      )}
    </PageLayout>
  );
};
