import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { config } from '../config';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Error:', err);

  // Default error
  let statusCode = 500;
  let message = 'Something went wrong';
  let errors: Record<string, string> | undefined = undefined;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }

  // In development, send the error stack
  const errorResponse: Record<string, unknown> = {
    status: 'error',
    message,
  };

  if (errors) {
    errorResponse.errors = errors;
  }

  if (config.server.nodeEnv === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};
