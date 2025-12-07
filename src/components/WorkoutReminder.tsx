import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Clock, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface Reminder {
  id: string;
  time: string;
  enabled: boolean;
  label: string;
}

interface WorkoutReminderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isGerman: boolean;
}

const REMINDERS_STORAGE_KEY = "fitblaqs_workout_reminders";

export const WorkoutReminder = ({ open, onOpenChange, isGerman }: WorkoutReminderProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newTime, setNewTime] = useState("08:00");
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (stored) {
      setReminders(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    scheduleNotifications();
  }, [reminders]);

  const requestPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      toast.error(isGerman ? "Benachrichtigungen nicht unterstützt" : "Notifications not supported");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  const scheduleNotifications = () => {
    // Clear existing timeouts
    const now = new Date();
    
    reminders.forEach((reminder) => {
      if (!reminder.enabled) return;

      const [hours, minutes] = reminder.time.split(":").map(Number);
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      const delay = reminderTime.getTime() - now.getTime();

      // Only schedule if within 24 hours
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          if (Notification.permission === "granted") {
            new Notification("FitBlaqs Workout Reminder", {
              body: reminder.label || (isGerman ? "Zeit für dein Training!" : "Time for your workout!"),
              icon: "/pwa-192x192.png",
              badge: "/pwa-192x192.png",
              tag: `workout-reminder-${reminder.id}`,
              requireInteraction: true,
            });
          }
        }, delay);
      }
    });
  };

  const addReminder = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      toast.error(isGerman ? "Bitte Benachrichtigungen erlauben" : "Please allow notifications");
      return;
    }

    const newReminder: Reminder = {
      id: Date.now().toString(),
      time: newTime,
      enabled: true,
      label: newLabel || (isGerman ? "Workout Zeit" : "Workout Time"),
    };

    setReminders([...reminders, newReminder]);
    setNewLabel("");
    toast.success(isGerman ? "Erinnerung hinzugefügt" : "Reminder added");
  };

  const toggleReminder = (id: string) => {
    setReminders(reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id));
    toast.success(isGerman ? "Erinnerung gelöscht" : "Reminder deleted");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {isGerman ? "Workout Erinnerungen" : "Workout Reminders"}
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new reminder */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <Label>{isGerman ? "Neue Erinnerung" : "New Reminder"}</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full"
                />
              </div>
              <Input
                placeholder={isGerman ? "Beschreibung" : "Label"}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="flex-1"
              />
            </div>
            <Button onClick={addReminder} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              {isGerman ? "Hinzufügen" : "Add Reminder"}
            </Button>
          </div>

          {/* Existing reminders */}
          <div className="space-y-2">
            {reminders.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {isGerman ? "Keine Erinnerungen" : "No reminders set"}
              </p>
            ) : (
              reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{reminder.time}</div>
                      <div className="text-sm text-muted-foreground">{reminder.label}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={reminder.enabled} onCheckedChange={() => toggleReminder(reminder.id)} />
                    <Button variant="ghost" size="icon" onClick={() => deleteReminder(reminder.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
