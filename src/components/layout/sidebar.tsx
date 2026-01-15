'use client';

import { UserProfile } from '@/components/layout/user-profile';
import { Button } from '@/components/ui/button';
import { Settings, LifeBuoy, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { MainNav } from './main-nav';
import { useLocalization } from './localization-provider';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { t } = useLocalization();
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
        <div className="p-4 flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-primary"/>
            <h1 className="text-xl font-bold font-headline text-primary">OmniCore</h1>
        </div>
        <UserProfile />
        <Separator />
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
            <MainNav />
        </nav>
        <Separator />
        <div className="p-2">
            <Button variant="ghost" className="w-full justify-start font-normal text-muted-foreground hover:text-foreground" asChild>
                <Link href="/support"><LifeBuoy className="me-3 h-5 w-5"/> {t.sidebar.support}</Link>
            </Button>
            <Button variant={pathname.startsWith('/settings') ? 'secondary' : 'ghost'} className="w-full justify-start font-normal text-muted-foreground hover:text-foreground" asChild>
                <Link href="/settings"><Settings className="me-3 h-5 w-5"/> {t.sidebar.settings}</Link>
            </Button>
        </div>
    </div>
  );
}
