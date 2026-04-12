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
      {/* Sticky header with frosted glass on scroll */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border/50 px-4 py-3">
        <div className="flex items-start justify-between gap-4 max-w-3xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {headerRight}
            {action}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="p-4 pb-24 space-y-6 max-w-3xl mx-auto">
        {children}
      </div>
    </div>
  );
};
