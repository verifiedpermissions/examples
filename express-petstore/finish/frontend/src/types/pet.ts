/**
 * Pet entity type definition
 */
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

/**
 * Pet creation parameters
 */
export type CreatePetParams = Omit<Pet, 'id' | 'createdAt' | 'createdBy' | 'updatedAt'>;

/**
 * Pet update parameters
 */
export type UpdatePetParams = Partial<Omit<Pet, 'id' | 'createdAt' | 'createdBy' | 'updatedAt'>>;
