import { HabitFrequency, HabitColor, GoalType, GoalPeriod } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Shared form data interface
export interface HabitFormData {
  name: string;
  description: string;
  frequency: HabitFrequency;
  color: HabitColor;
  weeklyDays: string[];
  customInterval: number;
  goalType: GoalType | "none";
  goalTarget: number;
  goalPeriod: GoalPeriod;
  targetDate: string;
}

// Default form data factory
export const getDefaultFormData = (): HabitFormData => ({
  name: "",
  description: "",
  frequency: "daily",
  color: "green",
  weeklyDays: [],
  customInterval: 7,
  goalType: "none",
  goalTarget: 30,
  goalPeriod: "total",
  targetDate: "",
});

// Shared constants
const FREQUENCIES: Array<{ value: HabitFrequency; label: string }> = [
  { value: "daily", label: "daily" },
  { value: "weekly", label: "weekly" },
  { value: "custom", label: "custom interval" },
  { value: "as-needed", label: "as needed" },
];

const GOAL_TYPES: Array<{ value: GoalType; label: string }> = [
  { value: "consecutive-days", label: "consecutive days" },
  { value: "number-of-times", label: "number of times" },
  { value: "by-specific-date", label: "by specific date" },
];

const GOAL_PERIODS: Array<{ value: GoalPeriod; label: string }> = [
  { value: "total", label: "total" },
  { value: "per-month", label: "per month" },
  { value: "per-week", label: "per week" },
];

const WEEKDAYS = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

interface HabitFormProps {
  formData: HabitFormData;
  setFormData: React.Dispatch<React.SetStateAction<HabitFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
  hideButtons?: boolean;
}

export const HabitForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  submitLabel,
  submitDisabled = false,
  hideButtons = false,
}: HabitFormProps) => {
  const toggleWeekday = (day: string) => {
    setFormData(prev => ({
      ...prev,
      weeklyDays: prev.weeklyDays.includes(day)
        ? prev.weeklyDays.filter(d => d !== day)
        : [...prev.weeklyDays, day]
    }));
  };

  const [targetDateOpen, setTargetDateOpen] = useState(false);
  const inputClassName = "bg-muted border-border rounded-lg px-3 py-2 focus:border-primary/50 focus:ring-1 focus:ring-primary/30";
  const labelClassName = "text-sm font-medium text-muted-foreground";

  return (
    <form onSubmit={onSubmit} className="space-y-5 max-w-full">
      {/* Name */}
      <div className="space-y-2">
        <label className={labelClassName}>Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter habit name"
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

      {/* Frequency Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className={labelClassName}>Frequency</label>
          <Select
            value={formData.frequency}
            onValueChange={(value: HabitFrequency) =>
              setFormData(prev => ({ ...prev, frequency: value }))
            }
          >
            <SelectTrigger className={inputClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((freq) => (
                <SelectItem key={freq.value} value={freq.value}>
                  {freq.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Weekly Days Selection */}
        {formData.frequency === "weekly" && (
          <div className="space-y-2">
            <label className={labelClassName}>Select days</label>
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map((day) => (
                <div key={day.value} className="flex flex-col items-center gap-1">
                  <Checkbox
                    id={day.value}
                    checked={formData.weeklyDays.includes(day.value)}
                    onCheckedChange={() => toggleWeekday(day.value)}
                    className="border-slate-300"
                  />
                  <label htmlFor={day.value} className="text-xs font-medium text-muted-foreground">
                    {day.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Interval */}
        {formData.frequency === "custom" && (
          <div className="space-y-2">
            <label className={labelClassName}>Every X days</label>
            <Input
              type="number"
              min="1"
              value={formData.customInterval}
              onChange={(e) => setFormData(prev => ({ ...prev, customInterval: parseInt(e.target.value) || 1 }))}
              className={inputClassName}
            />
          </div>
        )}
      </div>

      {/* Goal Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className={labelClassName}>Goal type</label>
          <Select
            value={formData.goalType}
            onValueChange={(value: GoalType | "none") =>
              setFormData(prev => ({ ...prev, goalType: value }))
            }
          >
            <SelectTrigger className={inputClassName}>
              <SelectValue placeholder="Optional goal setting" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">no goal</SelectItem>
              {GOAL_TYPES.map((goal) => (
                <SelectItem key={goal.value} value={goal.value}>
                  {goal.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Goal Target */}
        {formData.goalType !== "none" && formData.goalType !== "by-specific-date" && (
          <div className="space-y-2">
            <label className={labelClassName}>Target</label>
            <Input
              type="number"
              min="1"
              value={formData.goalTarget}
              onChange={(e) => setFormData(prev => ({ ...prev, goalTarget: parseInt(e.target.value) || 1 }))}
              className={inputClassName}
            />
          </div>
        )}

        {/* Goal Period */}
        {formData.goalType === "number-of-times" && (
          <div className="space-y-2">
            <label className={labelClassName}>Period</label>
            <Select
              value={formData.goalPeriod}
              onValueChange={(value: GoalPeriod) =>
                setFormData(prev => ({ ...prev, goalPeriod: value }))
              }
            >
              <SelectTrigger className={inputClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Target Date */}
        {formData.goalType === "by-specific-date" && (
          <div className="space-y-2">
            <label className={labelClassName}>Target date</label>
            <Popover open={targetDateOpen} onOpenChange={setTargetDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    inputClassName,
                    !formData.targetDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.targetDate 
                    ? format(parseISO(formData.targetDate), "PPP") 
                    : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="min-w-[280px] w-[calc(100vw-3rem)] max-w-[320px] p-0" 
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={formData.targetDate ? parseISO(formData.targetDate) : undefined}
                  onSelect={(date) => {
                    setFormData(prev => ({ ...prev, targetDate: date ? format(date, "yyyy-MM-dd") : "" }));
                    setTargetDateOpen(false);
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Primary Action Buttons */}
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
