import { Pet } from '../types';

/**
 * Mock Pet Model for development and testing
 */
export class MockPetModel {
  private pets: Pet[] = [
    {
      id: '1',
      name: 'Fluffy',
      species: 'Dog',
      breed: 'Golden Retriever',
      age: 3,
      ownerId: 'customer@example.com',
      ownerName: 'John Doe',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Whiskers',
      species: 'Cat',
      breed: 'Siamese',
      age: 2,
      ownerId: 'customer@example.com',
      ownerName: 'Jane Smith',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  getAll(): Pet[] {
    return [...this.pets];
  }

  getById(id: string): Pet | null {
    const pet = this.pets.find(p => p.id === id);
    return pet ? { ...pet } : null;
  }

  getByOwnerId(ownerId: string): Pet[] {
    return this.pets.filter(p => p.ownerId === ownerId).map(p => ({ ...p }));
  }

  create(pet: Partial<Pet>): Pet {
    const newPet: Pet = {
      id: pet.id || `${this.pets.length + 1}`,
      name: pet.name || 'Unnamed Pet',
      species: pet.species || 'Unknown',
      breed: pet.breed,
      age: pet.age,
      ownerId: pet.ownerId || 'customer@example.com',
      ownerName: pet.ownerName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.pets.push(newPet);
    return { ...newPet };
  }

  update(id: string, updates: Partial<Pet>): Pet | null {
    const index = this.pets.findIndex(p => p.id === id);
    if (index === -1) return null;

    const updatedPet: Pet = {
      ...this.pets[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    this.pets[index] = updatedPet;
    return { ...updatedPet };
  }

  delete(id: string): boolean {
    const initialLength = this.pets.length;
    this.pets = this.pets.filter(p => p.id !== id);
    return this.pets.length < initialLength;
  }
}
