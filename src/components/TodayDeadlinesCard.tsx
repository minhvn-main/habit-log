import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getDeadlineColors } from "@/utils/dateColors";

interface Deadline {
  id: string;
  title: string;
  targetDate: string;
  daysUntil: number;
  assignedTo?: string;
  nextMilestone?: {
    title: string;
    deadline?: string;
  };
}

interface TodayDeadlinesCardProps {
  deadlines: Deadline[];
  showOwner?: boolean;
}

export const TodayDeadlinesCard = ({ deadlines, showOwner = false }: TodayDeadlinesCardProps) => {
  const navigate = useNavigate();

  if (deadlines.length === 0) return null;

  const getDaysLabel = (daysUntil: number) => {
    if (daysUntil < 0) {
      const overdueDays = Math.abs(daysUntil);
      return `${overdueDays} ${overdueDays === 1 ? "day" : "days"} overdue`;
    }
    if (daysUntil === 0) return "Today";
    return `${daysUntil} ${daysUntil === 1 ? "day" : "days"}`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Upcoming Goal Deadlines</h3>
      </div>
      <div>
        {deadlines.map(deadline => {
          const colors = getDeadlineColors(deadline.targetDate, false);
          return (
            <button
              key={deadline.id}
              onClick={() => navigate(`/goals?scroll=${deadline.id}`)}
              className="w-full px-3 py-2 flex flex-col hover:bg-muted transition-colors text-left"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-foreground truncate pr-3">
                  {deadline.title}
                </span>
                <span 
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
                    colors.bg,
                    colors.text
                  )}
                >
                  {getDaysLabel(deadline.daysUntil)}
                </span>
              </div>
              {showOwner && deadline.assignedTo && deadline.assignedTo.toLowerCase() !== "myself" && (
                <span className="text-xs text-muted-foreground mt-0.5">
                  Assigned to: {deadline.assignedTo}
                </span>
              )}
              {deadline.nextMilestone && (
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                  <span className="truncate">
                    Next: {deadline.nextMilestone.title}
                  </span>
                  {deadline.nextMilestone.deadline && (
                    <span className="text-muted-foreground/60 whitespace-nowrap">
                      · {format(new Date(deadline.nextMilestone.deadline), "MMM d")}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
