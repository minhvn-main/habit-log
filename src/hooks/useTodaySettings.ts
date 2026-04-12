import { useState, useEffect } from "react";

export interface TodaySettings {
  showAsNeeded: boolean;
  showNotDueToday: boolean;
  enableSkipState: boolean;
  showOnlyMyGoals: boolean;
}

const DEFAULT_SETTINGS: TodaySettings = {
  showAsNeeded: false,
  showNotDueToday: true,
  enableSkipState: true,
  showOnlyMyGoals: true,
};

const STORAGE_KEY = "todaySettings";

export const useTodaySettings = () => {
  const [settings, setSettings] = useState<TodaySettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof TodaySettings>(
    key: K,
    value: TodaySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return { settings, updateSetting };
};
