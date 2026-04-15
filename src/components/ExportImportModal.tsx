import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { exportData, importData } from "@/lib/dataExport";

interface ExportImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExportImportModal = ({ open, onOpenChange }: ExportImportModalProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleExport = () => {
    exportData();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importData(text);
      if (result.success) {
        setImportSuccess(true);
        setImportError(null);
        setTimeout(() => window.location.reload(), 800);
      } else {
        setImportError(result.error ?? "Import failed.");
        setImportSuccess(false);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export / Import Data</DialogTitle>
          <DialogDescription>
            Export saves all your habits, completions, and goals as a JSON file.
            Import replaces all current data with the file contents.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleExport}
          >
            <Download size={16} />
            Export data as JSON
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={16} />
            Import from JSON file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />

          {importError && (
            <p className="text-sm text-destructive">{importError}</p>
          )}
          {importSuccess && (
            <p className="text-sm text-emerald-600">Import successful. Reloading…</p>
          )}

          <p className="text-xs text-muted-foreground pt-1">
            Import is destructive — it replaces all existing data. Export a backup first.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
