import { Request, Response } from 'express';
import {
  getAllPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
} from '../../controllers/petController';
import { NotFoundError } from '../../utils/errors';

// Mock DynamoDB and Express
jest.mock('@aws-sdk/lib-dynamodb', () => {
  const originalModule = jest.requireActual('@aws-sdk/lib-dynamodb');
  return {
    ...originalModule,
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: jest.fn(),
      })),
    },
    ScanCommand: jest.fn(),
    QueryCommand: jest.fn(),
    GetCommand: jest.fn(),
    PutCommand: jest.fn(),
    DeleteCommand: jest.fn(),
    UpdateCommand: jest.fn(),
  };
});

// Mock UUID generation
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

describe('Pet Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let mockDocClient: { send: jest.Mock };

  beforeEach(() => {
    // Setup Express request and response objects
    req = {
      params: { id: 'test-id' },
      body: {
        name: 'Test Pet',
        species: 'Dog',
        breed: 'Mixed',
        age: 3,
        status: 'available',
      },
      user: {
        email: 'user@example.com',
        groups: ['Customers'],
        sub: 'user-id',
        token: 'mock-token',
        tokenType: 'id' as const,
      },
      app: {
        locals: {},
      } as any,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    next = jest.fn();

    // Setup mock DynamoDB client
    mockDocClient = { send: jest.fn() };
    req.app!.locals.docClient = mockDocClient;
  });

  describe('getAllPets', () => {
    test('should return all pets for admin users', async () => {
      // Setup
      req.user!.groups = ['Administrators'];
      const mockItems = [{ id: 'pet1' }, { id: 'pet2' }];
      mockDocClient.send.mockResolvedValueOnce({ Items: mockItems });

      // Execute
      await getAllPets(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        results: 2,
        data: { pets: mockItems },
      });
    });

    test("should return user's pets for customers", async () => {
      // Setup
      req.user!.groups = ['Customers'];
      const mockItems = [{ id: 'pet1', owner: 'user@example.com' }];
      mockDocClient.send.mockResolvedValueOnce({ Items: mockItems });

      // Execute
      await getAllPets(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        results: 1,
        data: { pets: mockItems },
      });
    });
  });

  describe('getPet', () => {
    test('should return a pet if it exists', async () => {
      // Setup
      const mockPet = { id: 'test-id', name: 'Max', species: 'Dog' };
      mockDocClient.send.mockResolvedValueOnce({ Item: mockPet });

      // Execute
      await getPet(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { pet: mockPet },
      });
    });

    test('should call next with NotFoundError if pet not found', async () => {
      // Setup
      mockDocClient.send.mockResolvedValueOnce({ Item: null });

      // Execute
      await getPet(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('createPet', () => {
    test('should create a pet successfully', async () => {
      // Setup
      mockDocClient.send.mockResolvedValueOnce({});

      // Execute
      await createPet(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          pet: expect.objectContaining({
            id: 'test-uuid',
            name: 'Test Pet',
            species: 'Dog',
          }),
        },
      });
    });

    test('should call next with BadRequestError if required fields missing', async () => {
      // Setup
      req.body = { species: 'Dog' }; // Missing name

      // Execute
      await createPet(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });
  });

  // Additional tests for updatePet and deletePet would follow a similar pattern
});
