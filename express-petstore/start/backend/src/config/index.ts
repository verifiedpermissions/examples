import dotenv from 'dotenv';
import cedarSchema from './v4.cedarschema.json';

// Load environment variables from .env file
dotenv.config();

// Default configuration
export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    enableClustering: process.env.ENABLE_CLUSTERING === 'true',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
  },
  dynamodb: {
    petsTable: process.env.PETS_TABLE || 'mock-pets-table',
    localEndpoint: process.env.DYNAMODB_LOCAL_ENDPOINT || null,
  },
  cors: {
    allowedOrigins: (
      process.env.CORS_ALLOWED_ORIGINS ||
      'http://localhost:3000,http://localhost:3001'
    ).split(','),
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  logging: {
    debugMode: process.env.DEBUG_LOGGING === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  useMocks: process.env.USE_LOCAL_MOCKS === 'true',
};

// Export both named and default for compatibility
export { config as default };
