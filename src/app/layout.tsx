import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from '@/components/layout/app-shell';
import { Sidebar } from '@/components/layout/sidebar';
import Script from 'next/script';
import { Inter, Space_Grotesk } from 'next/font/google';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LocalizationProvider } from '@/components/layout/localization-provider';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { PowerProvider } from '@/hooks/use-power-system';
import { AdsProvider } from '@/components/ads/ads-provider';
import { SpeedInsights } from '@vercel/speed-insights/next';


export const metadata: Metadata = {
  title: 'OmniCore',
  description: 'The Intelligent Personal Command Center',
};

const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const fontSpaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {/* 
            The ironSource Cordova plugin for Capacitor/Android provides the JS bridge automatically.
            The web SDK script below is only for web-based testing if needed, but the AdsProvider
            is now designed to work with the native bridge provided in an APK.
            <Script
              src="https://static.mobile.ironsrc.com/sdk/js/v6.17.0/ironsource_api.js"
              strategy="beforeInteractive"
            /> 
          */}
        </head>
        <body className={cn(
            "font-body bg-secondary/30 dark:bg-background text-foreground antialiased",
            fontInter.variable,
            fontSpaceGrotesk.variable
          )}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
          >
            <LocalizationProvider>
              <FirebaseClientProvider>
                <AdsProvider>
                  <PowerProvider>
                    <AppShell sidebar={<Sidebar />} >
                      {children}
                    </AppShell>
                  </PowerProvider>
                </AdsProvider>
              </FirebaseClientProvider>
            </LocalizationProvider>
            <Toaster />
            <SpeedInsights />
          </ThemeProvider>
        </body>
      </html>
  );
}
