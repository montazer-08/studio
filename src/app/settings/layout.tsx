'use client';
import { Card, CardContent } from "@/components/ui/card";
import { Settings, User, Palette, Languages, Lock, Bell, Link2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/components/layout/localization-provider";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const { t } = useLocalization();

  const settingsNav = [
    { name: t.settings.profile.title, href: '/settings', icon: User, exact: true },
    { name: t.settings.account.title, href: '/settings/account', icon: Lock },
    { name: t.settings.appearance.title, href: '/settings/appearance', icon: Palette },
    { name: t.settings.language.title, href: '/settings/language', icon: Languages },
    { name: t.settings.notifications.title, href: '/settings/notifications', icon: Bell },
    { name: t.settings.integrations.title, href: '/settings/integrations', icon: Link2 },
  ];

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-4xl font-bold font-headline">{t.settings.title}</h1>
          <p className="text-lg text-muted-foreground">{t.settings.description}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <Card>
            <CardContent className="p-2">
              <nav className="flex flex-col space-y-1">
                {settingsNav.map(item => {
                  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-muted/50"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        <main className="md:col-span-3">
            {children}
        </main>
      </div>
    </div>
  )
}
