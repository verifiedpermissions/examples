/**
 * Application configuration
 * 
 * This module provides a centralized configuration that is loaded
 * before the application starts. It ensures configuration is available
 * before any API calls are made.
 */

// Configuration interface
export interface AppConfig {
  region: string;
  userPoolId: string;
  userPoolWebClientId: string;
  apiEndpoint: string;
  apiPathPrefix: string;
  authorizationMode: string;
  useMockAuth: boolean;
}

// Default configuration
const defaultConfig: AppConfig = {
  region: 'us-east-1',
  userPoolId: '',
  userPoolWebClientId: '',
  apiEndpoint: 'http://localhost:3000',
  apiPathPrefix: '/api',
  authorizationMode: 'lambda',
  useMockAuth: false
};

// The actual configuration object that will be exported
let config: AppConfig = { ...defaultConfig };

// Flag to track if configuration has been loaded
let isConfigLoaded = false;
let loadingPromise: Promise<AppConfig> | null = null;

/**
 * Load configuration synchronously
 * This is called before the application renders
 */
export const loadConfig = async (): Promise<AppConfig> => {
  // If already loaded, return the config immediately
  if (isConfigLoaded) {
    return config;
  }
  
  // If loading is in progress, return the existing promise
  if (loadingPromise) {
    return loadingPromise;
  }
  
  // Start loading and store the promise
  loadingPromise = new Promise<AppConfig>(async (resolve) => {
    try {
      // eslint-disable-next-line no-console
      console.log('Loading application configuration...');
      const response = await fetch('/config.json');
      
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status} ${response.statusText}`);
      }
      
      const configData = await response.json();
      config = { ...defaultConfig, ...configData };
      isConfigLoaded = true;
      
      // eslint-disable-next-line no-console
      console.log('Configuration loaded successfully:', {
        apiEndpoint: config.apiEndpoint,
        apiPathPrefix: config.apiPathPrefix
      });
      
      resolve(config);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading configuration:', error);
      resolve(defaultConfig);
    }
  });
  
  return loadingPromise;
};

/**
 * Get the current configuration
 * This will return the loaded configuration or default values
 */
export const getConfig = (): AppConfig => {
  return config;
};

/**
 * Check if configuration has been loaded
 */
export const isLoaded = (): boolean => {
  return isConfigLoaded;
};

export default config;
