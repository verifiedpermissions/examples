/**
 * Centralized API client for the application
 * 
 * This module provides a wrapper around the AWS Amplify API that is
 * configured once at application startup and can be used throughout
 * the application without reloading the configuration.
 */

import { API, Auth } from 'aws-amplify';
import { getConfig } from '../config';

// API Error interface
export interface ApiError extends Error {
  code?: string;
  statusCode?: number;
  response?: any;
}

// API options interface
interface ApiOptions {
  headers?: Record<string, string>;
  [key: string]: any;
}

// Initialize the API client once
let initialized = false;
let apiPathPrefix: string | null = null;

// Initialize the API client
const initialize = () => {
  if (!initialized) {
    const config = getConfig();
    apiPathPrefix = config.apiPathPrefix;
    initialized = true;
    // eslint-disable-next-line no-console
    console.log('API client initialized with path prefix:', apiPathPrefix);
  }
};

// Initialize immediately
initialize();

/**
 * Get the API path with the correct prefix
 */
export const getApiPath = (path: string): string => {
  // Initialize the API path prefix if not already done
  if (apiPathPrefix === null) {
    const config = getConfig();
    apiPathPrefix = config.apiPathPrefix;
    // eslint-disable-next-line no-console
    console.log('API path prefix initialized:', apiPathPrefix);
  }
  
  // Ensure path starts with a slash if not empty
  const formattedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  
  return `${apiPathPrefix}${formattedPath}`;
};

/**
 * Helper function to get auth token
 */
const getAuthToken = async (): Promise<string> => {
  try {
    const session = await Auth.currentSession();
    return session.getIdToken().getJwtToken();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting auth token:', error);
    throw new Error('Authentication required. Please sign in again.');
  }
};

/**
 * Helper function to handle API errors
 */
const handleApiError = (error: any, operation: string): never => {
  const apiError: ApiError = new Error(
    error.response?.data?.message || error.message || `API error during ${operation}`
  );

  apiError.code = error.code;
  apiError.statusCode = error.response?.status;
  apiError.response = error.response?.data;

  // eslint-disable-next-line no-console
  console.error("API Error:", operation, apiError);

  // Handle special cases
  if (error.response?.status === 401) {
    apiError.message = 'Authentication session expired. Please sign in again.';
  } else if (error.response?.status === 403) {
    apiError.message = 'You do not have permission to perform this action.';
  } else if (error.response?.status === 404) {
    apiError.message = 'The requested resource was not found.';
  } else if (error.response?.status >= 500) {
    apiError.message = 'A server error occurred. Please try again later.';
  }

  throw apiError;
};

/**
 * API client for making requests to the backend
 */
export const apiClient = {
  /**
   * Make a GET request
   */
  async get<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
    try {
      const token = await getAuthToken();
      const apiPath = getApiPath(path);
      
      // eslint-disable-next-line no-console
      console.log(`Making API GET request to: ${apiPath}`);
      
      const response = await API.get('petstore', apiPath, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: token
        }
      });
      
      return response;
    } catch (error) {
      return handleApiError(error, `GET ${path}`);
    }
  },
  
  /**
   * Make a POST request
   */
  async post<T = any>(path: string, body: any, options: ApiOptions = {}): Promise<T> {
    try {
      const token = await getAuthToken();
      const apiPath = getApiPath(path);
      
      // eslint-disable-next-line no-console
      console.log(`Making API POST request to: ${apiPath}`);
      
      const response = await API.post('petstore', apiPath, {
        ...options,
        body,
        headers: {
          ...(options.headers || {}),
          Authorization: token
        }
      });
      
      return response;
    } catch (error) {
      return handleApiError(error, `POST ${path}`);
    }
  },
  
  /**
   * Make a PUT request
   */
  async put<T = any>(path: string, body: any, options: ApiOptions = {}): Promise<T> {
    try {
      const token = await getAuthToken();
      const apiPath = getApiPath(path);
      
      // eslint-disable-next-line no-console
      console.log(`Making API PUT request to: ${apiPath}`);
      
      const response = await API.put('petstore', apiPath, {
        ...options,
        body,
        headers: {
          ...(options.headers || {}),
          Authorization: token
        }
      });
      
      return response;
    } catch (error) {
      return handleApiError(error, `PUT ${path}`);
    }
  },
  
  /**
   * Make a DELETE request
   */
  async delete<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
    try {
      const token = await getAuthToken();
      const apiPath = getApiPath(path);
      
      // eslint-disable-next-line no-console
      console.log(`Making API DELETE request to: ${apiPath}`);
      
      const response = await API.del('petstore', apiPath, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: token
        }
      });
      
      return response;
    } catch (error) {
      return handleApiError(error, `DELETE ${path}`);
    }
  }
};
