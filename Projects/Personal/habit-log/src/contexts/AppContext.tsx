import { createContext, useContext, ReactNode, useState, useEffect, useRef } from "react";
import { Habit, HabitCompletion, Goal, Milestone, Person } from "@/types";

interface AppContextType {
  // Habits
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  addHabit: (habit: Omit<Habit, "id" | "createdAt">) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  archiveHabit: (id: string) => void;
  unarchiveHabit: (id: string) => void;
  pauseHabit: (id: string) => void;
  resumeHabit: (id: string) => void;
  
  // Habit Completions
  toggleHabitCompletion: (habitId: string, date: string) => void;
  markHabitSkipped: (habitId: string, date: string) => void;
  updateHabitCompletion: (completion: Partial<HabitCompletion> & { habitId: string; date: string }) => void;
  
  // Goals
  goals: Goal[];
  milestones: Milestone[];
  addGoal: (goal: Omit<Goal, "id" | "createdAt">) => string;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  archiveGoal: (id: string) => void;
  unarchiveGoal: (id: string) => void;
  
  // Milestones
  addMilestone: (milestone: Omit<Milestone, "id">) => void;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  toggleMilestone: (id: string) => void;
  
  // Custom Persons
  customPersons: string[];
  addCustomPerson: (name: string) => void;
  renamePerson: (oldName: string, newName: string) => void;
  
  // Reset functions
  resetProgress: () => void;
  factoryReset: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

export const STORAGE_KEYS = {
  HABITS: "habits",
  HABIT_COMPLETIONS: "habitCompletions", 
  GOALS: "goals",
  MILESTONES: "milestones",
  CUSTOM_PERSONS: "customPersons",
  TODAY_SETTINGS: "todaySettings",
  PEOPLE_COLOR_SETTINGS: "peopleColorSettings",
  APP_INITIALIZED: "appInitialized",
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<HabitCompletion[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [customPersons, setCustomPersons] = useState<string[]>([]);
  const isInitialized = useRef(false);
  const isResetting = useRef(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadedHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
    const loadedCompletions = localStorage.getItem(STORAGE_KEYS.HABIT_COMPLETIONS);
    const loadedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
    const loadedMilestones = localStorage.getItem(STORAGE_KEYS.MILESTONES);
    const loadedCustomPersons = localStorage.getItem(STORAGE_KEYS.CUSTOM_PERSONS);
    const appInitialized = localStorage.getItem(STORAGE_KEYS.APP_INITIALIZED);

    // If app was previously initialized (or reset), don't load sample data
    // Just load whatever is in localStorage (empty after reset)
    if (appInitialized) {
      if (loadedHabits) {
        const parsedHabits = JSON.parse(loadedHabits);
        // Migrate old habits: set startDate to createdAt date if missing
        const migratedHabits = parsedHabits.map((habit: Habit) => ({
          ...habit,
          startDate: habit.startDate || habit.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10)
        }));
        setHabits(migratedHabits);
      }
      if (loadedCompletions) setHabitCompletions(JSON.parse(loadedCompletions));
      if (loadedGoals) setGoals(JSON.parse(loadedGoals));
      if (loadedMilestones) setMilestones(JSON.parse(loadedMilestones));
      if (loadedCustomPersons) setCustomPersons(JSON.parse(loadedCustomPersons));
    } else {
      // First time user - mark as initialized and start with blank slate
      localStorage.setItem(STORAGE_KEYS.APP_INITIALIZED, "true");
    }
    
    isInitialized.current = true;
  }, []);

  // Save to localStorage whenever data changes (only after initial load)
  useEffect(() => {
    if (!isInitialized.current || isResetting.current) return;
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    if (!isInitialized.current || isResetting.current) return;
    localStorage.setItem(STORAGE_KEYS.HABIT_COMPLETIONS, JSON.stringify(habitCompletions));
  }, [habitCompletions]);

