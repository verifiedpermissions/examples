import { Request, Response, NextFunction } from 'express';

/**
 * Pet entity type
 */
export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  ownerId: string;
  ownerName?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  timestamp: string;
}

/**
 * Error response
 */
export interface ErrorResponse {
  status: 'error';
  message: string;
  details?: string | Record<string, unknown>;
  timestamp: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  version: string;
  environment: string;
  timestamp: string;
  services?: {
    [key: string]: string;
  };
}

/**
 * Express app locals interface
 */
export interface AppLocals {
  docClient: Record<string, unknown>;
}

// Extend Express Request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Application {
      locals: AppLocals;
    }
  }
}
