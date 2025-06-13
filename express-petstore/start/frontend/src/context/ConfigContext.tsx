import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfig, loadConfig } from '../config';

interface ConfigContextType {
  config: AppConfig | null;
  isLoaded: boolean;
  error: Error | null;
}

// Create the context with a default value
const ConfigContext = createContext<ConfigContextType>({
  config: null,
  isLoaded: false,
  error: null
});

// Provider component that will wrap the entire application
export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load configuration once when the provider mounts
  useEffect(() => {
    const initConfig = async () => {
      try {
        const loadedConfig = await loadConfig();
        setConfig(loadedConfig);
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load configuration:', err);
        setError(err instanceof Error ? err : new Error('Unknown error loading configuration'));
        setIsLoaded(true); // Mark as loaded even on error to prevent infinite loading
      }
    };

    initConfig();
  }, []);

  // Value object that will be provided to consumers
  const value = {
    config,
    isLoaded,
    error
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

// Custom hook for accessing the configuration
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
