'use client';
import { PanelLeft, BrainCircuit } from 'lucide-react';
import { Button } from '../ui/button';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '../ui/sheet';
import { AdBanner } from '../ads/ad-banner';

export function AppShell({ 
  sidebar,
  children 
}: { 
  sidebar: React.ReactNode;
  children: React.ReactNode 
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-secondary/30 dark:bg-muted/10">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-e bg-background">
        {sidebar}
      </aside>

      <div className="flex flex-col flex-1">
        {/* Mobile Header */}
        <header className="md:hidden flex h-14 items-center gap-4 border-b bg-background px-4">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-background/80 backdrop-blur-sm">
              <SheetTitle className="sr-only">Sidebar Menu</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary"/>
            <h1 className="text-lg font-bold font-headline text-primary">OmniCore</h1>
        </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Ad Banner at the bottom */}
        <AdBanner />
      </div>
    </div>
  );
}
