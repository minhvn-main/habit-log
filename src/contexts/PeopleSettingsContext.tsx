import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type PresetColor = 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal' | 'amber' | 'rose' | 'indigo' | 'cyan';
export type PersonColor = PresetColor | string;

export const PRESET_COLORS: PresetColor[] = ['blue', 'green', 'purple', 'orange', 'pink', 'teal', 'amber', 'rose', 'indigo', 'cyan'];

export const isPresetColor = (color: string): color is PresetColor => {
  return PRESET_COLORS.includes(color as PresetColor);
};

export const isValidHex = (hex: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
};

const DEFAULT_COLORS: Record<string, PresetColor> = {
  'myself': 'blue',
  'alex': 'green',
  'sarah': 'purple',
};

const FALLBACK_COLORS: PresetColor[] = ['orange', 'pink', 'teal', 'amber', 'rose', 'indigo', 'cyan'];

interface PeopleSettingsContextType {
  settings: Record<string, PersonColor>;
  getPersonColor: (person: string) => PersonColor;
  setPersonColor: (person: string, color: PersonColor) => void;
  renamePersonColor: (oldName: string, newName: string) => void;
  getPersonBgClass: (person: string) => string;
  getPersonBgStyle: (person: string) => React.CSSProperties | undefined;
  getPersonTextClass: (person: string) => string;
  getPersonTextStyle: (person: string) => React.CSSProperties | undefined;
}

const PeopleSettingsContext = createContext<PeopleSettingsContextType | null>(null);

export const PeopleSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Record<string, PersonColor>>(() => {
    const stored = localStorage.getItem('peopleColorSettings');
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem('peopleColorSettings', JSON.stringify(settings));
  }, [settings]);

  const getPersonColor = (person: string): PersonColor => {
    if (settings[person]) {
      return settings[person];
    }
    const lowerPerson = person.toLowerCase();
    if (DEFAULT_COLORS[lowerPerson]) {
      return DEFAULT_COLORS[lowerPerson];
    }
    const colorIndex = person.length % FALLBACK_COLORS.length;
    return FALLBACK_COLORS[colorIndex];
  };

  const setPersonColor = (person: string, color: PersonColor) => {
    setSettings(prev => ({ ...prev, [person]: color }));
  };

  const renamePersonColor = (oldName: string, newName: string) => {
    setSettings(prev => {
      const { [oldName]: color, ...rest } = prev;
      if (color) {
        return { ...rest, [newName]: color };
      }
      return prev;
    });
  };

  const getPersonBgClass = (person: string): string => {
    const color = getPersonColor(person);
    if (!isPresetColor(color)) return '';
    const colorMap: Record<PresetColor, string> = {
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'purple': 'bg-purple-500',
      'orange': 'bg-orange-500',
      'pink': 'bg-pink-500',
      'teal': 'bg-teal-500',
      'amber': 'bg-amber-500',
      'rose': 'bg-rose-500',
      'indigo': 'bg-indigo-500',
      'cyan': 'bg-cyan-500',
    };
    return colorMap[color];
  };

  const getPersonBgStyle = (person: string): React.CSSProperties | undefined => {
    const color = getPersonColor(person);
    if (isValidHex(color)) {
      return { backgroundColor: color };
    }
    return undefined;
  };

  const getPersonTextClass = (person: string): string => {
    const color = getPersonColor(person);
    if (!isPresetColor(color)) return '';
    const colorMap: Record<PresetColor, string> = {
      'blue': 'text-blue-600',
      'green': 'text-green-600',
      'purple': 'text-purple-600',
      'orange': 'text-orange-600',
      'pink': 'text-pink-600',
      'teal': 'text-teal-600',
      'amber': 'text-amber-600',
      'rose': 'text-rose-600',
      'indigo': 'text-indigo-600',
      'cyan': 'text-cyan-600',
    };
    return colorMap[color];
  };

  const getPersonTextStyle = (person: string): React.CSSProperties | undefined => {
    const color = getPersonColor(person);
    if (isValidHex(color)) {
      return { color: color };
    }
    return undefined;
  };

  return (
    <PeopleSettingsContext.Provider value={{
      settings,
      getPersonColor,
      setPersonColor,
      renamePersonColor,
      getPersonBgClass,
      getPersonBgStyle,
      getPersonTextClass,
      getPersonTextStyle,
    }}>
      {children}
    </PeopleSettingsContext.Provider>
  );
};

export const usePeopleSettings = () => {
  const context = useContext(PeopleSettingsContext);
  if (!context) {
    throw new Error('usePeopleSettings must be used within PeopleSettingsProvider');
  }
  return context;
};
