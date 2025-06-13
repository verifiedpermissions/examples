import { Request, Response, NextFunction } from 'express';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { catchAsync } from '../utils/errors';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { Pet } from '../types';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * Get all pets
 */
export const getAllPets = catchAsync(async (req: Request, res: Response) => {
  const params = {
    TableName: config.dynamodb.petsTable,
  };

  const docClient = req.app.locals.docClient as DynamoDBDocumentClient;
  const result = await docClient.send(new ScanCommand(params));

  logger.debug(`Retrieved ${result.Items?.length || 0} pets for admin/employee`);

  return res.status(200).json({
    status: 'success',
    results: result.Items?.length || 0,
    data: { pets: result.Items || [] },
  });

});

/**
 * Get a pet by ID
 */
export const getPet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const docClient = req.app.locals.docClient as DynamoDBDocumentClient;
  const result = await docClient.send(
    new GetCommand({
      TableName: config.dynamodb.petsTable,
      Key: { id: req.params.id },
    })
  );

  if (!result.Item) {
    return next(new NotFoundError('Pet not found'));
  }

  logger.debug(`Retrieved pet ${req.params.id}`);

  res.status(200).json({
    status: 'success',
    data: { pet: result.Item },
  });
});

/**
 * Create a new pet
 */
export const createPet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, species, breed, age, ownerName } = req.body;

  if (!name || !species) {
    return next(new BadRequestError('Name and species are required'));
  }

  const now = new Date().toISOString();
  const pet: Pet = {
    id: uuidv4(),
    name,
    species,
    breed: breed || undefined,
    age: age !== undefined ? Number(age) : undefined,
    ownerId: req.user?.email || 'customer@example.com',
    ownerName: ownerName || req.user?.email || undefined,
    createdAt: now,
    updatedAt: now
  };

  const docClient = req.app.locals.docClient as DynamoDBDocumentClient;
  await docClient.send(
    new PutCommand({
      TableName: config.dynamodb.petsTable,
      Item: pet,
    })
  );

  logger.debug(`Created new pet with ID ${pet.id}`);

  res.status(201).json({
    status: 'success',
    data: { pet },
  });
});

/**
 * Update a pet
 */
export const updatePet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, species, breed, age, ownerName } = req.body;
  const petId = req.params.id;

  // First check if the pet exists
  const docClient = req.app.locals.docClient as DynamoDBDocumentClient;
  const existingPetResult = await docClient.send(
    new GetCommand({
      TableName: config.dynamodb.petsTable,
      Key: { id: petId },
    })
  );

  if (!existingPetResult.Item) {
    return next(new NotFoundError('Pet not found'));
  }

  const _existingPet = existingPetResult.Item as Pet;

  // Update the pet
  const updatedPet: Pet = {
    ..._existingPet,
    name: name || _existingPet.name,
    species: species || _existingPet.species,
    breed: breed !== undefined ? breed : _existingPet.breed,
    age: age !== undefined ? Number(age) : _existingPet.age,
    ownerName: ownerName !== undefined ? ownerName : _existingPet.ownerName,
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: config.dynamodb.petsTable,
      Item: updatedPet,
    })
  );

  logger.debug(`Updated pet with ID ${petId}`);

  res.status(200).json({
    status: 'success',
    data: { pet: updatedPet },
  });
});

/**
 * Delete a pet
 */
export const deletePet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const petId = req.params.id;

  // First check if the pet exists
  const docClient = req.app.locals.docClient as DynamoDBDocumentClient;
  const existingPetResult = await docClient.send(
    new GetCommand({
      TableName: config.dynamodb.petsTable,
      Key: { id: petId },
    })
  );

  if (!existingPetResult.Item) {
    return next(new NotFoundError('Pet not found'));
  }

  // Delete the pet
  await docClient.send(
    new DeleteCommand({
      TableName: config.dynamodb.petsTable,
      Key: { id: petId },
    })
  );

  logger.debug(`Deleted pet with ID ${petId}`);

  res.status(204).end();
});
