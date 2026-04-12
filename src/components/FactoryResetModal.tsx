import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { toast } from "@/hooks/use-toast";

interface FactoryResetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FactoryResetModal = ({
  open,
  onOpenChange,
}: FactoryResetModalProps) => {
  const { factoryReset } = useApp();
  const [confirmText, setConfirmText] = useState("");

  const isConfirmed = confirmText.toUpperCase() === "RESET";

  const handleReset = () => {
    if (!isConfirmed) return;
    
    factoryReset();
    toast({
      title: "App reset",
      description: "All data has been erased.",
    });
    setConfirmText("");
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText("");
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Factory Reset</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="text-destructive font-medium">
                ⚠️ This will permanently erase ALL data including habits, goals, completions, and settings. This cannot be undone.
              </p>
              <div className="space-y-2">
                <Label htmlFor="confirmReset" className="text-foreground">
                  Type <span className="font-mono font-bold">RESET</span> to confirm
                </Label>
                <Input
                  id="confirmReset"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type RESET"
                  className="font-mono"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            onClick={handleReset}
            disabled={!isConfirmed}
            variant="destructive"
          >
            Erase Everything
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
