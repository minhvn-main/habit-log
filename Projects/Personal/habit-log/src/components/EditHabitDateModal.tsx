import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Habit } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface EditHabitDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  habits: Habit[];
}

export const EditHabitDateModal = ({ isOpen, onClose, date, habits }: EditHabitDateModalProps) => {
  const { habitCompletions, updateHabitCompletion } = useApp();
  const [habitStates, setHabitStates] = useState<Record<string, { completed: boolean; skipped: boolean; notes: string; difficulty?: number }>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  const dateStr = format(date, "yyyy-MM-dd");
  const activeHabits = habits.filter(habit => habit.isActive && !habit.archivedAt);

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
    if (isOpen && !isInitialized) {
      console.log("Initializing modal state for date:", dateStr);
      const states: typeof habitStates = {};
      activeHabits.forEach(habit => {
        const completion = habitCompletions.find(c => c.habitId === habit.id && c.date === dateStr);
        console.log(`Habit ${habit.name} completion:`, completion);
        states[habit.id] = {
          completed: completion?.completed || false,
          skipped: completion?.skipped || false,
          notes: completion?.notes || "",
          difficulty: completion?.difficulty,
        };
      });
      setHabitStates(states);
      setIsInitialized(true);
    }
  }, [isOpen, activeHabits, habitCompletions, dateStr, isInitialized]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
      setHabitStates({});
    }
  }, [isOpen]);

  const handleSave = () => {
    console.log("Saving habit states:", habitStates);
    Object.entries(habitStates).forEach(([habitId, state]) => {
      updateHabitCompletion({
        habitId,
        date: dateStr,
        completed: state.completed,
        skipped: state.skipped,
        notes: state.notes,
        difficulty: state.difficulty,
      });
    });
    onClose();
  };

  const updateHabitState = (habitId: string, updates: Partial<typeof habitStates[string]>) => {
    console.log(`Updating habit ${habitId}:`, updates);
    setHabitStates(prev => ({
      ...prev,
      [habitId]: { ...prev[habitId], ...updates }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-[calc(100vw-2rem)] sm:max-w-md bg-card border border-border rounded-xl max-h-[calc(100dvh-6rem)] mt-4 flex flex-col overflow-hidden" style={{ paddingLeft: 'max(0px, env(safe-area-inset-left))', paddingRight: 'max(0px, env(safe-area-inset-right))' }}>
        {/* Sticky header */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-semibold break-words">
            Edit Habits - {format(date, "dd/MM/yyyy")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="touch-target flex-shrink-0"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4 touch-action-manipulation">
          {activeHabits.map((habit) => {
            const state = habitStates[habit.id] || { completed: false, skipped: false, notes: "", difficulty: undefined };
            
            return (
              <div key={habit.id} className="space-y-3 p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full habit-color-${habit.color}`} />
                  <span className="font-medium">{habit.name}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={state.completed ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateHabitState(habit.id, { 
                      completed: !state.completed, 
                      skipped: false 
                    })}
                    className="flex-1"
                  >
                    {state.completed ? "Completed" : "Complete"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant={state.skipped ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => updateHabitState(habit.id, { 
                      skipped: !state.skipped, 
                      completed: false 
                    })}
                    className="flex-1"
                  >
                    {state.skipped ? "Skipped" : "Skip"}
                  </Button>
                </div>

                {state.completed && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Difficulty (1-5)</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => updateHabitState(habit.id, { difficulty: level })}
                          className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                            state.difficulty === level
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-medium">Notes</label>
                  <Textarea
                    value={state.notes}
                    onChange={(e) => updateHabitState(habit.id, { notes: e.target.value })}
                    placeholder="Optional notes..."
                    className="bg-input border-border resize-none text-sm"
                    rows={2}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky footer */}
        <div className="flex-shrink-0 p-6 pt-4 border-t border-border flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
