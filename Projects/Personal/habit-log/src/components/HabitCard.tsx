import { useApp } from "@/contexts/AppContext";
import { Habit } from "@/types";
import { cn } from "@/lib/utils";
import {
  calculateHabitStats,
  getHabitGoalDisplay,
  getFrequencyDisplay,
  getCompletionIndicator,
} from "@/utils/habitStats";

interface HabitCardProps {
  habit: Habit;
  isPaused?: boolean;
  isArchived?: boolean;
  isFinished?: boolean;
  onClick?: (habit: Habit) => void;
}

// background tints per color
const colorTheme: Record<
  NonNullable<Habit["color"]>,
  { bg: string; rail: string; border: string }
> = {
  green:  { bg: "bg-emerald-50", rail: "bg-emerald-500", border: "border-emerald-100" },
  blue:   { bg: "bg-blue-50",    rail: "bg-blue-500",    border: "border-blue-100" },
  orange: { bg: "bg-orange-50",  rail: "bg-orange-500",  border: "border-orange-100" },
  purple: { bg: "bg-purple-50",  rail: "bg-purple-500",  border: "border-purple-100" },
  pink:   { bg: "bg-pink-50",    rail: "bg-pink-500",    border: "border-pink-100" },
  yellow: { bg: "bg-yellow-50",  rail: "bg-yellow-500",  border: "border-yellow-100" },
  // add extended palette here (red, teal, etc.)
};

export const HabitCard = ({
  habit,
  isPaused = false,
  isArchived = false,
  isFinished = false,
  onClick,
}: HabitCardProps) => {
  const { habitCompletions } = useApp();
  const stats = calculateHabitStats(habit, habitCompletions);

  const goalDisplay = getHabitGoalDisplay(habit);   // { text, icon, type }
  const frequencyDisplay = getFrequencyDisplay(habit);
  const completionIndicator = getCompletionIndicator(habit, stats);

  const theme = colorTheme[habit.color] ?? colorTheme.blue;
  const cardOpacity = isArchived ? "opacity-60" : isFinished ? "opacity-80" : "opacity-100";

  const handleCardClick = () => {
    if (onClick) onClick(habit);
  };

  const showProgressBar = habit.goalType && habit.goalTarget;
  const percent = stats.completionRate;

  // Decide which meta to show top-right and which above the bar
  const topRightMeta = goalDisplay.text !== "∞ No target set"
    ? `${goalDisplay.icon} ${goalDisplay.text}`
    : frequencyDisplay;

  const aboveBarLeftMeta =
    topRightMeta === frequencyDisplay ? undefined : frequencyDisplay;

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 transition-shadow hover:shadow-sm",
        theme.bg,
        theme.border,
        cardOpacity
      )}
      onClick={handleCardClick}
    >
      {/* Colored left rail */}
      <div className={cn("absolute left-0 top-0 h-full w-1 rounded-l-xl", theme.rail)} />

      {/* Row 1: Habit name + top-right meta */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="font-bold text-foreground text-lg truncate">
            {habit.name}
          </h3>
          {habit.description && (
            <p className="text-sm text-muted-foreground truncate">
              {habit.description}
            </p>
          )}
        </div>

        {topRightMeta && (
          <span className="shrink-0 text-xs font-medium text-muted-foreground whitespace-nowrap">
            {topRightMeta}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-3 text-sm">
        <span className="text-emerald-700">✓ {stats.totalDone}</span>
        <span className="text-rose-600">✗ {stats.totalSkipped}</span>
      </div>

      {/* Progress */}
      {showProgressBar ? (
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            {aboveBarLeftMeta && <span>{aboveBarLeftMeta}</span>}
            <span>{goalDisplay.text}</span>
          </div>

          <div className="h-2 w-full rounded-full bg-white/70 border border-white/70">
            <div
              className={cn("h-full rounded-full", theme.rail)}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="mt-1 text-right text-xs text-muted-foreground">
            {completionIndicator
              ? completionIndicator.text
              : `${percent}%`}
          </div>
        </div>
      ) : (
        <div className="bg-white/70 rounded-lg py-3 text-center text-sm text-muted-foreground">
          ∞ No target set
        </div>
      )}
    </div>
  );
};