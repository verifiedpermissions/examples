import { Pet } from '../types/pet';
import { useApiAuth } from '../hooks/useApiAuth';
import { useState, useCallback } from 'react';
import { useConfig } from '../hooks/useConfig';
import { getConfig } from '../config';

// API resource paths
const API_RESOURCES = {
  PETS: '/pets'
};

// API error interface
export interface ApiError extends Error {
  code?: string;
  statusCode?: number;
  response?: unknown;
}

/**
 * Hook to interact with the Pet API
 */
export const usePetApi = () => {
  const { getAuthHeader, refreshToken } = useApiAuth();
  const config = useConfig();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  /**
   * Helper function to handle API errors
   */
  const handleApiError = useCallback((error: unknown, operation: string): ApiError => {
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
      errorObj.response?.data?.message || errorObj.message || `API error during ${operation}`
    );

    apiError.code = errorObj.code;
    apiError.statusCode = errorObj.response?.status;
    apiError.response = errorObj.response?.data;

    // Log API error for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.error("API Error:", operation, apiError);
    }

    // Handle special cases
    if (errorObj.response?.status === 401) {
      apiError.message = 'Authentication session expired. Please sign in again.';
    } else if (errorObj.response?.status === 403) {
      apiError.message = 'You do not have permission to perform this action.';
    } else if (errorObj.response?.status === 404) {
      apiError.message = 'The requested resource was not found.';
    } else if (errorObj.response?.status && errorObj.response.status >= 500) {
      apiError.message = 'A server error occurred. Please try again later.';
    }

    setError(apiError);
    return apiError;
  }, []);

  /**
   * Helper function to build API path
   */
  const buildApiPath = useCallback((resource: string, id?: string): string => {
    // Use the centralized config to ensure it's loaded
    const appConfig = getConfig();
    const basePath = `${appConfig.apiPathPrefix}${resource}`;
    return id ? `${basePath}/${id}` : basePath;
  }, []);

  /**
   * Generic fetch function with authentication and error handling
   */
  const fetchWithAuth = useCallback(async <T>(
    resource: string,
    id?: string,
    options: RequestInit = {}
  ): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        throw new Error('Authentication required');
      }

      // Build the full API path
      const url = buildApiPath(resource, id);

      // Log API request in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Making API request to: ${config.apiEndpoint}${url}`);
      }

      const headers = {
        ...options.headers,
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${config.apiEndpoint}${url}`, {
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
              const retryResponse = await fetch(`${config.apiEndpoint}${url}`, {
                ...options,
                headers: {
                  ...options.headers,
                  'Authorization': newAuthHeader,
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
          data: errorData
        };
        throw error;
      }

      const data = await response.json();
      setLoading(false);
      return data;
    } catch (error) {
      const operation = resource.split('/').pop() || 'API request';
      handleApiError(error, operation);
      setLoading(false);
      throw error;
    }
  }, [config.apiEndpoint, buildApiPath, getAuthHeader, refreshToken, handleApiError]);

  /**
   * Get all pets
   */
  const getAllPets = useCallback(async (): Promise<Pet[]> => {
    try {
      const data = await fetchWithAuth<{data: {pets: Pet[]}}>(
        API_RESOURCES.PETS
      );
      return data.data.pets;
    } catch (error) {
      throw handleApiError(error, 'fetching pets');
    }
  }, [fetchWithAuth, handleApiError]);

  /**
   * Get pet by ID
   */
  const getPetById = useCallback(async (id: string): Promise<Pet> => {
    try {
      const data = await fetchWithAuth<{data: {pet: Pet}}>(
        API_RESOURCES.PETS,
        id
      );
      return data.data.pet;
    } catch (error) {
      throw handleApiError(error, `fetching pet with ID ${id}`);
    }
  }, [fetchWithAuth, handleApiError]);

  /**
   * Create pet
   */
  const createPet = useCallback(async (petData: Omit<Pet, 'id' | 'createdAt' | 'createdBy'>): Promise<Pet> => {
    try {
      const data = await fetchWithAuth<{data: {pet: Pet}}>(
        API_RESOURCES.PETS,
        undefined,
        {
          method: 'POST',
          body: JSON.stringify(petData),
        }
      );
      return data.data.pet;
    } catch (error) {
      throw handleApiError(error, 'creating pet');
    }
  }, [fetchWithAuth, handleApiError]);

  /**
   * Update pet
   */
  const updatePet = useCallback(async (id: string, petData: Partial<Pet>): Promise<Pet> => {
    try {
      const data = await fetchWithAuth<{data: {pet: Pet}}>(
        API_RESOURCES.PETS,
        id,
        {
          method: 'PUT',
          body: JSON.stringify(petData),
        }
      );
      return data.data.pet;
    } catch (error) {
      throw handleApiError(error, `updating pet with ID ${id}`);
    }
  }, [fetchWithAuth, handleApiError]);

  /**
   * Delete pet
   */
  const deletePet = useCallback(async (id: string): Promise<void> => {
    try {
      await fetchWithAuth(
        API_RESOURCES.PETS,
        id,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      throw handleApiError(error, `deleting pet with ID ${id}`);
    }
  }, [fetchWithAuth, handleApiError]);

  return {
    getAllPets,
    getPetById,
    createPet,
    updatePet,
    deletePet,
    loading,
    error,
  };
};
