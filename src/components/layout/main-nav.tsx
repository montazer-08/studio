'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Home,
  CheckSquare,
  BookText,
  FolderKanban,
  LineChart,
  Users,
  Milestone,
  Search,
  Bell,
  BrainCircuit,
  Zap,
} from 'lucide-react';
import { useLocalization } from './localization-provider';

export function MainNav() {
  const pathname = usePathname();
  const { t } = useLocalization();

  const mainNav = [
    { name: t.sidebar.home, href: '/', icon: Home, exact: true },
    { name: t.sidebar.aiAssistant, href: '/ai-chat', icon: BrainCircuit },
    { name: t.sidebar.powers, href: '/powers', icon: Zap },
    { name: t.sidebar.search, href: '/search', icon: Search },
    { name: t.sidebar.updates, href: '/updates', icon: Bell },
    { name: t.sidebar.tasks, href: '/tasks', icon: CheckSquare },
    { name: t.sidebar.notes, href: '/notes', icon: BookText },
    { name: t.sidebar.files, href: '/files', icon: FolderKanban },
    { name: t.sidebar.analytics, href: '/analytics', icon: LineChart },
    { name: t.sidebar.crm, href: '/crm', icon: Users },
    { name: t.sidebar.roadmap, href: '/roadmap', icon: Milestone },
  ];

  return (
    <div className="flex flex-col space-y-1">
      {mainNav.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
            <Button
            key={item.name}
            asChild
            variant={isActive ? 'secondary' : 'ghost'}
            className="w-full justify-start font-normal"
            >
            <Link href={item.href}>
                <item.icon className="me-3 h-5 w-5 text-muted-foreground" />
                {item.name}
            </Link>
            </Button>
        )
    })}
    </div>
  );
}
