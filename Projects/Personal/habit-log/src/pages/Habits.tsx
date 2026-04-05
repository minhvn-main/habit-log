import { useState, useEffect, useMemo } from "react";
import { Plus, Settings } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { AddHabitModal } from "@/components/AddHabitModal";
import { EditHabitModal } from "@/components/EditHabitModal";
import { HabitListCard } from "@/components/HabitListCard";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PageLayout } from "@/components/PageLayout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isHabitFinished } from "@/utils/habitStats";
import { Habit, HabitCompletion } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Habits = () => {
  const { habits, habitCompletions } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>('creation');

  type SortOption = { value: string; label: string };
  const sortOptions: SortOption[] = [
    { value: 'creation', label: 'Creation date' },
    { value: 'startDate', label: 'Starting date' },
    { value: 'alphabetical', label: 'Alphabetical' },
    { value: 'progress', label: 'Progress' },
    { value: 'targetType', label: 'Target type' },
  ];

  const getHabitProgress = (habit: Habit): number => {
    if (!habit.goalTarget || habit.goalTarget <= 0) return 0;
    const completions = habitCompletions.filter(c => c.habitId === habit.id && c.completed);
    return completions.length / habit.goalTarget;
  };

  const sortHabits = (list: Habit[]): Habit[] => {
    return [...list].sort((a, b) => {
      switch (sortOrder) {
        case 'startDate':
          if (!a.startDate && !b.startDate) return 0;
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          return a.startDate.localeCompare(b.startDate);
        case 'alphabetical':
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        case 'progress':
          return getHabitProgress(b) - getHabitProgress(a);
        case 'targetType':
          return (a.frequency || '').localeCompare(b.frequency || '');
        case 'creation':
        default:
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
    });
  };

  // Handle edit query param from Today tab navigation
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
      const habitToEdit = habits.find(h => h.id === editId);
      if (habitToEdit) {
        setEditingHabit(habitToEdit);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, habits, setSearchParams]);

  // Categorize habits by status
  const activeHabits = habits.filter(habit => 
    habit.isActive && !habit.archivedAt && !habit.isPaused && !isHabitFinished(habit, habitCompletions)
  );
  
  const pausedHabits = habits.filter(habit => 
    habit.isActive && !habit.archivedAt && habit.isPaused
  );
  
  const finishedHabits = habits.filter(habit => 
    habit.isActive && !habit.archivedAt && isHabitFinished(habit, habitCompletions)
  );
  
  const archivedHabits = habits.filter(habit => habit.archivedAt);

  return (
    <PageLayout
      title="My Habits"
      subtitle={`${activeHabits.length} active • ${pausedHabits.length} paused • ${finishedHabits.length} completed`}
      headerRight={
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button onClick={() => setSettingsOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors p-2">
            <Settings size={20} />
          </button>
        </div>
      }
    >
      {/* Active Habits Section */}
      {activeHabits.length > 0 && (
        <CollapsibleSection
          title="Active Habits"
          count={activeHabits.length}
          sectionId="active"
          variant="active"
        >
          <div className="space-y-3">
            {sortHabits(activeHabits).map(habit => (
              <HabitListCard 
                key={habit.id} 
                habit={habit} 
                completions={habitCompletions}
                status="active"
                onClick={() => setEditingHabit(habit)} 
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Completed Habits Section */}
      {finishedHabits.length > 0 && (
        <CollapsibleSection
          title="Completed Habits"
          count={finishedHabits.length}
          sectionId="finished"
          variant="completed"
        >
          <div className="space-y-3">
            {sortHabits(finishedHabits).map(habit => (
              <HabitListCard 
                key={habit.id} 
                habit={habit} 
                completions={habitCompletions}
                status="completed"
                onClick={() => setEditingHabit(habit)} 
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Paused Habits Section */}
      {pausedHabits.length > 0 && (
        <CollapsibleSection
          title="Paused Habits"
          count={pausedHabits.length}
          sectionId="paused"
          variant="paused"
        >
          <div className="space-y-3">
            {sortHabits(pausedHabits).map(habit => (
              <HabitListCard 
                key={habit.id} 
                habit={habit} 
                completions={habitCompletions}
                status="paused"
                onClick={() => setEditingHabit(habit)} 
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Archived Habits Section */}
      {archivedHabits.length > 0 && (
        <CollapsibleSection
          title="Archived Habits"
          count={archivedHabits.length}
          sectionId="archived"
          variant="archived"
          defaultCollapsed={true}
        >
          <div className="space-y-3">
            {sortHabits(archivedHabits).map(habit => (
              <HabitListCard 
                key={habit.id} 
                habit={habit} 
                completions={habitCompletions}
                status="archived"
                onClick={() => setEditingHabit(habit)} 
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Empty State */}
      {activeHabits.length === 0 && pausedHabits.length === 0 && finishedHabits.length === 0 && archivedHabits.length === 0 && (
        <div className="bg-card border border-border rounded-2xl shadow-sm text-center py-12">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Plus size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">No habits yet</h3>
            <p className="text-muted-foreground">
              Create your first habit to start tracking your progress and building better routines.
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} className="mr-1" />
              Add Your First Habit
            </Button>
          </div>
        </div>
      )}

      <AddHabitModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Sort Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Habits Settings</DialogTitle></DialogHeader>
          <div className="space-y-1 py-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">Sort habits by</p>
            {sortOptions.map(option => (
              <button
                key={option.value}
                onClick={() => { setSortOrder(option.value); setSettingsOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                  sortOrder === option.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {editingHabit && (
        <EditHabitModal
          isOpen={true}
          onClose={() => setEditingHabit(null)}
          habit={editingHabit}
        />
      )}

      {/* FAB */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all"
      >
        <Plus size={24} />
      </button>
    </PageLayout>
  );
};
