import { useState, useEffect } from 'react';
import { getConfig, AppConfig } from '../config';

/**
 * Hook to access application configuration
 *
 * Uses the centralized configuration that is loaded before the app renders
 */
export const useConfig = () => {
  const [config, setConfig] = useState<AppConfig>(getConfig());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<Error | null>(null);

  // This effect is mainly for reactive updates if config changes
  useEffect(() => {
    // Configuration is already loaded by the ConfigLoader component
    // This is just to ensure the component gets the latest config
    setConfig(getConfig());
  }, []);

  return {
    ...config,
    isLoaded: true,
    loading,
    error,
  };
};
