import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { GoalForm, GoalFormData, MilestoneInput, getDefaultGoalFormData } from "@/components/GoalForm";
import { toast } from "sonner";

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddGoalModal = ({ isOpen, onClose }: AddGoalModalProps) => {
  const { addGoal, addMilestone, customPersons, addCustomPerson } = useApp();
  const [formData, setFormData] = useState<GoalFormData>(getDefaultGoalFormData());
  const [milestones, setMilestones] = useState<MilestoneInput[]>([]);
  const [customPersonName, setCustomPersonName] = useState("");
  const [showCustomPersonInput, setShowCustomPersonInput] = useState(false);

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

  const resetForm = () => {
    setFormData(getDefaultGoalFormData());
    setMilestones([]);
    setCustomPersonName("");
    setShowCustomPersonInput(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // Add custom person if needed
    if (customPersonName.trim() && !customPersons.includes(customPersonName.trim())) {
      addCustomPerson(customPersonName.trim());
    }

    // Add the goal and get the generated ID
    const goalId = addGoal({
      title: formData.title,
      description: formData.description,
      assignedTo: formData.assignedTo,
      targetDate: formData.targetDate,
    });
    
    // Add milestones using the returned goal ID
    milestones.forEach((milestone, index) => {
      if (milestone.title.trim()) {
        addMilestone({
          goalId,
          title: milestone.title,
          description: milestone.description,
          deadline: milestone.deadline,
          completed: false,
          order: index,
        });
      }
    });

    resetForm();
    onClose();
    toast.success("Goal added successfully");
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const addMilestoneInput = () => {
    setMilestones(prev => [...prev, {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      deadline: "",
    }]);
  };

  const updateMilestoneInput = (id: string, field: keyof MilestoneInput, value: string) => {
    setMilestones(prev => prev.map(milestone =>
      milestone.id === id ? { ...milestone, [field]: value } : milestone
    ));
  };

  const removeMilestoneInput = (id: string) => {
    setMilestones(prev => prev.filter(milestone => milestone.id !== id));
  };

  const reorderMilestone = (id: string, direction: 'up' | 'down') => {
    setMilestones(prev => {
      const index = prev.findIndex(m => m.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newArr = [...prev];
      [newArr[index], newArr[newIndex]] = [newArr[newIndex], newArr[index]];
      return newArr;
    });
  };

  const handleCustomPersonSubmit = () => {
    if (customPersonName.trim()) {
      addCustomPerson(customPersonName.trim());
      setFormData(prev => ({ ...prev, assignedTo: customPersonName.trim() }));
      setCustomPersonName("");
      setShowCustomPersonInput(false);
    }
  };

  const allPersonOptions = ["myself", ...customPersons];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel} />
      
      <div className="relative w-full max-w-[calc(100vw-2rem)] sm:max-w-lg bg-card rounded-2xl shadow-xl max-h-[calc(100dvh-6rem)] mt-4 flex flex-col overflow-hidden" style={{ paddingLeft: 'max(0px, env(safe-area-inset-left))', paddingRight: 'max(0px, env(safe-area-inset-right))' }}>
        {/* Sticky header */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-border">
          <button
            aria-label="Close"
            onClick={handleCancel}
            className="absolute right-4 top-4 p-2 rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <h2 className="text-xl font-semibold text-foreground break-words">Add goal</h2>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pb-8 touch-action-manipulation">
          <GoalForm
            formData={formData}
            setFormData={setFormData}
            milestones={milestones}
            onAddMilestone={addMilestoneInput}
            onUpdateMilestone={updateMilestoneInput}
            onRemoveMilestone={removeMilestoneInput}
            onReorderMilestone={reorderMilestone}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Add goal"
            submitDisabled={!formData.title.trim()}
            allPersonOptions={allPersonOptions}
            showCustomPersonInput={showCustomPersonInput}
            setShowCustomPersonInput={setShowCustomPersonInput}
            customPersonName={customPersonName}
            setCustomPersonName={setCustomPersonName}
            onCustomPersonSubmit={handleCustomPersonSubmit}
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
              disabled={!formData.title.trim()}
            >
              Add goal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
