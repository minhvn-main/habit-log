interface TodayProgressCardProps {
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export const TodayProgressCard = ({ completedCount, totalCount, percentage }: TodayProgressCardProps) => {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        Today's progress
      </p>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl font-bold tabular-nums text-foreground">{percentage}%</span>
        <span className="text-muted-foreground text-sm">
          {completedCount} / {totalCount} completed
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
