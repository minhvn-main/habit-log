import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePeopleSettings, PersonColor, PRESET_COLORS, isPresetColor, isValidHex } from "@/hooks/usePeopleSettings";
import { useApp } from "@/contexts/AppContext";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PeopleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  persons: string[];
}

const COLOR_OPTIONS: { name: string; class: string; value: PersonColor }[] = [
  { name: 'Blue', class: 'bg-blue-500', value: 'blue' },
  { name: 'Green', class: 'bg-green-500', value: 'green' },
  { name: 'Purple', class: 'bg-purple-500', value: 'purple' },
  { name: 'Orange', class: 'bg-orange-500', value: 'orange' },
  { name: 'Pink', class: 'bg-pink-500', value: 'pink' },
  { name: 'Teal', class: 'bg-teal-500', value: 'teal' },
  { name: 'Amber', class: 'bg-amber-500', value: 'amber' },
  { name: 'Rose', class: 'bg-rose-500', value: 'rose' },
  { name: 'Indigo', class: 'bg-indigo-500', value: 'indigo' },
  { name: 'Cyan', class: 'bg-cyan-500', value: 'cyan' },
];

export const PeopleSettingsModal = ({ isOpen, onClose, persons }: PeopleSettingsModalProps) => {
  const { getPersonColor, setPersonColor, renamePersonColor } = usePeopleSettings();
  const { renamePerson } = useApp();

  // Local copy of persons that updates on rename
  const [localPersons, setLocalPersons] = useState<string[]>(persons);
  
  // Editing state
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [nameErrors, setNameErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState<Record<string, boolean>>({});
  const [hexInputs, setHexInputs] = useState<Record<string, string>>({});
  const [hexErrors, setHexErrors] = useState<Record<string, string>>({});

  // Sync persons on open
  useEffect(() => {
    if (isOpen) {
      setLocalPersons(persons);
      setEditingNames({});
      setNameErrors({});
      setHexErrors({});
    }
  }, [isOpen, persons]);

  // Initialize hex inputs from current colors
  useEffect(() => {
    if (isOpen) {
      const initialHexInputs: Record<string, string> = {};
      localPersons.forEach(person => {
        const color = getPersonColor(person);
        if (isValidHex(color)) {
          initialHexInputs[person] = color;
        }
      });
      setHexInputs(initialHexInputs);
    }
  }, [isOpen, localPersons, getPersonColor]);

  if (localPersons.length === 0) return null;

  const handleNameChange = (oldName: string, newName: string) => {
    setEditingNames(prev => ({ ...prev, [oldName]: newName }));
    setNameErrors(prev => ({ ...prev, [oldName]: '' }));
  };

  const handleNameSave = (oldName: string) => {
    const newName = (editingNames[oldName] ?? oldName).trim();
    
    if (!newName) {
      setNameErrors(prev => ({ ...prev, [oldName]: 'Name cannot be empty' }));
      return;
    }
    
    // Check duplicates (excluding self)
    const isDuplicate = localPersons.some(p => 
      p.toLowerCase() !== oldName.toLowerCase() && 
      p.toLowerCase() === newName.toLowerCase()
    );
    if (isDuplicate) {
      setNameErrors(prev => ({ ...prev, [oldName]: 'Name already exists' }));
      return;
    }
    
    if (newName !== oldName) {
      renamePerson(oldName, newName);
      renamePersonColor(oldName, newName);
      setLocalPersons(prev => prev.map(p => p === oldName ? newName : p));
      
      // Update local state keys
      setEditingNames(prev => {
        const { [oldName]: _, ...rest } = prev;
        return { ...rest, [newName]: newName };
      });
      setShowAdvanced(prev => {
        const { [oldName]: value, ...rest } = prev;
        return value ? { ...rest, [newName]: value } : rest;
      });
      setHexInputs(prev => {
        const { [oldName]: value, ...rest } = prev;
        return value ? { ...rest, [newName]: value } : rest;
      });
    }
  };

  const normalizeHex = (value: string): string => {
    let normalized = value.trim().toUpperCase();
    // Auto-prefix # if user types 6 hex chars without #
    if (/^[0-9A-F]{6}$/i.test(normalized)) {
      normalized = '#' + normalized;
    }
    return normalized;
  };

  const handleHexChange = (person: string, value: string) => {
    const normalized = normalizeHex(value);
    setHexInputs(prev => ({ ...prev, [person]: normalized }));
    setHexErrors(prev => ({ ...prev, [person]: '' }));
    
    if (isValidHex(normalized)) {
      setPersonColor(person, normalized);
    }
  };

  const handleHexBlur = (person: string) => {
    const value = hexInputs[person] || '';
    if (value && !isValidHex(value)) {
      setHexErrors(prev => ({ ...prev, [person]: 'Invalid format (use #RRGGBB or RRGGBB)' }));
    }
  };

  const toggleAdvanced = (person: string) => {
    setShowAdvanced(prev => ({ ...prev, [person]: !prev[person] }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col overflow-x-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>People Settings</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 py-4">
          <p className="text-sm text-slate-500">
            Customize names and colors for each person.
          </p>
          
          <div className="space-y-4">
            {localPersons.map(person => {
              const currentColor = getPersonColor(person);
              const isCustomHex = isValidHex(currentColor) && !isPresetColor(currentColor);
              
              return (
                <div key={person} className="space-y-2">
                  {/* Name - full width row */}
                  <Input
                    value={editingNames[person] ?? person}
                    onChange={(e) => handleNameChange(person, e.target.value)}
                    onBlur={() => handleNameSave(person)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave(person)}
                    className={cn(
                      "h-9 text-sm font-medium w-full",
                      nameErrors[person] && "border-rose-500 focus-visible:ring-rose-500"
                    )}
                  />
                  {nameErrors[person] && (
                    <p className="text-xs text-rose-500 mt-1">{nameErrors[person]}</p>
                  )}
                  
                  {/* Color swatches - below, wrapping */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {COLOR_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setPersonColor(person, option.value);
                          setHexInputs(prev => ({ ...prev, [person]: '' }));
                        }}
                        className={cn(
                          "w-7 h-7 rounded-full transition-all flex-shrink-0",
                          option.class,
                          currentColor === option.value 
                            ? "ring-2 ring-offset-2 ring-slate-400 scale-110" 
                            : "hover:scale-110"
                        )}
                        title={option.name}
                      />
                    ))}
                  </div>
                  
                  {/* Advanced toggle */}
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => toggleAdvanced(person)}
                      className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showAdvanced[person] ? 'Hide advanced' : 'Advanced'}
                    </button>
                  </div>
                  
                  {/* HEX input (advanced) */}
                  {showAdvanced[person] && (
                    <div className="pl-2 border-l-2 border-slate-100">
                      <div className="flex items-center gap-2">
                        <Input
                          value={hexInputs[person] ?? ''}
                          onChange={(e) => handleHexChange(person, e.target.value)}
                          onBlur={() => handleHexBlur(person)}
                          placeholder="#FF5733"
                          className={cn(
                            "h-8 w-28 text-sm font-mono",
                            hexErrors[person] && "border-rose-500 focus-visible:ring-rose-500"
                          )}
                        />
                        {isCustomHex && (
                          <div 
                            className="w-6 h-6 rounded-full border border-slate-200 flex-shrink-0" 
                            style={{ backgroundColor: currentColor }}
                          />
                        )}
                        <span className="text-xs text-slate-400">Custom HEX</span>
                      </div>
                      {hexErrors[person] && (
                        <p className="text-xs text-rose-500 mt-1">{hexErrors[person]}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
