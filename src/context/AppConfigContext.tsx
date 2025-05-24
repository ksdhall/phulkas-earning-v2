// src/context/AppConfigContext.tsx
"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react'; // Import useSession

// Define the shape of your application configuration
export interface AppConfig {
  LUNCH_FOOD_BASE_INCOME: number;
  LUNCH_FOOD_OVERAGE_SHARE_PERCENT: number;
  LUNCH_DRINK_SHARE_PERCENT: number;
  DINNER_FOOD_OUR_SHARE_PERCENT: number;
  DINNER_FOOD_COMMON_POOL_PERCENT: number;
  DINNER_DRINK_COMMON_POOL_PERCENT: number;
}

// Define a default config (fallback in case fetching fails or is not ready)
const defaultAppConfig: AppConfig = {
  LUNCH_FOOD_BASE_INCOME: 8000,
  LUNCH_FOOD_OVERAGE_SHARE_PERCENT: 0.5,
  LUNCH_DRINK_SHARE_PERCENT: 0.25,
  DINNER_FOOD_OUR_SHARE_PERCENT: 0.75,
  DINNER_FOOD_COMMON_POOL_PERCENT: 0.25,
  DINNER_DRINK_COMMON_POOL_PERCENT: 0.25,
};

// Create the context
const AppConfigContext = createContext<AppConfig | undefined>(undefined);

interface AppConfigProviderProps {
  children: ReactNode;
  // initialConfig is no longer strictly needed here if we fetch on client,
  // but we can keep it as a server-provided initial state or for SSR hydration.
  // For robustness, we'll use it as the initial state and then re-fetch if needed.
  initialConfig?: AppConfig;
}

export const AppConfigProvider: React.FC<AppConfigProviderProps> = ({ children, initialConfig }) => {
  const { data: session, status } = useSession();
  const [config, setConfig] = useState<AppConfig>(initialConfig || defaultAppConfig);
  const [loading, setLoading] = useState(true); // Track loading state for config
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (status === 'loading') return; // Don't fetch if session status is still loading
    if (status === 'unauthenticated') {
      // If unauthenticated, use default config and stop loading
      setConfig(defaultAppConfig);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch from the API route. Since this is client-side, the browser will handle cookies.
      const response = await fetch('/api/config');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch application configuration.');
      }
      const fetchedConfig: AppConfig = await response.json();
      setConfig(fetchedConfig);
    } catch (e: any) {
      console.error("AppConfigContext: Error fetching config:", e);
      setError(e.message || "Failed to load application configuration.");
      setConfig(defaultAppConfig); // Fallback to default on error
    } finally {
      setLoading(false);
    }
  }, [status]); // Re-run if session status changes

  useEffect(() => {
    // Only fetch if session status is known and authenticated
    if (status === 'authenticated' || status === 'unauthenticated') {
      fetchConfig();
    }
  }, [status, fetchConfig]);

  // If you want to show a loading state while config is being fetched
  if (loading && status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading application configuration...</p> {/* Or a spinner */}
      </div>
    );
  }

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
};

// Custom hook to use the AppConfig
export const useAppConfig = (): AppConfig => {
  const context = useContext(AppConfigContext);
  if (context === undefined) {
    // This should ideally not happen if AppConfigProvider is wrapping the app correctly
    console.warn("useAppConfig must be used within an AppConfigProvider. Falling back to default config.");
    return defaultAppConfig;
  }
  return context;
};
