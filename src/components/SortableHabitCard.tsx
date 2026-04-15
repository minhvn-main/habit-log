import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Habit, HabitCompletion } from "@/types";
import { HabitListCard } from "@/components/HabitListCard";

interface SortableHabitCardProps {
  habit: Habit;
  completions: HabitCompletion[];
  onClick: () => void;
}

export const SortableHabitCard = ({ habit, completions, onClick }: SortableHabitCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: habit.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 touch-none text-muted-foreground p-1 cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical size={18} />
      </button>
      <div className="flex-1 min-w-0">
        <HabitListCard
          habit={habit}
          completions={completions}
          status="active"
          onClick={onClick}
        />
      </div>
    </div>
  );
};
