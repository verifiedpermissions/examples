import { configureAmplify } from './amplifyConfig';

interface Config {
  region: string;
  userPoolId: string;
  userPoolWebClientId: string;
  apiEndpoint: string;
  apiPathSuffix?: string;
  authorizationMode?: string;
}

export async function loadConfig(): Promise<Config> {
  try {
    // Try to fetch from public/config.json
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }

    const config = await response.json();

    // Configure Amplify with the loaded config
    configureAmplify(config);

    console.log('Application configured with:', {
      region: config.region,
      userPoolId: config.userPoolId,
      apiEndpoint: config.apiEndpoint
    });

    return config;
  } catch (error) {
    console.error('Error loading configuration:', error);
    throw error;
  }
}
