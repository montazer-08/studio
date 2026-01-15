'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Languages } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLocalization } from "@/components/layout/localization-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

export default function LanguageSettingsPage() {
  const { locale, setLocale, t, isLocaleLoading } = useLocalization();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Languages className="w-6 h-6"/> {t.settings.language.title}</CardTitle>
            <CardDescription>{t.settings.language.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label>{t.settings.language.language}</Label>
                <p className="text-sm text-muted-foreground">{t.settings.language.subtext}</p>
                 {!isClient || isLocaleLoading ? (
                    <div className="flex space-x-4 pt-2">
                        <Skeleton className="h-6 w-28" />
                        <Skeleton className="h-6 w-28" />
                    </div>
                 ): (
                    <RadioGroup 
                        value={locale}
                        onValueChange={(value) => setLocale(value as 'en' | 'ar')}
                        className="flex space-x-4 pt-2"
                    >
                        <Label className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem value="en" id="en" />
                            <span>English (LTR)</span>
                        </Label>
                        <Label className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem value="ar" id="ar" />
                            <span>العربية (RTL)</span>
                        </Label>
                    </RadioGroup>
                 )}
            </div>
        </CardContent>
    </Card>
  );
}
