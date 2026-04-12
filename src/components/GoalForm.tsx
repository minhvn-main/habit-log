import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Trash2, ChevronUp, ChevronDown, X, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GoalFormData {
  title: string;
  description: string;
  assignedTo: string;
  targetDate: string;
}

export interface MilestoneInput {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  isNew?: boolean;
}

export const getDefaultGoalFormData = (): GoalFormData => ({
  title: "",
  description: "",
  assignedTo: "myself",
  targetDate: "",
});

interface GoalFormProps {
  formData: GoalFormData;
  setFormData: React.Dispatch<React.SetStateAction<GoalFormData>>;
  milestones: MilestoneInput[];
  onAddMilestone: () => void;
  onUpdateMilestone: (id: string, field: keyof MilestoneInput, value: string) => void;
  onRemoveMilestone: (id: string) => void;
  onReorderMilestone: (id: string, direction: 'up' | 'down') => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
  allPersonOptions: string[];
  showCustomPersonInput: boolean;
  setShowCustomPersonInput: (show: boolean) => void;
  customPersonName: string;
  setCustomPersonName: (name: string) => void;
  onCustomPersonSubmit: () => void;
  hideButtons?: boolean;
}

export const GoalForm = ({
  formData,
  setFormData,
  milestones,
  onAddMilestone,
  onUpdateMilestone,
  onRemoveMilestone,
  onReorderMilestone,
  onSubmit,
  onCancel,
  submitLabel,
  submitDisabled = false,
  allPersonOptions,
  showCustomPersonInput,
  setShowCustomPersonInput,
  customPersonName,
  setCustomPersonName,
  onCustomPersonSubmit,
  hideButtons = false,
}: GoalFormProps) => {
  const [openDatePicker, setOpenDatePicker] = useState<string | null>(null);
  const [targetDateOpen, setTargetDateOpen] = useState(false);
  const inputClassName = "bg-muted border-border rounded-lg px-3 py-2 focus:border-primary/50 focus:ring-1 focus:ring-primary/30";
  const labelClassName = "text-sm font-medium text-muted-foreground";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 max-w-full">
      {/* Title */}
      <div className="space-y-2">
        <label className={labelClassName}>Title *</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          onKeyDown={handleKeyDown}
          placeholder="Enter goal title"
          className={cn(inputClassName, "w-full max-w-full")}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className={labelClassName}>Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Optional description"
          className={cn(inputClassName, "resize-none")}
          rows={3}
        />
      </div>

      {/* Assigned To + Target Date grouping */}
      <div className="space-y-4">
        {/* Assigned To */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={labelClassName}>Assigned to</label>
            <button
              type="button"
              onClick={() => setShowCustomPersonInput(!showCustomPersonInput)}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              + Add person
            </button>
          </div>
          
          {showCustomPersonInput && (
            <div className="flex gap-2">
              <Input
                value={customPersonName}
                onChange={(e) => setCustomPersonName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter person name"
                className={inputClassName}
              />
              <Button
                type="button"
                variant="outline"
                onClick={onCustomPersonSubmit}
                disabled={!customPersonName.trim()}
                className="border-border hover:bg-muted"
              >
                Add
              </Button>
            </div>
          )}
          
          <Select
            value={formData.assignedTo}
            onValueChange={(value: string) =>
              setFormData(prev => ({ ...prev, assignedTo: value }))
            }
          >
            <SelectTrigger className={inputClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allPersonOptions.map((person) => (
                <SelectItem key={person} value={person}>
                  {person === "myself" ? "Myself" : person}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Target Date */}
        <div className="space-y-2">
          <label className={labelClassName}>Target date</label>
          <DatePickerField
            value={formData.targetDate}
            onChange={(date) => setFormData(prev => ({ ...prev, targetDate: date }))}
            placeholder="Pick a date"
            className={inputClassName}
            open={targetDateOpen}
            onOpenChange={setTargetDateOpen}
          />
        </div>
      </div>

      {/* Milestones Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className={labelClassName}>Milestones</label>
          <button
            type="button"
            onClick={onAddMilestone}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            + Add milestone
          </button>
        </div>
        
        {milestones.length > 0 && (
          <div className="space-y-2">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="flex gap-2 items-start">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 mt-1">
                  <button
                    type="button"
                    onClick={() => onReorderMilestone(milestone.id, 'up')}
                    disabled={index === 0}
                    className={cn(
                      "p-1 rounded transition-colors",
                      index === 0
                        ? "text-muted-foreground/30 cursor-not-allowed"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onReorderMilestone(milestone.id, 'down')}
                    disabled={index === milestones.length - 1}
                    className={cn(
                      "p-1 rounded transition-colors",
                      index === milestones.length - 1
                        ? "text-muted-foreground/30 cursor-not-allowed"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                <div className="flex-1 space-y-1.5">
                  <Input
                    value={milestone.title}
                    onChange={(e) => onUpdateMilestone(milestone.id, "title", e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Milestone ${index + 1}`}
                    className={inputClassName}
                  />
                  {/* Clearable date picker */}
                  <div className="flex items-center gap-2">
                    <Popover 
                      open={openDatePicker === milestone.id} 
                      onOpenChange={(open) => setOpenDatePicker(open ? milestone.id : null)}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            inputClassName,
                            "flex-1 flex items-center gap-2 text-left text-sm",
                            !milestone.deadline && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon size={14} className="text-muted-foreground" />
                          {milestone.deadline 
                            ? format(new Date(milestone.deadline), "MMM d, yyyy")
                            : "No deadline"
                          }
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="min-w-[280px] w-[calc(100vw-3rem)] max-w-[320px] p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={milestone.deadline ? new Date(milestone.deadline) : undefined}
                          onSelect={(date) => {
                            onUpdateMilestone(
                              milestone.id, 
                              "deadline", 
                              date ? date.toISOString().slice(0, 10) : ""
                            );
                            setOpenDatePicker(null);
                          }}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    {milestone.deadline && (
                      <button
                        type="button"
                        onClick={() => onUpdateMilestone(milestone.id, "deadline", "")}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveMilestone(milestone.id)}
                  className="p-2 text-muted-foreground hover:text-red-500 transition-colors mt-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!hideButtons && (
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="flex-1 text-muted-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
            disabled={submitDisabled}
          >
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
};
