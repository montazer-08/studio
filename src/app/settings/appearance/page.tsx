'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Palette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "next-themes";
import { useLocalization } from "@/components/layout/localization-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { t } = useLocalization();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="w-6 h-6"/> {t.settings.appearance.title}</CardTitle>
            <CardDescription>{t.settings.appearance.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label>{t.settings.appearance.theme}</Label>
                 {!isClient ? (
                    <div className="flex space-x-4 pt-2">
                       <Skeleton className="h-6 w-20" />
                       <Skeleton className="h-6 w-20" />
                       <Skeleton className="h-6 w-20" />
                    </div>
                 ) : (
                    <RadioGroup 
                        value={theme}
                        onValueChange={setTheme}
                        className="flex space-x-4 pt-2"
                    >
                        <Label className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem value="light" id="light" />
                            <span>{t.settings.appearance.light}</span>
                        </Label>
                        <Label className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem value="dark" id="dark" />
                            <span>{t.settings.appearance.dark}</span>
                        </Label>
                        <Label className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem value="system" id="system" />
                            <span>{t.settings.appearance.system}</span>
                        </Label>
                    </RadioGroup>
                 )}
            </div>
        </CardContent>
    </Card>
  );
}
