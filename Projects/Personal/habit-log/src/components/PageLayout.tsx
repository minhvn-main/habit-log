import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  headerRight?: ReactNode;
}

export const PageLayout = ({ 
  children, 
  title, 
  subtitle, 
  action, 
  headerRight 
}: PageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-24 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {headerRight}
              {action}
            </div>
          </div>
        </div>
        
        {/* Page content */}
        {children}
      </div>
    </div>
  );
};