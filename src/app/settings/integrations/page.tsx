'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Link2, Milestone } from "lucide-react";
import { useLocalization } from "@/components/layout/localization-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function IntegrationsSettingsPage() {
  const { t } = useLocalization();
  
  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Link2 className="w-6 h-6"/> {t.settings.integrations.title}</CardTitle>
            <CardDescription>{t.settings.integrations.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-muted-foreground p-8">
            <div className="flex justify-center">
                <div className="grid grid-cols-3 gap-4">
                    <img src="/logos/google-calendar.svg" alt="Google Calendar Logo" className="w-12 h-12" />
                    <img src="/logos/slack.svg" alt="Slack Logo" className="w-12 h-12" />
                    <img src="/logos/github.svg" alt="GitHub Logo" className="w-12 h-12" />
                </div>
            </div>
            <h3 className="text-xl font-bold font-headline mt-4">{t.settings.integrations.futureTitle}</h3>
            <p>{t.settings.integrations.futureDescription}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/roadmap">
                <Milestone className="me-2 h-4 w-4" />
                {t.settings.integrations.viewRoadmap}
              </Link>
            </Button>
        </CardContent>
    </Card>
  );
}
