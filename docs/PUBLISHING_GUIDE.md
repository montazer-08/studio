# Publishing Guide: Next.js to Android APK with Ads

This guide provides the necessary steps to convert your Next.js web application into a native Android APK with working ironSource ads.

The application's code is already prepared to work in a hybrid environment. The `AdsProvider` will automatically detect if it's running inside a native wrapper (like Capacitor) and call the native ad SDKs. If not, it will use a mock implementation for web development.

## Prerequisites

- Node.js and npm installed.
- Android Studio installed and configured for Android development.

## Step 1: Install Capacitor

Capacitor is a tool that allows you to wrap your web app in a native container.

```bash
# Install Capacitor CLI locally
npm install @capacitor/cli @capacitor/core

# Install the Android platform for Capacitor
npm install @capacitor/android
```

## Step 2: Initialize Capacitor

Initialize Capacitor in your Next.js project.

```bash
# This creates the capacitor.config.ts file
npx cap init [AppName] [AppID]
```
- **AppName**: The name of your application (e.g., "OmniCore").
- **AppID**: A unique identifier for your app, in reverse domain style (e.g., "com.omnicore.app").

In the generated `capacitor.config.ts` file, you **must** change the `webDir` to `"out"` because Next.js outputs the static export to the `out` directory.

```typescript
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.omnicore.app',
  appName: 'OmniCore',
  webDir: 'out', // <--- IMPORTANT: Change this to 'out'
  bundledWebRuntime: false
};

export default config;
```

## Step 3: Configure Next.js for Static Export

Capacitor works with statically exported web apps. Configure your `next.config.ts` and `package.json`.

1.  **In `next.config.ts`**, add the `output: 'export'` option:

    ```ts
    import type {NextConfig} from 'next';

    const nextConfig: NextConfig = {
      output: 'export', // <--- Add this line
      /* ... other config ... */
    };

    export default nextConfig;
    ```

2.  **In `package.json`**, modify the `build` script to generate the static export:

    ```json
    "scripts": {
      "dev": "next dev --turbopack -p 9002",
      "build": "next build", // This now creates the 'out' folder
      /* ... other scripts ... */
    },
    ```

## Step 4: Add the Android Platform

```bash
# This command creates the native Android project in a new 'android' directory
npx cap add android
```

## Step 5: Install the ironSource Cordova Plugin

This plugin is the **critical bridge** that connects your JavaScript code (`window.IronSourceAds`) to the native ironSource SDK.

```bash
# Install the Cordova plugin for ironSource
npm install cordova-plugin-ironsource-ads
```
This plugin will be automatically detected by Capacitor.

## Step 6: Build and Sync Your App

1.  **Build your Next.js app:** This creates the static files in the `out` directory.
    ```bash
    npm run build
    ```

2.  **Sync the web assets with the native project:**
    ```bash
    npx cap sync android
    ```

## Step 7: Configure ironSource in Android Studio

1.  **Open the Android project in Android Studio:**
    ```bash
    npx cap open android
    ```

2.  Once Android Studio opens, you need to follow the **official ironSource integration guide for Android**. This typically involves:
    *   Adding the ironSource Maven repository to your `build.gradle` file.
    *   Adding the ironSource SDK and any ad network adapters as dependencies.
    *   Updating your `AndroidManifest.xml` with the necessary permissions, activities, and your ironSource App Key.

    This step is **mandatory**. The Cordova plugin provides the bridge, but the native project itself must contain the actual ironSource SDK.

## Step 8: Run and Test Your App

You can now run your application on an Android emulator or a physical device directly from Android Studio. Test the ad placements thoroughly:

-   The banner ad should appear at the bottom.
-   Interstitial ads should appear after creating 3 tasks, notes, or files.
-   Rewarded ads should appear when you try to activate a "Power".

By following these steps, you will have a functional Android APK where the JavaScript in your Next.js app correctly communicates with the native ironSource SDK to display real ads.
