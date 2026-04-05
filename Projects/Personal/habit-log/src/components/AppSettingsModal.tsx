import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, Trash2 } from "lucide-react";
import { TodaySettings } from "@/hooks/useTodaySettings";
import { ResetProgressModal } from "@/components/ResetProgressModal";
import { FactoryResetModal } from "@/components/FactoryResetModal";

interface AppSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: TodaySettings;
  onUpdateSetting: <K extends keyof TodaySettings>(
    key: K,
    value: TodaySettings[K]
  ) => void;
}

export const AppSettingsModal = ({
  open,
  onOpenChange,
  settings,
  onUpdateSetting,
}: AppSettingsModalProps) => {
  const [resetProgressOpen, setResetProgressOpen] = useState(false);
  const [factoryResetOpen, setFactoryResetOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Today Options Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Today Options</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="showAsNeeded" className="text-sm font-medium">
                  Show "As Needed" habits
                </Label>
                <Switch
                  id="showAsNeeded"
                  checked={settings.showAsNeeded}
                  onCheckedChange={(checked) =>
                    onUpdateSetting("showAsNeeded", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showNotDueToday" className="text-sm font-medium">
                  Show "Not Due Today" section
                </Label>
                <Switch
                  id="showNotDueToday"
                  checked={settings.showNotDueToday}
                  onCheckedChange={(checked) =>
                    onUpdateSetting("showNotDueToday", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enableSkipState" className="text-sm font-medium">
                  Enable Skip state
                </Label>
                <Switch
                  id="enableSkipState"
                  checked={settings.enableSkipState}
                  onCheckedChange={(checked) =>
                    onUpdateSetting("enableSkipState", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showOnlyMyGoals" className="text-sm font-medium">
                  Show only my goals
                </Label>
                <Switch
                  id="showOnlyMyGoals"
                  checked={settings.showOnlyMyGoals}
                  onCheckedChange={(checked) =>
                    onUpdateSetting("showOnlyMyGoals", checked)
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Advanced Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-destructive">Advanced</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setResetProgressOpen(true)}
                >
                  <RotateCcw size={16} />
                  Reset Progress
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setFactoryResetOpen(true)}
                >
                  <Trash2 size={16} />
                  Factory Reset
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ResetProgressModal
        open={resetProgressOpen}
        onOpenChange={setResetProgressOpen}
        onComplete={() => onOpenChange(false)}
      />

      <FactoryResetModal
        open={factoryResetOpen}
        onOpenChange={setFactoryResetOpen}
      />
    </>
  );
};
