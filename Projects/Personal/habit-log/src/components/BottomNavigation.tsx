
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, CheckSquare, Home, Target, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    id: "today",
    label: "Today",
    icon: Home,
    path: "/"
  },
  {
    id: "calendar", 
    label: "Calendar",
    icon: Calendar,
    path: "/calendar"
  },
  {
    id: "habits",
    label: "Habits", 
    icon: CheckSquare,
    path: "/habits"
  },
  {
    id: "goals",
    label: "Goals",
    icon: Target,
    path: "/goals"
  },
  {
    id: "stats",
    label: "Stats",
    icon: BarChart3, 
    path: "/stats"
  }
];

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-card border-t border-border z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around py-2">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={cn(
                "touch-target flex flex-col items-center justify-center space-y-1 transition-colors",
                isActive 
                  ? "bottom-nav-active" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
