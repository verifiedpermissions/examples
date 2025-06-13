import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { debugMiddleware } from './middleware/debugMiddleware';
import petRoutes from './routes/petRoutes';
import debugRoutes from './routes/debugRoutes';
import logger from './utils/logger';
const fs = require('fs');
const path = require('path');

// Initialize Express application
const app = express();

// Configure security and performance middleware
app.use(helmet()); // Add security headers
app.use(compression()); // Enable gzip compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Configure CORS for cross-origin requests
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without origin header (mobile apps, curl)
      if (!origin) return callback(null, true);

      // Validate origin against allowed list
      if (
        config.cors.allowedOrigins.indexOf(origin) !== -1 ||
        config.cors.allowedOrigins.indexOf('*') !== -1
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: config.cors.allowedMethods,
    allowedHeaders: config.cors.allowedHeaders,
    credentials: true,
    optionsSuccessStatus: 200, // Support legacy browsers
    maxAge: 86400, // Cache preflight for 24 hours
  })
);

// Initialize DynamoDB client with region configuration
const dynamoDBClient = new DynamoDBClient({
  region: config.aws.region,
  ...(config.dynamodb.localEndpoint
    ? { endpoint: config.dynamodb.localEndpoint }
    : {}),
});

const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

// Attach AWS clients to app context for route access
app.locals.docClient = docClient;

// Enable debug middleware for development environments
if (config.server.nodeEnv === 'development' || config.logging.debugMode) {
  app.use(debugMiddleware);
  logger.debug('Debug middleware enabled');
}

// Configure request logging for monitoring
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent') || 'unknown',
    });
  });
  next();
});

// Health check endpoint for service monitoring
app.get('/health', (req, res) => {
  const healthData = {
    status: 'ok',
    version: '1.0.0',
    environment: config.server.nodeEnv,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(healthData);
});

// Mount API route handlers
app.use('/api/pets', petRoutes);

// Mount debug routes for development environments
if (config.logging.debugMode) {
  app.use('/api/debug', debugRoutes);
  logger.debug('Debug routes enabled');
}

// Handle 404 errors for undefined routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

// Configure global error handling (must be last middleware)
app.use(errorHandler);

export default app;
