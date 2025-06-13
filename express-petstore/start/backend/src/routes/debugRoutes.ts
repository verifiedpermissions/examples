import express from 'express';
import { config } from '../config';
// import logger from '../utils/logger';

const router = express.Router();

/**
 * GET /debug/config - Get application configuration
 * Only available in development mode
 */
router.get('/config', (req, res) => {
  // Only allow in development mode
  if (config.server.nodeEnv !== 'development') {
    return res.status(404).json({
      status: 'error',
      message: 'Not found',
    });
  }

  // Return sanitized configuration
  const sanitizedConfig = {
    server: {
      port: config.server.port,
      nodeEnv: config.server.nodeEnv,
    },
    aws: {
      region: config.aws.region,
    },
    dynamodb: {
      petsTable: config.dynamodb.petsTable,
      localEndpoint: config.dynamodb.localEndpoint,
    },
    cors: {
      allowedOrigins: config.cors.allowedOrigins,
      allowedMethods: config.cors.allowedMethods,
      allowedHeaders: config.cors.allowedHeaders,
    },
    logging: {
      debugMode: config.logging.debugMode,
      logLevel: config.logging.logLevel,
    },
  };

  res.status(200).json({
    status: 'success',
    data: { config: sanitizedConfig },
  });
});

/**
 * GET /debug/user - Get current user information
 * Only available in development mode
 */
router.get('/user', (req, res) => {
  // Only allow in development mode
  if (config.server.nodeEnv !== 'development') {
    return res.status(404).json({
      status: 'error',
      message: 'Not found',
    });
  }

  res.status(200).json({
    status: 'success',
    data: { user: null },
  });
});

export default router;

export default router;
