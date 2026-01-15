'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLocalization } from "@/components/layout/localization-provider";
import { useState } from "react";

export default function NotificationsSettingsPage() {
  const { t } = useLocalization();
  // These states are for UI demonstration purposes.
  // In a real app, you'd fetch and save these from user settings.
  const [taskReminders, setTaskReminders] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="w-6 h-6"/> {t.settings.notifications.title}</CardTitle>
            <CardDescription>{t.settings.notifications.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label htmlFor="task-reminders">{t.settings.notifications.taskReminders}</Label>
                    <p className="text-sm text-muted-foreground">{t.settings.notifications.taskRemindersDesc}</p>
                </div>
                <Switch 
                    id="task-reminders" 
                    checked={taskReminders} 
                    onCheckedChange={setTaskReminders}
                />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label htmlFor="ai-suggestions">{t.settings.notifications.aiSuggestions}</Label>
                    <p className="text-sm text-muted-foreground">{t.settings.notifications.aiSuggestionsDesc}</p>
                </div>
                <Switch 
                    id="ai-suggestions" 
                    checked={aiSuggestions}
                    onCheckedChange={setAiSuggestions}
                />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label htmlFor="weekly-summary">{t.settings.notifications.weeklySummary}</Label>
                    <p className="text-sm text-muted-foreground">{t.settings.notifications.weeklySummaryDesc}</p>
                </div>
                <Switch 
                    id="weekly-summary"
                    checked={weeklySummary}
                    onCheckedChange={setWeeklySummary}
                />
            </div>
        </CardContent>
    </Card>
  );
}
