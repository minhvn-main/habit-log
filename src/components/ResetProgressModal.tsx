import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApp } from "@/contexts/AppContext";
import { toast } from "@/hooks/use-toast";

interface ResetProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export const ResetProgressModal = ({
  open,
  onOpenChange,
  onComplete,
}: ResetProgressModalProps) => {
  const { resetProgress } = useApp();

  const handleReset = () => {
    resetProgress();
    toast({
      title: "Progress reset",
      description: "All completion history has been cleared.",
    });
    onOpenChange(false);
    onComplete();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Progress?</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear all habit completion history but keep your habits, goals, and settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Reset Progress
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
