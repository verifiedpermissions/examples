import { Request, Response, NextFunction } from 'express';
import logger from './logger';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  errors?: Record<string, string>;

  constructor(message: string, statusCode: number, errors?: Record<string, string>) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Bad request error
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', errors?: Record<string, string>) {
    super(message, 400, errors);
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * Catch async errors
 * @param fn Function to catch errors from
 */
export const catchAsync = (fn: (req: Request, res: Response, _next: NextFunction) => Promise<Response | void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

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

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};
