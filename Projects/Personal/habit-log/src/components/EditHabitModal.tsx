import { useState, useEffect, useMemo } from "react";
import { X, Archive, Trash2, Pause, Play, Info, CheckCircle2, CalendarIcon, ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useApp } from "@/contexts/AppContext";
import { Habit, GoalType } from "@/types";
import { Button } from "@/components/ui/button";
import { HabitForm, HabitFormData } from "@/components/HabitForm";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EditHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit;
}

export const EditHabitModal = ({ isOpen, onClose, habit }: EditHabitModalProps) => {
  const { updateHabit, archiveHabit, unarchiveHabit, setHabits, habitCompletions } = useApp();

  // instant UI mirror for pause
  const [paused, setPaused] = useState<boolean>(!!habit.isPaused);
  const [startDate, setStartDate] = useState<Date | undefined>(
    habit.startDate ? parseISO(habit.startDate) : undefined
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);

  const [formData, setFormData] = useState<HabitFormData>({
    name: habit.name,
    description: habit.description || "",
    frequency: habit.frequency,
    color: habit.color,
    weeklyDays: habit.weeklyDays || [],
    customInterval: habit.customInterval || 7,
    goalType: habit.goalType || "none",
    goalTarget: habit.goalTarget || 30,
    goalPeriod: habit.goalPeriod || "total",
    targetDate: habit.targetDate || "",
  });

  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setPaused(!!habit.isPaused);
    setStartDate(habit.startDate ? parseISO(habit.startDate) : undefined);
    setAdvancedOpen(false);
    setFormData({
      name: habit.name,
      description: habit.description || "",
      frequency: habit.frequency,
      color: habit.color,
      weeklyDays: habit.weeklyDays || [],
      customInterval: habit.customInterval || 7,
      goalType: habit.goalType || "none",
      goalTarget: habit.goalTarget || 30,
      goalPeriod: habit.goalPeriod || "total",
      targetDate: habit.targetDate || "",
    });
  }, [isOpen, habit]);

  // show a "done today" chip (habit-level status stays ACTIVE/PAUSED/ARCHIVED)
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const doneToday = useMemo(
    () => habitCompletions?.some(c => c.habitId === habit.id && c.date === todayKey && c.completed),
    [habitCompletions, habit.id, todayKey]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const updates: Partial<Habit> = {
      name: formData.name,
      description: formData.description,
      frequency: formData.frequency,
      color: formData.color,
    };

    if (formData.frequency === "weekly") {
      updates.weeklyDays = [...formData.weeklyDays];
      updates.customInterval = undefined;
    } else if (formData.frequency === "custom") {
      updates.customInterval = Math.max(1, Number(formData.customInterval || 1));
      updates.weeklyDays = undefined;
    } else {
      updates.weeklyDays = undefined;
      updates.customInterval = undefined;
    }

    if (formData.goalType !== "none") {
      updates.goalType = formData.goalType as GoalType;
      updates.goalTarget = formData.goalTarget;

      if (formData.goalType === "number-of-times") {
        updates.goalPeriod = formData.goalPeriod;
        updates.targetDate = undefined;
      } else if (formData.goalType === "by-specific-date") {
        updates.targetDate = formData.targetDate || undefined;
        updates.goalPeriod = undefined;
      } else {
        updates.goalPeriod = undefined;
        updates.targetDate = undefined;
      }
    } else {
      updates.goalType = undefined;
      updates.goalTarget = undefined;
      updates.goalPeriod = undefined;
      updates.targetDate = undefined;
    }

    // Include startDate if changed
    if (startDate) {
      updates.startDate = format(startDate, "yyyy-MM-dd");
    }

    updateHabit(habit.id, updates);
    onClose();
    toast.success("Habit updated successfully");
  };

  const handleArchive = () => {
    if (habit.archivedAt) {
      if (confirm("Are you sure you want to reactivate this habit?")) {
        unarchiveHabit(habit.id);
        onClose();
        toast.success("Habit reactivated");
      }
    } else {
      if (confirm("Are you sure you want to archive this habit?")) {
        archiveHabit(habit.id);
        onClose();
        toast.success("Habit archived");
      }
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to permanently delete this habit? This action cannot be undone.")) {
      setHabits(prev => prev.filter(h => h.id !== habit.id));
      onClose();
      toast.success("Habit deleted");
    }
  };

  const handleTogglePause = () => {
    const nextPaused = !paused;
    const msg = nextPaused
      ? "Pause this habit? It will be excluded from streaks and daily counts until you unpause."
      : "Unpause this habit and resume tracking?";
    if (!confirm(msg)) return;

    if (nextPaused) {
      updateHabit(habit.id, { isPaused: true, pausedAt: new Date().toISOString() });
    } else {
      updateHabit(habit.id, { isPaused: undefined, pausedAt: undefined });
    }
    setPaused(nextPaused);
    toast.success(nextPaused ? "Habit paused" : "Habit resumed");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[calc(100vw-2rem)] sm:max-w-lg bg-card rounded-2xl shadow-xl max-h-[calc(100dvh-6rem)] mt-4 flex flex-col overflow-hidden" style={{ paddingLeft: 'max(0px, env(safe-area-inset-left))', paddingRight: 'max(0px, env(safe-area-inset-right))' }}>
        {/* Sticky header */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-border">
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <h2 className="text-xl font-semibold text-foreground">Edit habit</h2>
            {habit.archivedAt ? (
              <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded">archived</span>
            ) : paused ? (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded">paused</span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded">active</span>
            )}
            {doneToday && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={12} /> done today
              </span>
            )}
          </div>

          {/* Status alerts */}
          {paused && !habit.archivedAt && (
            <div className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
              <Info size={16} className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-amber-700 dark:text-amber-300">
                This habit is paused. It won't count toward streaks or daily progress until unpaused.
              </span>
            </div>
          )}
          {habit.archivedAt && (
            <div className="flex items-start gap-2 text-sm bg-muted border border-border rounded-lg p-3 mt-4">
              <Info size={16} className="mt-0.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Archived habits can't be paused. Unarchive to manage pause state.</span>
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-5 touch-action-manipulation">
          <HabitForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel="Save changes"
             submitDisabled={!formData.name.trim()}
            hideButtons
          />

          {/* Advanced settings (collapsed by default) */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors py-2">
              <ChevronDown className={cn("w-4 h-4 transition-transform", advancedOpen && "rotate-180")} />
              Advanced settings
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Start date</label>
                <p className="text-xs text-muted-foreground">Tracking only applies from this date forward</p>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="min-w-[280px] w-[calc(100vw-3rem)] max-w-[320px] p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        setStartDateOpen(false);
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Action buttons in single row */}
              <div className="grid grid-cols-3 gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTogglePause}
                  size="sm"
                  className={cn(
                    "flex flex-col items-center gap-1 h-auto py-2",
                    paused
                      ? "text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/30"
                      : "text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/30"
                  )}
                  disabled={!!habit.archivedAt}
                >
                  {paused ? <Play size={16} /> : <Pause size={16} />}
                  <span className="text-xs">{paused ? "Resume" : "Pause"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleArchive}
                  size="sm"
                  className="flex flex-col items-center gap-1 h-auto py-2 text-muted-foreground border-border hover:bg-muted"
                >
                  <Archive size={16} />
                  <span className="text-xs">{habit.archivedAt ? "Reactivate" : "Archive"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  size="sm"
                  className="flex flex-col items-center gap-1 h-auto py-2 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 size={16} />
                  <span className="text-xs">Delete</span>
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-muted-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
              disabled={!formData.name.trim()}
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
