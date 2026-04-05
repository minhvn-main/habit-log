import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TodaySettings } from "@/hooks/useTodaySettings";

interface TodaySettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: TodaySettings;
  onUpdateSetting: <K extends keyof TodaySettings>(
    key: K,
    value: TodaySettings[K]
  ) => void;
}

export const TodaySettingsModal = ({
  open,
  onOpenChange,
  settings,
  onUpdateSetting,
}: TodaySettingsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Today Options</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
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
          <div className="border-t border-border pt-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
