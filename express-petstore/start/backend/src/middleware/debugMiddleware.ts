import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { maskAuthHeaders } from '../utils/tokenMasker';

/**
 * Debug middleware
 * Logs request details for debugging
 */
export const debugMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log request details
  logger.debug(`Request: ${req.method} ${req.originalUrl}`);

  // Log request headers with masked auth tokens
  logger.debug('Headers:', maskAuthHeaders(req.headers));

  // Log request body if present
  if (req.body && Object.keys(req.body).length > 0) {
    logger.debug('Body:', req.body);
  }

  // Log request query parameters if present
  if (req.query && Object.keys(req.query).length > 0) {
    logger.debug('Query:', req.query);
  }

  // Log request parameters if present
  if (req.params && Object.keys(req.params).length > 0) {
    logger.debug('Params:', req.params);
  }

  next();
};
