import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
// Import commands but prefix with underscore to indicate they're not used directly in this file
// but might be used in the future
import {
  // PutCommand,
  ScanCommand,
  // QueryCommand,
  // DeleteCommand
} from '@aws-sdk/lib-dynamodb';
// import { v4 as uuidv4 } from 'uuid';
import { Pet } from '../types';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * Pet model for interacting with the DynamoDB table
 */
export class PetModel {
  /**
   * Get a pet by ID
   */
  static async getPetById(
    id: string,
    docClient: DynamoDBDocumentClient
  ): Promise<Pet | null> {
    try {
      const result = await docClient.send(
        new GetCommand({
          TableName: config.dynamodb.petsTable,
          Key: { id },
        })
      );

      if (!result.Item) {
        return null;
      }

      return result.Item as Pet;
    } catch (error) {
      logger.error('Error getting pet by ID:', error);
      throw error;
    }
  }

  /**
   * Get all pets
   */
  static async getAllPets(docClient: DynamoDBDocumentClient): Promise<Pet[]> {
    try {
      const result = await docClient.send(
        new ScanCommand({
          TableName: config.dynamodb.petsTable,
        })
      );

      return (result.Items || []) as Pet[];
    } catch (error) {
      logger.error('Error getting all pets:', error);
      throw error;
    }
  }
}
