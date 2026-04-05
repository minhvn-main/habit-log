import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePeopleSettings } from "@/hooks/usePeopleSettings";

interface PersonFilterProps {
  allPersons: string[];
  selectedPersons: string[];
  onPersonsChange: (persons: string[]) => void;
  rightContent?: ReactNode;
}

export const PersonFilter = ({ 
  allPersons, 
  selectedPersons, 
  onPersonsChange,
  rightContent 
}: PersonFilterProps) => {
  const { getPersonBgClass, getPersonBgStyle } = usePeopleSettings();

  const persons = ['all', ...allPersons];

  const handlePersonToggle = (person: string) => {
    if (person === 'all') {
      // If "all" is clicked, select all or deselect all
      if (selectedPersons.includes('all') || selectedPersons.length === allPersons.length) {
        onPersonsChange([]);
      } else {
        onPersonsChange(['all']);
      }
    } else {
      // Toggle individual person
      if (selectedPersons.includes('all')) {
        // If "all" was selected, switch to just this person
        onPersonsChange([person]);
      } else if (selectedPersons.includes(person)) {
        // Remove this person
        const newSelection = selectedPersons.filter(p => p !== person);
        onPersonsChange(newSelection);
      } else {
        // Add this person
        const newSelection = [...selectedPersons, person];
        // If all persons are now selected, switch to "all"
        if (newSelection.length === allPersons.length) {
          onPersonsChange(['all']);
        } else {
          onPersonsChange(newSelection);
        }
      }
    }
  };

  const isSelected = (person: string) => {
    if (person === 'all') {
      return selectedPersons.includes('all') || selectedPersons.length === 0;
    }
    return selectedPersons.includes(person) || selectedPersons.includes('all');
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Filter:</span>
        {persons.map(person => {
          const bgClass = person !== 'all' ? getPersonBgClass(person) : '';
          const bgStyle = person !== 'all' ? getPersonBgStyle(person) : undefined;
          const isActive = isSelected(person);
          
          return (
            <button
              key={person}
              onClick={() => handlePersonToggle(person)}
              className={cn(
                "person-toggle",
                isActive 
                  ? person === 'all' 
                    ? "person-toggle-active bg-primary" 
                    : bgClass 
                      ? `person-toggle-active ${bgClass}`
                      : "person-toggle-active"
                  : "person-toggle-inactive"
              )}
              style={isActive && bgStyle ? bgStyle : undefined}
            >
              {person === 'all' ? 'All' : person}
            </button>
          );
        })}
        {rightContent && <div className="ml-auto">{rightContent}</div>}
      </div>
    </>
  );
};
