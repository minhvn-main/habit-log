import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Plus, Check, ChevronDown, ChevronRight, ChevronsUpDown, ChevronsDownUp, Settings } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { AddGoalModal } from "@/components/AddGoalModal";
import { EditGoalModal } from "@/components/EditGoalModal";
import { PersonFilter } from "@/components/PersonFilter";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PageLayout } from "@/components/PageLayout";
import { Goal } from "@/types";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { getDeadlineColors } from "@/utils/dateColors";
import { usePeopleSettings } from "@/hooks/usePeopleSettings";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PeopleSettingsModal } from "@/components/PeopleSettingsModal";

export const Goals = () => {
  const { goals, milestones, updateGoal, toggleMilestone, archiveGoal, unarchiveGoal } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [collapsedMilestones, setCollapsedMilestones] = useState<Record<string, boolean>>({});
  const [selectedPersons, setSelectedPersons] = useState<string[]>(['all']);
  const [allCollapsed, setAllCollapsed] = useState(false);
  const { getPersonTextClass, getPersonTextStyle } = usePeopleSettings();
  const [peopleSettingsOpen, setPeopleSettingsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle scroll parameter from Today tab deadlines
  useEffect(() => {
    const scrollId = searchParams.get("scroll");
    if (scrollId) {
      const goalToOpen = goals.find(g => g.id === scrollId);
      if (goalToOpen) {
        setEditingGoal(goalToOpen);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, goals, setSearchParams]);

  // Get all unique persons from goals
  const allPersons = Array.from(new Set(goals.map(goal => goal.assignedTo)));

  // Filter goals by persons
  const filteredGoals = selectedPersons.includes('all') || selectedPersons.length === 0
    ? goals 
    : goals.filter(goal => selectedPersons.includes(goal.assignedTo));

  // Categorize goals by status
  const activeGoals = filteredGoals.filter(goal => !goal.completedAt && !goal.archivedAt);
  const completedGoals = filteredGoals.filter(goal => goal.completedAt && !goal.archivedAt);
  const archivedGoals = filteredGoals.filter(goal => goal.archivedAt);

  const handleCompleteGoal = (id: string) => {
    updateGoal(id, { completedAt: new Date().toISOString() });
  };

  const handleUncompleteGoal = (id: string) => {
    updateGoal(id, { completedAt: undefined });
  };

  const toggleMilestoneSection = (goalId: string) => {
    setCollapsedMilestones(prev => ({
      ...prev,
      [goalId]: !prev[goalId]
    }));
  };

  const toggleAllMilestones = () => {
    const newState = !allCollapsed;
    setAllCollapsed(newState);
    const updated: Record<string, boolean> = {};
    goals.forEach(g => { updated[g.id] = newState; });
    setCollapsedMilestones(updated);
  };

  const getGoalAccentColor = (goal: Goal): string => {
    if (goal.archivedAt) return 'bg-slate-300';
    if (goal.completedAt) return 'bg-emerald-500';
    return 'bg-indigo-400';
  };

  const getGoalStatusBadge = (goal: Goal) => {
    if (goal.archivedAt) {
      return <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Archived</span>;
    }
    if (goal.completedAt) {
      return <span className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">Completed</span>;
    }
    return null;
  };

  const GoalCard = ({ goal, isCompleted = false }: { goal: Goal; isCompleted?: boolean }) => {
    const goalMilestones = milestones
      .filter(m => m.goalId === goal.id)
      .sort((a, b) => {
        // Sort by deadline first (nulls last), then by order
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && b.deadline) return 1;
        if (a.deadline && b.deadline) {
          const dateA = new Date(a.deadline);
          const dateB = new Date(b.deadline);
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
          }
        }
        return a.order - b.order;
      });
    
    const completedMilestones = goalMilestones.filter(m => m.completed).length;
    const totalMilestones = goalMilestones.length;
    const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    
    const deadlineColors = getDeadlineColors(goal.targetDate, !!goal.completedAt);

    const areMilestonesCollapsed = collapsedMilestones[goal.id];

    return (
      <div 
        className={cn(
          "rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow border mb-4",
          goal.archivedAt 
            ? "bg-muted border-border" 
            : "bg-card border-border"
        )}
        onClick={() => setEditingGoal(goal)}
      >
        <div className="flex">
          {/* Left accent bar */}
          <div className={cn("w-1 flex-shrink-0 self-stretch", getGoalAccentColor(goal))} />
          
          {/* Content */}
          <div className="flex-1 p-4">
            {/* Goal Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 pr-4">
                <h3 className={cn(
                  "font-bold text-lg mb-1",
                  goal.archivedAt ? "text-slate-600" : "text-foreground"
                )}>{goal.title}</h3>
                <span 
                  className={cn("text-xs", getPersonTextClass(goal.assignedTo))}
                  style={getPersonTextStyle(goal.assignedTo)}
                >
                  assigned to: {goal.assignedTo}
                </span>
                {goal.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{goal.description}</p>
                )}
              </div>
              
              <div className="text-right flex items-center gap-2">
                {getGoalStatusBadge(goal)}
                {goal.targetDate && deadlineColors && (
                  <div className="text-right">
                    <span className={cn(
                      "text-sm font-medium px-2 py-1 rounded-full",
                      deadlineColors.text,
                      deadlineColors.bg
                    )}>
                      {new Date(goal.targetDate).toLocaleDateString('en-GB')}
                    </span>
                    {!goal.completedAt && !goal.archivedAt && new Date(goal.targetDate) < new Date() && (
                      <span className="text-[10px] text-rose-600 block mt-0.5">Overdue</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Progress */}
            {totalMilestones > 0 && (
              <div className="mb-4 space-y-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {completedMilestones} of {totalMilestones} milestones
                  </span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
              </div>
            )}

            {/* Collapsible Milestones */}
            {goalMilestones.length > 0 && (
              <Collapsible open={!areMilestonesCollapsed} onOpenChange={() => toggleMilestoneSection(goal.id)}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                    {areMilestonesCollapsed ? (
                      <ChevronRight size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                    Milestones ({goalMilestones.length})
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2">
                  {goalMilestones.map(milestone => (
                    <div 
                      key={milestone.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors",
                        milestone.completed ? "bg-emerald-50 dark:bg-emerald-900/20" : "hover:bg-muted"
                      )}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMilestone(milestone.id);
                        }}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                          milestone.completed 
                            ? "bg-emerald-500 border-emerald-500 text-white" 
                            : "border-border hover:border-primary"
                        )}
                      >
                        {milestone.completed && <Check size={12} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          "text-sm font-medium block",
                          milestone.completed ? "text-emerald-700 dark:text-emerald-400 line-through" : "text-foreground"
                        )}>
                          {milestone.title}
                        </span>
                        {milestone.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                      {milestone.deadline && (
                        <div className="text-right flex-shrink-0">
                          <span className={cn(
                            "text-xs",
                            !milestone.completed && new Date(milestone.deadline) < new Date()
                              ? "text-rose-600 font-medium"
                              : "text-muted-foreground"
                          )}>
                            {new Date(milestone.deadline).toLocaleDateString('en-GB')}
                          </span>
                          {!milestone.completed && new Date(milestone.deadline) < new Date() && (
                            <span className="text-[10px] text-rose-600 block">Overdue</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Goal Completion Button - only visible when expanded */}
                  {!isCompleted && !goal.archivedAt && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteGoal(goal.id);
                        }}
                        variant="outline"
                        className="w-full text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        size="sm"
                      >
                        <CheckCircle2 size={16} className="mr-2" />
                        Mark goal as completed
                      </Button>
                    </div>
                  )}

                  {/* Goal Uncompletion Button - only visible when expanded */}
                  {isCompleted && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUncompleteGoal(goal.id);
                        }}
                        variant="outline"
                        className="w-full text-muted-foreground border-border hover:bg-muted"
                        size="sm"
                      >
                        Move to Active Goals
                      </Button>
                    </div>
                  )}

                  {/* Reactivate Button - only visible when expanded */}
                  {goal.archivedAt && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          unarchiveGoal(goal.id);
                        }}
                        variant="outline"
                        className="w-full text-muted-foreground border-border hover:bg-muted"
                        size="sm"
                      >
                        Reactivate Goal
                      </Button>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageLayout
      title="My Goals"
      headerRight={
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button onClick={() => setPeopleSettingsOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors p-2">
            <Settings size={20} />
          </button>
        </div>
      }
    >
      {/* Person Filter */}
      <PersonFilter
        allPersons={allPersons}
        selectedPersons={selectedPersons}
        onPersonsChange={setSelectedPersons}
        rightContent={
          <button
            onClick={toggleAllMilestones}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
            title={allCollapsed ? "Expand all milestones" : "Collapse all milestones"}
          >
            {allCollapsed ? <ChevronsUpDown size={16} /> : <ChevronsDownUp size={16} />}
          </button>
        }
      />

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <CollapsibleSection
          title="Active Goals"
          count={activeGoals.length}
          sectionId="active"
          variant="active"
        >
          {activeGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </CollapsibleSection>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <CollapsibleSection
          title="Completed Goals"
          count={completedGoals.length}
          sectionId="completed"
          variant="completed"
        >
          {completedGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} isCompleted={true} />
          ))}
        </CollapsibleSection>
      )}

      {/* Archived Goals */}
      {archivedGoals.length > 0 && (
        <CollapsibleSection
          title="Archived Goals"
          count={archivedGoals.length}
          sectionId="archived"
          variant="archived"
          defaultCollapsed
        >
          {archivedGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </CollapsibleSection>
      )}

      {/* Empty State */}
      {activeGoals.length === 0 && completedGoals.length === 0 && archivedGoals.length === 0 && (
        <div className="bg-card border border-border rounded-2xl shadow-sm text-center py-12">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Plus size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">No goals yet</h3>
            <p className="text-muted-foreground">
              Create your first goal to start tracking your progress and achieving your dreams.
            </p>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary hover:bg-primary/90 active:scale-[0.98] rounded-lg transition-all"
            >
              <Plus size={16} className="mr-1" />
              Add Your First Goal
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddGoalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      
      {editingGoal && (
        <EditGoalModal
          isOpen={true}
          onClose={() => setEditingGoal(null)}
          goal={editingGoal}
        />
      )}

      <PeopleSettingsModal
        isOpen={peopleSettingsOpen}
        onClose={() => setPeopleSettingsOpen(false)}
        persons={allPersons}
      />

      {/* FAB */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all"
      >
        <Plus size={24} />
      </button>
    </PageLayout>
  );
};
