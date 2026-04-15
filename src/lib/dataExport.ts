import { STORAGE_KEYS } from "@/contexts/AppContext";

export interface ExportedData {
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

export function exportData(): void {
  const exported: ExportedData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {},
  };

  for (const key of Object.values(STORAGE_KEYS)) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        exported.data[key] = JSON.parse(raw);
      } catch {
        exported.data[key] = raw;
      }
    }
  }

  const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `habit-log-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(jsonText: string): { success: boolean; error?: string } {
  let parsed: ExportedData;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { success: false, error: "Invalid JSON file." };
  }

  if (parsed.version !== 1 || typeof parsed.data !== "object") {
    return { success: false, error: "Unrecognised export format." };
  }

  for (const key of Object.values(STORAGE_KEYS)) {
    if (key in parsed.data) {
      localStorage.setItem(key, JSON.stringify(parsed.data[key]));
    } else {
      localStorage.removeItem(key);
    }
  }

  return { success: true };
}
