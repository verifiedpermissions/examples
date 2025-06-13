// Network utility functions for the frontend
import { Auth } from 'aws-amplify';

/**
 * Network status monitoring
 */
export const network = {
  /**
   * Check if the application is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  },

  /**
   * Test API connectivity
   * @returns Promise that resolves to true if API is reachable
   */
  async testApiConnectivity(apiEndpoint: string): Promise<boolean> {
    try {
      const response = await fetch(`${apiEndpoint}/health`, {
        method: 'HEAD',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        // 5-second timeout
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      console.error('API connectivity test failed:', error);
      return false;
    }
  },

  /**
   * Test authentication service connectivity
   * @returns Promise that resolves to true if Cognito is reachable
   */
  async testAuthConnectivity(): Promise<boolean> {
    try {
      // Simple ping to Auth service without actually authenticating
      await Auth.currentCredentials();
      return true;
    } catch (error: any) {
      // Some errors are expected (like not being logged in)
      // We're just checking if we can reach the service
      if (error.code === 'NotAuthorizedException' ||
          error.code === 'UserNotFoundException' ||
          error.code === 'ResourceNotFoundException') {
        return true;
      }
      console.error('Auth connectivity test failed:', error);
      return false;
    }
  }
};

/**
 * Utility for retrying operations with exponential backoff
 */
export const retry = {
  /**
   * Retry a function with exponential backoff
   * @param fn Function to retry
   * @param maxRetries Maximum number of retries
   * @param baseDelay Initial delay in milliseconds
   */
  async withBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);

        // Add jitter to avoid synchronized retries
        const jitter = Math.random() * 300;

        console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay + jitter)}ms`);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }

    throw lastError;
  }
};
