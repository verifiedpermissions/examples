import { API, Auth } from 'aws-amplify';
import { retry, network } from './network';
import { getConfig } from '../config';

// API resource paths
const API_RESOURCES = {
  PETS: '/pets'
};

// Pet interface
export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  status: 'available' | 'pending' | 'adopted';
  owner?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

// API Error interface
export interface ApiError extends Error {
  code?: string;
  statusCode?: number;
  response?: any;
}

// Helper function to get token
const getAuthToken = async (): Promise<string> => {
  try {
    const session = await retry.withBackoff(
      async () => Auth.currentSession(),
      3,  // 3 retries
      1000 // Start with 1s delay
    );
    return session.getIdToken().getJwtToken(); // Use ID token instead of access token
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw new Error('Authentication required. Please sign in again.');
  }
};

// Helper function to handle API errors
const handleApiError = (error: any, operation: string): never => {
  const apiError: ApiError = new Error(
    error.response?.data?.message || error.message || `API error during ${operation}`
  );

  apiError.code = error.code;
  apiError.statusCode = error.response?.status;
  apiError.response = error.response?.data;

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

// Helper function to build API path
const buildApiPath = (resource: string, id?: string): string => {
  const config = getConfig();
  const basePath = `${config.apiPathPrefix}${resource}`;
  return id ? `${basePath}/${id}` : basePath;
};

// Pet API functions
export const petApi = {
  // Get all pets
  async getAllPets(): Promise<Pet[]> {
    if (!network.isOnline()) {
      throw new Error('Cannot fetch pets while offline');
    }

    try {
      const token = await getAuthToken();
      const path = buildApiPath(API_RESOURCES.PETS);
      console.log(`Making API request to: ${path}`);
      
      const response = await retry.withBackoff(async () => {
        return API.get('petstore', path, {
          headers: {
            Authorization: token
          }
        });
      });
      return response.data.pets;
    } catch (error) {
      return handleApiError(error, 'fetching pets');
    }
  },

  // Get pet by ID
  async getPetById(id: string): Promise<Pet> {
    if (!network.isOnline()) {
      throw new Error('Cannot fetch pet details while offline');
    }

    try {
      const token = await getAuthToken();
      const path = buildApiPath(API_RESOURCES.PETS, id);
      console.log(`Making API request to: ${path}`);
      
      const response = await retry.withBackoff(async () => {
        return API.get('petstore', path, {
          headers: {
            Authorization: token
          }
        });
      });
      return response.data.pet;
    } catch (error) {
      return handleApiError(error, `fetching pet with ID ${id}`);
    }
  },

  // Create pet
  async createPet(petData: Omit<Pet, 'id' | 'createdAt' | 'createdBy'>): Promise<Pet> {
    if (!network.isOnline()) {
      throw new Error('Cannot create pet while offline');
    }

    try {
      const token = await getAuthToken();
      const path = buildApiPath(API_RESOURCES.PETS);
      console.log(`Making API request to: ${path}`);
      
      const response = await retry.withBackoff(async () => {
        return API.post('petstore', path, {
          body: petData,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      });
      return response.data.pet;
    } catch (error) {
      return handleApiError(error, 'creating pet');
    }
  },

  // Update pet
  async updatePet(id: string, petData: Partial<Pet>): Promise<Pet> {
    if (!network.isOnline()) {
      throw new Error('Cannot update pet while offline');
    }

    try {
      const token = await getAuthToken();
      const path = buildApiPath(API_RESOURCES.PETS, id);
      console.log(`Making API request to: ${path}`);
      
      const response = await retry.withBackoff(async () => {
        return API.put('petstore', path, {
          body: petData,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      });
      return response.data.pet;
    } catch (error) {
      return handleApiError(error, `updating pet with ID ${id}`);
    }
  },

  // Delete pet
  async deletePet(id: string): Promise<void> {
    if (!network.isOnline()) {
      throw new Error('Cannot delete pet while offline');
    }

    try {
      const token = await getAuthToken();
      const path = buildApiPath(API_RESOURCES.PETS, id);
      console.log(`Making API request to: ${path}`);
      
      await retry.withBackoff(async () => {
        return API.del('petstore', path, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      });
    } catch (error) {
      handleApiError(error, `deleting pet with ID ${id}`);
    }
  }
};
