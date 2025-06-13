import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConfig } from './useConfig';
import { Pet } from '../types/pet';

// API error interface
export interface ApiError extends Error {
  code?: string;
  statusCode?: number;
  response?: unknown;
}

// Generic response data type
export type ApiResponse<T> = {
  status: string;
  data: T;
};

/**
 * Hook to interact with APIs with automatic token handling
 * Consolidates functionality from useApiAuth and usePetApi
 */
export const useApi = () => {
  const { getIdToken, isAuthenticated } = useAuth();
  const { apiEndpoint } = useConfig();
  const [authHeader, setAuthHeader] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Update auth header when authentication state changes
  useEffect(() => {
    const refreshAuthHeader = async () => {
      if (isAuthenticated) {
        try {
          const token = await getIdToken();
          if (token) {
            setAuthHeader(`Bearer ${token}`);
          } else {
            setAuthHeader(null);
          }
        } catch (error) {
          // Error getting auth token, set to null
          setAuthHeader(null);
        }
      } else {
        setAuthHeader(null);
      }
    };

    refreshAuthHeader();
  }, [isAuthenticated, getIdToken]);

  /**
   * Check if a token is expired
   */
  const isTokenExpired = useCallback((token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp <= now;
    } catch (error) {
      // Error checking token expiration, assume expired
      return true;
    }
  }, []);

  /**
   * Get current auth header for API requests
   */
  const getAuthHeader = useCallback(async (): Promise<string | null> => {
    // If we already have a valid token, return it
    if (authHeader && !isTokenExpired(authHeader.split(' ')[1])) {
      return authHeader;
    }

    // Otherwise get a fresh token
    try {
      const token = await getIdToken();
      if (token) {
        const newHeader = `Bearer ${token}`;
        setAuthHeader(newHeader);
        return newHeader;
      }
    } catch (error) {
      // Error refreshing auth token
    }

    return null;
  }, [authHeader, getIdToken, isTokenExpired]);

  /**
   * Refresh token explicitly
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getIdToken();
      if (token) {
        setAuthHeader(`Bearer ${token}`);
        return true;
      }
      return false;
    } catch (error) {
      // Error refreshing token
      return false;
    }
  }, [getIdToken]);

  /**
   * Handle API errors consistently
   */
  const handleApiError = useCallback(
    (error: unknown, operation: string): ApiError => {
      // Type guard for error objects with response property
      const isErrorWithResponse = (err: unknown): err is {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
        code?: string;
      } => {
        return typeof err === 'object' && err !== null;
      };

      const errorObj = isErrorWithResponse(error) ? error : {};

      const apiError: ApiError = new Error(
        errorObj.response?.data?.message ||
          errorObj.message ||
          `API error during ${operation}`
      );

      apiError.code = errorObj.code;
      apiError.statusCode = errorObj.response?.status;
      apiError.response = errorObj.response?.data;

      // Log API error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.error("API Error:", operation, apiError);
      }

      // Network errors (no response)
      if (errorObj.message === 'Network Error' || !errorObj.response) {
        apiError.message =
          'Cannot connect to the server. Please check your internet connection or try again later.';
        apiError.code = 'NETWORK_ERROR';
      }
      // Handle special cases with user-friendly messages
      else if (errorObj.response?.status === 401) {
        apiError.message =
          'Authentication session expired. Please sign in again.';
      } else if (errorObj.response?.status === 403) {
        apiError.message = 'You do not have permission to perform this action.';
      } else if (errorObj.response?.status === 404) {
        apiError.message = 'The requested resource was not found.';
      } else if (errorObj.response?.status && errorObj.response.status >= 500) {
        apiError.message = 'A server error occurred. Please try again later.';
      }

      setError(apiError);
      return apiError;
    },
    []
  );

  /**
   * Generic fetch function with authentication and error handling
   */
  const fetchWithAuth = useCallback(
    async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        const authHeader = await getAuthHeader();
        if (!authHeader) {
          throw new Error('Authentication required');
        }

        const headers = {
          ...options.headers,
          Authorization: authHeader,
          'Content-Type': 'application/json',
        };

        const response = await fetch(`${apiEndpoint}${url}`, {
          ...options,
          headers,
        });

        // Handle HTTP errors
        if (!response.ok) {
          // Check if token expired (401) and try to refresh once
          if (response.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed) {
              // Retry with new token
              const newAuthHeader = await getAuthHeader();
              if (newAuthHeader) {
                const retryResponse = await fetch(`${apiEndpoint}${url}`, {
                  ...options,
                  headers: {
                    ...options.headers,
                    Authorization: newAuthHeader,
                    'Content-Type': 'application/json',
                  },
                });

                if (retryResponse.ok) {
                  const data = await retryResponse.json();
                  setLoading(false);
                  return data;
                }
              }
            }
          }

          const errorData = await response.json().catch(() => ({}));
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & {
            response?: { status: number; data: unknown };
          };
          error.response = {
            status: response.status,
            data: errorData,
          };
          throw error;
        }

        const data = await response.json();
        setLoading(false);
        return data;
      } catch (error) {
        const operation = url.split('/').pop() || 'API request';
        handleApiError(error, operation);
        setLoading(false);
        throw error;
      }
    },
    [apiEndpoint, getAuthHeader, refreshToken, handleApiError]
  );

  // Pet API functions
  const petApi = {
    /**
     * Get all pets
     */
    getAllPets: async (): Promise<Pet[]> => {
      try {
        const response = await fetchWithAuth<ApiResponse<{ pets: Pet[] }>>(
          '/pets'
        );
        return response.data.pets;
      } catch (error) {
        throw handleApiError(error, 'fetching pets');
      }
    },

    /**
     * Get pet by ID
     */
    getPetById: async (id: string): Promise<Pet> => {
      try {
        const response = await fetchWithAuth<ApiResponse<{ pet: Pet }>>(
          `/pets/${id}`
        );
        return response.data.pet;
      } catch (error) {
        throw handleApiError(error, `fetching pet with ID ${id}`);
      }
    },

    /**
     * Create pet
     */
    createPet: async (
      petData: Omit<Pet, 'id' | 'createdAt' | 'createdBy'>
    ): Promise<Pet> => {
      try {
        const response = await fetchWithAuth<ApiResponse<{ pet: Pet }>>(
          '/pets',
          {
            method: 'POST',
            body: JSON.stringify(petData),
          }
        );
        return response.data.pet;
      } catch (error) {
        throw handleApiError(error, 'creating pet');
      }
    },

    /**
     * Update pet
     */
    updatePet: async (id: string, petData: Partial<Pet>): Promise<Pet> => {
      try {
        const response = await fetchWithAuth<ApiResponse<{ pet: Pet }>>(
          `/pets/${id}`,
          {
            method: 'PUT',
            body: JSON.stringify(petData),
          }
        );
        return response.data.pet;
      } catch (error) {
        throw handleApiError(error, `updating pet with ID ${id}`);
      }
    },

    /**
     * Delete pet
     */
    deletePet: async (id: string): Promise<void> => {
      try {
        await fetchWithAuth(`/pets/${id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        throw handleApiError(error, `deleting pet with ID ${id}`);
      }
    },
  };

  return {
    // Auth utilities
    getAuthHeader,
    refreshToken,
    isTokenExpired: authHeader
      ? isTokenExpired(authHeader.split(' ')[1])
      : true,

    // Generic fetch utility
    fetchWithAuth,

    // Pet API
    petApi,

    // Common state
    loading,
    error,
    setError,
  };
};
