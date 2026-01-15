'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

// This is the declaration for the JavaScript bridge provided by the
// cordova-plugin-ironsource-ads when running inside a native Capacitor/Cordova wrapper.
declare global {
  interface Window {
    IronSourceAds?: {
      init: (options: { appKey: string; onSuccess: () => void; onFailure: (error: any) => void; }) => void;
      showRewardedVideo: (options: { onAdRewarded: (event: any) => void; onAdShowFailed: (err: any) => void; onAdClosed: () => void; onAdOpened?: () => void; }) => void;
      showInterstitial: (options?: { onAdClosed?: () => void; onAdShowFailed?: (err: any) => void; }) => void;
      loadBanner: () => void;
      showBanner: () => void;
      hideBanner: () => void;
      isRewardedVideoAvailable: (callback: (available: boolean) => void) => void;
      isInterstitialReady: (callback: (ready: boolean) => void) => void;
      // Add other events from the plugin as needed
      addEventListener: (event: string, callback: (args: any) => void) => void;
      removeEventListener: (event: string, callback: (args: any) => void) => void;
    };
  }
}

interface AdsContextValue {
  isAdsInitialized: boolean;
  isRewardedReady: boolean;
  isInterstitialReady: boolean;
  showRewardedAd: (callbacks: { onSuccess: () => void; onFailure: () => void; }) => void;
  showInterstitialAd: () => void;
  showBannerAd: () => void;
  hideBannerAd: () => void;
}

const AdsContext = createContext<AdsContextValue | undefined>(undefined);

// IMPORTANT: This key is for Android. You'll need a separate key for iOS.
const IRONSOURCE_APP_KEY_ANDROID = '85460dcd'; 

export function AdsProvider({ children }: { children: ReactNode }) {
  const [isAdsInitialized, setIsAdsInitialized] = useState(false);
  const [isRewardedReady, setIsRewardedReady] = useState(false);
  const [isInterstitialReady, setIsInterstitialReady] = useState(false);
  const { toast } = useToast();

  // Effect to initialize the ad system
  useEffect(() => {
    // We must wait for the 'deviceready' event in a native environment
    // before we can safely interact with any Cordova plugins.
    const handleDeviceReady = () => {
      console.log("Device is ready, checking for IronSourceAds bridge...");
      if (window.IronSourceAds) {
        console.log("IronSourceAds bridge found. Initializing native SDK...");
        window.IronSourceAds.init({
          appKey: IRONSOURCE_APP_KEY_ANDROID,
          onSuccess: () => {
            console.log("Native IronSource SDK Initialized Successfully.");
            setIsAdsInitialized(true);
            window.IronSourceAds?.loadBanner(); // Pre-load the banner
          },
          onFailure: (error: any) => {
            console.error("Native IronSource SDK Initialization Failed:", error);
            toast({ variant: 'destructive', title: 'Ad SDK Error', description: 'Could not initialize the ad service.' });
          }
        });
      } else {
        // This is the mock for web-only development.
        console.warn("IronSourceAds bridge not found. Running in web mock mode.");
        setIsAdsInitialized(true);
        setIsRewardedReady(true);
        setIsInterstitialReady(true);
      }
    };
    
    // In a real Cordova/Capacitor app, the 'deviceready' event signals that native APIs are available.
    document.addEventListener('deviceready', handleDeviceReady, false);

    // If 'deviceready' doesn't fire after a timeout (e.g., we're in a regular browser),
    // we fall back to the web mock.
    const timer = setTimeout(() => {
        if (!isAdsInitialized) {
            console.log("'deviceready' did not fire. Assuming web environment.");
            handleDeviceReady(); // This will trigger the mock path
        }
    }, 2000); // 2-second timeout

    return () => {
      document.removeEventListener('deviceready', handleDeviceReady, false);
      clearTimeout(timer);
    };
  }, [toast]); // isAdsInitialized dependency removed to prevent re-triggering

  // Effect to listen for ad availability changes from the native SDK
  useEffect(() => {
      if (isAdsInitialized && window.IronSourceAds) {
        const rewardedCallback = (event: {isAvailable: boolean}) => setIsRewardedReady(event.isAvailable);
        const interstitialCallback = () => setIsInterstitialReady(true);
        
        // The cordova plugin uses events to notify of ad status changes
        window.IronSourceAds.addEventListener('onRewardedVideoAvailabilityChanged', rewardedCallback);
        window.IronSourceAds.addEventListener('onInterstitialAdReady', interstitialCallback);

        // Initial check
        window.IronSourceAds.isRewardedVideoAvailable(setIsRewardedReady);
        window.IronSourceAds.isInterstitialReady(setIsInterstitialReady);

        return () => {
            window.IronSourceAds?.removeEventListener('onRewardedVideoAvailabilityChanged', rewardedCallback);
            window.IronSourceAds?.removeEventListener('onInterstitialAdReady', interstitialCallback);
        }
      }
  }, [isAdsInitialized]);


  const showRewardedAd = useCallback((callbacks: { onSuccess: () => void; onFailure: () => void; }) => {
    if (window.IronSourceAds && isAdsInitialized) {
        window.IronSourceAds.isRewardedVideoAvailable(available => {
            if (available) {
                window.IronSourceAds?.showRewardedVideo({
                    onAdRewarded: () => callbacks.onSuccess(),
                    onAdShowFailed: () => callbacks.onFailure(),
                    onAdClosed: () => {
                        // After the ad is closed, check availability again for the next time.
                        window.IronSourceAds?.isRewardedVideoAvailable(setIsRewardedReady);
                    }
                });
            } else {
                callbacks.onFailure();
            }
        });
    } else {
      // Mock behavior for web
      console.log("MOCK: Showing Rewarded Ad.");
      callbacks.onSuccess();
    }
  }, [isAdsInitialized]);

  const showInterstitialAd = useCallback(() => {
    if (window.IronSourceAds && isAdsInitialized) {
        window.IronSourceAds.isInterstitialReady(ready => {
            if (ready) {
                window.IronSourceAds?.showInterstitial({
                    onAdClosed: () => setIsInterstitialReady(false)
                });
            }
        });
    } else {
        console.log("MOCK: Showing Interstitial Ad.");
    }
  }, [isAdsInitialized]);
  
  const showBannerAd = useCallback(() => {
    if(window.IronSourceAds && isAdsInitialized) {
        window.IronSourceAds.showBanner();
    } else {
        console.log("MOCK: Showing Banner Ad.");
    }
  }, [isAdsInitialized]);

  const hideBannerAd = useCallback(() => {
    if(window.IronSourceAds && isAdsInitialized) {
        window.IronSourceAds.hideBanner();
    } else {
        console.log("MOCK: Hiding Banner Ad.");
    }
  }, [isAdsInitialized]);

  const value = {
    isAdsInitialized,
    isRewardedReady,
    isInterstitialReady,
    showRewardedAd,
    showInterstitialAd,
    showBannerAd,
    hideBannerAd,
  };

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds() {
  const context = useContext(AdsContext);
  if (context === undefined) {
    throw new Error('useAds must be used within an AdsProvider');
  }
  return context;
}
