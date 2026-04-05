
import { ReactNode, useState } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { QuickAddModal } from "./QuickAddModal";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  return (
    <div className="mobile-container">
      <main className="pb-24 min-h-screen bg-background">
        {children}
      </main>
      
      <BottomNavigation />
      
      <QuickAddModal 
        isOpen={isQuickAddOpen} 
        onClose={() => setIsQuickAddOpen(false)} 
      />
    </div>
  );
};
