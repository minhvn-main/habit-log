import { useState, useEffect } from "react";
import { X, Archive, Trash2, CalendarIcon, ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useApp } from "@/contexts/AppContext";
import { Goal } from "@/types";
import { Button } from "@/components/ui/button";
import { GoalForm, GoalFormData, MilestoneInput } from "@/components/GoalForm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal;
}

export const EditGoalModal = ({ isOpen, onClose, goal }: EditGoalModalProps) => {
  const { updateGoal, deleteGoal, milestones, addMilestone, updateMilestone, deleteMilestone, customPersons, addCustomPerson } = useApp();
  const [formData, setFormData] = useState<GoalFormData>({
    title: goal.title,
    description: goal.description || "",
    assignedTo: goal.assignedTo,
    targetDate: goal.targetDate || "",
  });
  const [editMilestones, setEditMilestones] = useState<MilestoneInput[]>([]);
  const [customPersonName, setCustomPersonName] = useState("");
  const [showCustomPersonInput, setShowCustomPersonInput] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    goal.startDate ? parseISO(goal.startDate)
      : goal.createdAt ? new Date(goal.createdAt)
      : new Date("2026-01-01")
  );

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

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: goal.title,
        description: goal.description || "",
        assignedTo: goal.assignedTo,
        targetDate: goal.targetDate || "",
      });
      
      const goalMilestones = milestones
        .filter(m => m.goalId === goal.id)
        .sort((a, b) => {
          if (a.deadline && b.deadline) {
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          }
          if (a.deadline && !b.deadline) return -1;
          if (!a.deadline && b.deadline) return 1;
          return a.order - b.order;
        })
        .map(m => ({ 
          id: m.id, 
          title: m.title, 
          description: m.description,
          deadline: m.deadline
        }));
      
      setEditMilestones(goalMilestones);
      setCustomPersonName("");
      setShowCustomPersonInput(false);
      setAdvancedOpen(false);
      setStartDate(
        goal.startDate ? parseISO(goal.startDate)
          : goal.createdAt ? new Date(goal.createdAt)
          : new Date("2026-01-01")
      );
    }
  }, [isOpen, goal, milestones]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // Add custom person if needed
    if (customPersonName.trim() && !customPersons.includes(customPersonName.trim())) {
      addCustomPerson(customPersonName.trim());
    }

    const updates: Partial<Goal> = { ...formData };
    if (startDate) {
      updates.startDate = format(startDate, "yyyy-MM-dd");
    }

    updateGoal(goal.id, updates);

    // Handle milestone updates with proper ordering based on deadlines
    const milestonesWithDeadlines: MilestoneInput[] = [];
    const milestonesWithoutDeadlines: MilestoneInput[] = [];

    editMilestones.forEach((milestone) => {
      if (milestone.deadline) {
        milestonesWithDeadlines.push(milestone);
      } else {
        milestonesWithoutDeadlines.push(milestone);
      }
    });

    milestonesWithDeadlines.sort((a, b) => 
      new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
    );

    const orderedMilestones = [...milestonesWithDeadlines, ...milestonesWithoutDeadlines];

    orderedMilestones.forEach((milestone, index) => {
      if (milestone.title.trim()) {
        if (milestone.isNew) {
          addMilestone({
            goalId: goal.id,
            title: milestone.title,
            description: milestone.description,
            deadline: milestone.deadline,
            completed: false,
            order: index,
          });
        } else {
          updateMilestone(milestone.id, {
            title: milestone.title,
            description: milestone.description,
            deadline: milestone.deadline,
            order: index,
          });
        }
      }
    });

    onClose();
    toast.success("Goal updated successfully");
  };

  const addMilestoneInput = () => {
    setEditMilestones(prev => [...prev, {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      deadline: "",
      isNew: true,
    }]);
  };

  const updateMilestoneInput = (id: string, field: keyof MilestoneInput, value: string) => {
    setEditMilestones(prev => prev.map(milestone =>
      milestone.id === id ? { ...milestone, [field]: value } : milestone
    ));
  };

  const removeMilestoneInput = (id: string) => {
    const milestone = editMilestones.find(m => m.id === id);
    if (milestone && !milestone.isNew) {
      deleteMilestone(id);
    }
    setEditMilestones(prev => prev.filter(milestone => milestone.id !== id));
  };

  const reorderMilestone = (id: string, direction: 'up' | 'down') => {
    setEditMilestones(prev => {
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

  const handleArchive = () => {
    if (goal.archivedAt) {
      if (confirm("Are you sure you want to reactivate this goal?")) {
        updateGoal(goal.id, { archivedAt: undefined });
        onClose();
        toast.success("Goal reactivated");
      }
    } else {
      if (confirm("Are you sure you want to archive this goal?")) {
        updateGoal(goal.id, { archivedAt: new Date().toISOString() });
        onClose();
        toast.success("Goal archived");
      }
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to permanently delete this goal? This action cannot be undone.")) {
      deleteGoal(goal.id);
      onClose();
      toast.success("Goal deleted");
    }
  };

  const allPersonOptions = ["myself", ...customPersons];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-[calc(100vw-2rem)] sm:max-w-lg bg-card rounded-2xl shadow-xl max-h-[calc(100dvh-6rem)] mt-4 flex flex-col overflow-hidden" style={{ paddingLeft: 'max(0px, env(safe-area-inset-left))', paddingRight: 'max(0px, env(safe-area-inset-right))' }}>
        {/* Sticky header */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-border">
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <h2 className="text-xl font-semibold text-foreground">Edit goal</h2>
            {goal.completedAt ? (
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded">completed</span>
            ) : goal.archivedAt ? (
              <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded">archived</span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded">active</span>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pb-8 space-y-5 touch-action-manipulation">
          <GoalForm
            formData={formData}
            setFormData={setFormData}
            milestones={editMilestones}
            onAddMilestone={addMilestoneInput}
            onUpdateMilestone={updateMilestoneInput}
            onRemoveMilestone={removeMilestoneInput}
            onReorderMilestone={reorderMilestone}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel="Save changes"
            submitDisabled={!formData.title.trim()}
            allPersonOptions={allPersonOptions}
            showCustomPersonInput={showCustomPersonInput}
            setShowCustomPersonInput={setShowCustomPersonInput}
            customPersonName={customPersonName}
            setCustomPersonName={setCustomPersonName}
            onCustomPersonSubmit={handleCustomPersonSubmit}
            hideButtons
          />

          {/* Advanced settings */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
              <ChevronDown className={cn("w-4 h-4 transition-transform", advancedOpen && "rotate-180")} />
              Advanced settings
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Start date</label>
                <p className="text-xs text-muted-foreground">When this goal was started</p>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="min-w-[280px] w-[calc(100vw-3rem)] max-w-[320px] p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        setStartDateOpen(false);
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Archive + Delete in single row */}
              <div className="grid grid-cols-2 gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleArchive}
                  size="sm"
                  className="flex flex-col items-center gap-1 h-auto py-2 text-muted-foreground border-border hover:bg-muted"
                >
                  <Archive size={16} />
                  <span className="text-xs">{goal.archivedAt ? "Reactivate" : "Archive"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  size="sm"
                  className="flex flex-col items-center gap-1 h-auto py-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <Trash2 size={16} />
                  <span className="text-xs">Delete</span>
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
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
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
