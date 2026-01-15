'use client';
import { useEffect } from 'react';
import { useAds } from './ads-provider';
import { Skeleton } from '../ui/skeleton';

export function AdBanner() {
    const { showBannerAd, isAdsInitialized } = useAds();

    useEffect(() => {
        if(isAdsInitialized) {
            showBannerAd();
        }
    }, [isAdsInitialized, showBannerAd]);
    
    // Reserve space for the banner to avoid layout shifts
    return (
        <div className="w-full h-[50px] bg-muted/20 flex items-center justify-center border-t">
            {!isAdsInitialized ? (
                 <Skeleton className="h-full w-full" />
            ): (
                 <div id="ironsource-banner-placeholder" className="w-full h-full">
                    {/* The ironSource SDK will inject the banner here */}
                 </div>
            )}
        </div>
    );
}
