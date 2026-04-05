interface DateColorResult {
  text: string;
  bg: string;
}

export const getDeadlineColors = (
  targetDate: string | undefined,
  isCompleted: boolean = false
): DateColorResult | null => {
  if (!targetDate) return null;
  
  // Completed items always use muted slate
  if (isCompleted) {
    return { text: 'text-slate-600', bg: 'bg-slate-100' };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    // Overdue
    return { text: 'text-rose-600', bg: 'bg-rose-50' };
  } else if (diffDays <= 7) {
    // Due soon (within 7 days)
    return { text: 'text-amber-600', bg: 'bg-amber-50' };
  } else {
    // Future (more than 7 days)
    return { text: 'text-slate-600', bg: 'bg-slate-100' };
  }
};
