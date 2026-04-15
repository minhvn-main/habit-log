// src/lib/habitSchedule.ts
import { Habit } from "@/types";

/**
 * Parse a YYYY-MM-DD string as LOCAL midnight, not UTC midnight.
 * new Date("2024-01-15") parses as UTC → wrong in UTC- timezones.
 */
export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

/**
 * Single authoritative "is this habit due on this date?" function.
 * - daily: always true after startDate
 * - weekly: true on specified day names (stored as "monday", "tuesday", …)
 * - custom: true on startDate + multiples of customInterval
 * - as-needed: false (user-initiated; never counts against streak or schedule)
 */
export function isHabitDueOnDate(habit: Habit, date: Date): boolean {
  if (!habit.isActive || habit.archivedAt || habit.isPaused) return false;

  const dateStr = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  if (habit.startDate && dateStr < habit.startDate) return false;

  const dayName = DAY_NAMES[date.getDay()];

  switch (habit.frequency) {
    case "daily":
      return true;
    case "weekly":
      if (habit.weeklyDays && habit.weeklyDays.length > 0) {
        return habit.weeklyDays.includes(dayName);
      }
      return true;
    case "custom": {
      if (!habit.customInterval) return false;
      const startDate = habit.startDate
        ? parseLocalDate(habit.startDate)
        : new Date(habit.createdAt); // createdAt is a full ISO timestamp, not YYYY-MM-DD — parseLocalDate not needed
      const daysDiff = Math.floor(
        (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff >= 0 && daysDiff % habit.customInterval === 0;
    }
    case "as-needed":
      return false;
    default:
      return false; // unknown frequency → treat as not due (safe over-default rather than showing hidden habits)
  }
}

/**
 * Convenience wrapper for today.
 */
export function isHabitDueToday(habit: Habit): boolean {
  return isHabitDueOnDate(habit, new Date());
}
