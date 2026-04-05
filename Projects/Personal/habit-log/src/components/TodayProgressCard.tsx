interface TodayProgressCardProps {
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export const TodayProgressCard = ({ completedCount, totalCount, percentage }: TodayProgressCardProps) => {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm p-3">
      <p className="text-xs text-muted-foreground mb-1">Today's progress</p>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold text-foreground">{percentage}%</span>
        <span className="text-muted-foreground text-sm">
          {completedCount} / {totalCount} completed
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div 
          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
