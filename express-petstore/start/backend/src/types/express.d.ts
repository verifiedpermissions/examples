declare namespace Express {
  export interface Request {
    user?: {
      sub: string;
      email: string;
      groups: string[];
      token: string;
      tokenType: 'access' | 'id';
    };
    // Timestamp for request tracking and performance logging
    timestamp?: number;
    // Unique request identifier
    requestId?: string;
  }

  export interface Response {
    locals: {
      // Original URL for logging purposes
      originalUrl?: string;
    }
  }
}
