'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Settings, User as UserIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalization } from "@/components/layout/localization-provider";

export default function ProfileSettingsPage() {
  const { user, isUserLoading } = useUser();
  const { t } = useLocalization();

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserIcon className="w-6 h-6"/> {t.settings.profile.title}</CardTitle>
            <CardDescription>{t.settings.profile.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="email">{t.settings.profile.email}</Label>
                {isUserLoading ? (
                    <Skeleton className="h-10 w-full" />
                ) : (
                    <Input id="email" value={user?.email || 'No email associated'} disabled />
                )}
            </div>
        </CardContent>
    </Card>
  );
}
