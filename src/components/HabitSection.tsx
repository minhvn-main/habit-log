
import { Habit } from "@/types";
import { HabitCard } from "./HabitCard";

interface HabitSectionProps {
  habits: Habit[];
  isPaused?: boolean;
  isArchived?: boolean;
  isFinished?: boolean;
  onHabitClick?: (habit: Habit) => void;
}

export const HabitSection = ({ 
  habits, 
  isPaused = false, 
  isArchived = false, 
  isFinished = false,
  onHabitClick
}: HabitSectionProps) => {
  return (
    <div className="space-y-4">
      {habits.map((habit) => (
        <HabitCard 
          key={habit.id} 
          habit={habit} 
          isPaused={isPaused}
          isArchived={isArchived}
          isFinished={isFinished}
          onClick={onHabitClick}
        />
      ))}
    </div>
  );
};
