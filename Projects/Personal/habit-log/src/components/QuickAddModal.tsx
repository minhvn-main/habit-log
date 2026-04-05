
import { useState } from "react";
import { Plus, Target, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddHabitModal } from "./AddHabitModal";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAddModal = ({ isOpen, onClose }: QuickAddModalProps) => {
  const [showAddHabit, setShowAddHabit] = useState(false);

  const handleAddHabit = () => {
    setShowAddHabit(true);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Quick Add</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <Button
              onClick={handleAddHabit}
              className="w-full h-16 text-left justify-start bg-card hover:bg-accent border border-border"
              variant="ghost"
            >
              <div className="w-11 h-11 bg-muted rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <CheckSquare className="text-muted-foreground" size={22} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">Add Habit</div>
                <div className="text-sm text-muted-foreground">Create a new daily habit</div>
              </div>
            </Button>

            <Button
              className="w-full h-16 text-left justify-start bg-card hover:bg-accent border border-border"
              variant="ghost"
            >
              <div className="w-11 h-11 bg-muted rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Target className="text-muted-foreground" size={22} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">Add Goal</div>
                <div className="text-sm text-muted-foreground">Set a new milestone goal</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AddHabitModal 
        isOpen={showAddHabit}
        onClose={() => setShowAddHabit(false)}
      />
    </>
  );
};