  useEffect(() => {
    if (!isInitialized.current || isResetting.current) return;
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (!isInitialized.current || isResetting.current) return;
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(milestones));
  }, [milestones]);

  useEffect(() => {
    if (!isInitialized.current || isResetting.current) return;
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PERSONS, JSON.stringify(customPersons));
  }, [customPersons]);

  // Habit functions
  const addHabit = (habitData: Omit<Habit, "id" | "createdAt">) => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const newHabit: Habit = {
      ...habitData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      startDate: today, // Auto-set to today
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(habit => 
      habit.id === id ? { ...habit, ...updates } : habit
    ));
  };

  const archiveHabit = (id: string) => {
    setHabits(prev => prev.map(habit =>
      habit.id === id ? { ...habit, archivedAt: new Date().toISOString() } : habit
    ));
  };

  const unarchiveHabit = (id: string) => {
    setHabits(prev => prev.map(habit =>
      habit.id === id ? { ...habit, archivedAt: undefined } : habit
    ));
  };

  const pauseHabit = (id: string) => {
    setHabits(prev => prev.map(habit =>
      habit.id === id ? { ...habit, isPaused: true, pausedAt: new Date().toISOString() } : habit
    ));
  };

  const resumeHabit = (id: string) => {
    setHabits(prev => prev.map(habit =>
      habit.id === id ? { ...habit, isPaused: false, pausedAt: undefined } : habit
    ));
  };

  // Habit completion functions
  const toggleHabitCompletion = (habitId: string, date: string) => {
    const existingCompletion = habitCompletions.find(
      c => c.habitId === habitId && c.date === date
    );

    if (existingCompletion) {
      setHabitCompletions(prev => prev.map(completion =>
        completion.id === existingCompletion.id
          ? { ...completion, completed: !completion.completed, skipped: false }
          : completion
      ));
    } else {
      const newCompletion: HabitCompletion = {
        id: crypto.randomUUID(),
        habitId,
        date,
        completed: true,
        skipped: false,
      };
      setHabitCompletions(prev => [...prev, newCompletion]);
    }
  };

  const markHabitSkipped = (habitId: string, date: string) => {
    const existingCompletion = habitCompletions.find(
      c => c.habitId === habitId && c.date === date
    );

    if (existingCompletion) {
      setHabitCompletions(prev => prev.map(completion =>
        completion.id === existingCompletion.id
          ? { ...completion, skipped: !completion.skipped, completed: false }
          : completion
      ));
    } else {
      const newCompletion: HabitCompletion = {
        id: crypto.randomUUID(),
        habitId,
        date,
        completed: false,
        skipped: true,
      };
      setHabitCompletions(prev => [...prev, newCompletion]);
    }
  };

  const updateHabitCompletion = (data: Partial<HabitCompletion> & { habitId: string; date: string }) => {
    const existingCompletion = habitCompletions.find(
      c => c.habitId === data.habitId && c.date === data.date
    );

    if (existingCompletion) {
      setHabitCompletions(prev => prev.map(completion =>
        completion.id === existingCompletion.id
          ? { ...completion, ...data }
          : completion
      ));
    } else {
      const newCompletion: HabitCompletion = {
        id: crypto.randomUUID(),
        habitId: data.habitId,
        date: data.date,
        completed: false,
        ...data,
      };
      setHabitCompletions(prev => [...prev, newCompletion]);
    }
  };

  // Goal functions
  const addGoal = (goalData: Omit<Goal, "id" | "createdAt">): string => {
    const goalId = crypto.randomUUID();
    const today = new Date().toISOString().slice(0, 10);
    const newGoal: Goal = {
      ...goalData,
      id: goalId,
      createdAt: new Date().toISOString(),
      startDate: today,
    };
    setGoals(prev => [...prev, newGoal]);
    return goalId; // Return the ID so milestones can use it
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(goal =>
      goal.id === id ? { ...goal, ...updates } : goal
    ));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
    setMilestones(prev => prev.filter(milestone => milestone.goalId !== id));
  };

  const archiveGoal = (id: string) => {
    setGoals(prev => prev.map(goal =>
      goal.id === id ? { ...goal, archivedAt: new Date().toISOString() } : goal
    ));
  };

  const unarchiveGoal = (id: string) => {
    setGoals(prev => prev.map(goal =>
      goal.id === id ? { ...goal, archivedAt: undefined } : goal
    ));
  };

  // Milestone functions
  const addMilestone = (milestoneData: Omit<Milestone, "id">) => {
    const newMilestone: Milestone = {
      ...milestoneData,
      id: crypto.randomUUID(),
    };
    setMilestones(prev => [...prev, newMilestone]);
  };

  const updateMilestone = (id: string, updates: Partial<Milestone>) => {
    setMilestones(prev => prev.map(milestone =>
      milestone.id === id ? { ...milestone, ...updates } : milestone
    ));
  };

  const deleteMilestone = (id: string) => {
    setMilestones(prev => prev.filter(milestone => milestone.id !== id));
  };

  const toggleMilestone = (id: string) => {
    setMilestones(prev => prev.map(milestone =>
      milestone.id === id
        ? {
            ...milestone,
            completed: !milestone.completed,
            completedAt: !milestone.completed ? new Date().toISOString() : undefined,
          }
        : milestone
    ));
  };

  const addCustomPerson = (name: string) => {
    if (!customPersons.includes(name)) {
      setCustomPersons(prev => [...prev, name]);
    }
  };

  const renamePerson = (oldName: string, newName: string) => {
    // Update all goals with the old assignedTo to the new name
    setGoals(prev => prev.map(goal =>
      goal.assignedTo.toLowerCase() === oldName.toLowerCase()
        ? { ...goal, assignedTo: newName }
        : goal
    ));
    
    // Update customPersons array
    setCustomPersons(prev => prev.map(p =>
      p.toLowerCase() === oldName.toLowerCase() ? newName : p
    ));
  };

  // Reset progress: clears completions and milestone completion states
  const resetProgress = () => {
    // Clear localStorage first to prevent race conditions with save effects
    localStorage.setItem(STORAGE_KEYS.HABIT_COMPLETIONS, JSON.stringify([]));
    
    const resetMilestones = milestones.map(milestone => ({
      ...milestone,
      completed: false,
      completedAt: undefined,
    }));
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(resetMilestones));
    
    // Then update state
    setHabitCompletions([]);
    setMilestones(resetMilestones);
  };

  // Factory reset: clears all localStorage and reloads the app
  const factoryReset = () => {
    // Prevent save effects from re-saving data before reload
    isResetting.current = true;
    
    // Clear all storage keys
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Also clear React state to ensure nothing gets re-saved
    setHabits([]);
    setHabitCompletions([]);
    setGoals([]);
    setMilestones([]);
    setCustomPersons([]);
    
    // Use setTimeout to ensure state updates are processed before reload
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const value: AppContextType = {
    habits,
    habitCompletions,
    setHabits,
    addHabit,
    updateHabit,
    archiveHabit,
    unarchiveHabit,
    pauseHabit,
    resumeHabit,
    toggleHabitCompletion,
    markHabitSkipped,
    updateHabitCompletion,
    goals,
    milestones,
    addGoal,
    updateGoal,
    deleteGoal,
    archiveGoal,
    unarchiveGoal,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    toggleMilestone,
    customPersons,
    addCustomPerson,
    renamePerson,
    resetProgress,
    factoryReset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
