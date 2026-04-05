import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  count: number;
  sectionId: string;
  children: React.ReactNode;
  variant?: 'active' | 'paused' | 'finished' | 'completed' | 'archived';
  defaultCollapsed?: boolean;
}

export const CollapsibleSection = ({ 
  title, 
  count, 
  sectionId, 
  children,
  variant = 'active',
  defaultCollapsed = false
}: CollapsibleSectionProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const getHeaderTextClass = () => {
    switch (variant) {
      case 'active':
        return 'text-foreground font-semibold';
      case 'paused':
        return 'text-muted-foreground';
      case 'finished':
      case 'completed':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'archived':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  const getHeaderBgClass = () => {
    switch (variant) {
      case 'active':
        return 'bg-primary/10 dark:bg-primary/5';
      case 'paused':
        return 'bg-muted';
      case 'finished':
      case 'completed':
        return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'archived':
        return 'bg-muted';
      default:
        return 'bg-primary/10 dark:bg-primary/5';
    }
  };

  return (
    <div className="space-y-3">
      <div 
        className={cn(
          "flex items-center justify-between px-3 py-2 cursor-pointer select-none rounded-xl mb-2",
          getHeaderBgClass()
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight size={18} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={18} className="text-muted-foreground" />
          )}
          <h2 className={cn("font-semibold", getHeaderTextClass())}>
            {title}
          </h2>
        </div>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      {!isCollapsed && (
        <div className="space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};
