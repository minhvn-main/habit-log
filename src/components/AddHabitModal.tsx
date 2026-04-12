import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { HabitForm, HabitFormData, getDefaultFormData } from "@/components/HabitForm";
import { toast } from "sonner";

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddHabitModal = ({ isOpen, onClose }: AddHabitModalProps) => {
  const { addHabit } = useApp();
  const [formData, setFormData] = useState<HabitFormData>(getDefaultFormData());

  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const habitData: any = {
      name: formData.name,
      description: formData.description,
      frequency: formData.frequency,
      color: formData.color,
      isActive: true,
    };

    // Add frequency-specific settings
    if (formData.frequency === "weekly" && formData.weeklyDays.length > 0) {
      habitData.weeklyDays = formData.weeklyDays;
    }
    if (formData.frequency === "custom") {
      habitData.customInterval = formData.customInterval;
    }

    // Add goal settings
    if (formData.goalType !== "none") {
      habitData.goalType = formData.goalType;
      habitData.goalTarget = formData.goalTarget;
      
      if (formData.goalType === "number-of-times") {
        habitData.goalPeriod = formData.goalPeriod;
      }
      if (formData.goalType === "by-specific-date" && formData.targetDate) {
        habitData.targetDate = formData.targetDate;
      }
    }

    addHabit(habitData);
    handleCancel();
    toast.success("Habit added successfully");
  };

  const handleCancel = () => {
    setFormData(getDefaultFormData());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-[calc(100vw-2rem)] sm:max-w-lg bg-card rounded-2xl shadow-xl max-h-[calc(100dvh-6rem)] mt-4 flex flex-col overflow-hidden" style={{ paddingLeft: 'max(0px, env(safe-area-inset-left))', paddingRight: 'max(0px, env(safe-area-inset-right))' }}>
        {/* Sticky header */}
        <div className="flex-shrink-0 p-6 pb-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X size={20} />
          </Button>

          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground break-words">Add habit</h2>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pt-5 touch-action-manipulation">
          <HabitForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Add habit"
            submitDisabled={!formData.name.trim()}
            hideButtons
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="flex-1 text-muted-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
              disabled={!formData.name.trim()}
            >
              Add habit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
