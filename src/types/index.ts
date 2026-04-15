export type HabitFrequency = "daily" | "weekly" | "custom" | "as-needed";

export type HabitColor = "green" | "blue" | "orange" | "purple" | "pink" | "yellow";

export type Person = "myself" | "alex" | "sarah";

export type GoalType = "consecutive-days" | "number-of-times" | "by-specific-date";

export type GoalPeriod = "total" | "per-month" | "per-week";

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: HabitFrequency;
  color: HabitColor;
  isActive: boolean;
  isPaused?: boolean;
  pausedAt?: string;
  createdAt: string;
  startDate?: string; // YYYY-MM-DD format - tracking starts from this date
  archivedAt?: string;
  order?: number;
  // Weekly frequency settings
  weeklyDays?: string[]; // ['monday', 'tuesday', etc.]
  // Custom interval settings
  customInterval?: number; // Every X days
  // Goal settings
  goalType?: GoalType;
  goalTarget?: number;
  goalPeriod?: GoalPeriod;
  targetDate?: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  skipped?: boolean;
  difficulty?: number; // 1-5 rating
  notes?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  assignedTo: string; // Changed from Person to string to support custom names
  targetDate?: string;
  createdAt: string;
  completedAt?: string;
  archivedAt?: string; // Add archiving support
  startDate?: string; // YYYY-MM-DD format
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  deadline?: string; // Added deadline support
  order: number;
}

export interface Stats {
  totalHabits: number;
  activeHabits: number;
  completedToday: number;
  currentStreak: number;
  longestStreak: number;
  totalGoals: number;
  completedGoals: number;
}
