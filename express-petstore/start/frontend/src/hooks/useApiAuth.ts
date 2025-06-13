import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

/**
 * Hook to manage API authentication tokens
 *
 * This hook provides token-related utilities for API calls:
 * - getAuthHeader: Returns the current Authorization header value
 * - refreshToken: Tries to refresh the token if it's expired
 * - isTokenExpired: Checks if the current token is expired
 * - tokenExpiresIn: Returns seconds until token expiration
 */
export const useApiAuth = () => {
  const { getIdToken, isAuthenticated } = useAuth();
  const [authHeader, setAuthHeader] = useState<string | null>(null);

  // Refresh the auth header whenever authentication state changes
  useEffect(() => {
    const refreshAuthHeader = async () => {
      if (isAuthenticated) {
        try {
          const token = await getIdToken();
          if (token) {
            setAuthHeader(`Bearer ${token}`);
          } else {
            setAuthHeader(null);
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
          setAuthHeader(null);
        }
      } else {
        setAuthHeader(null);
      }
    };

    refreshAuthHeader();
  }, [isAuthenticated, getIdToken]);

  /**
   * Get current auth header for API requests
   * @returns Authorization header string or null if not authenticated
   */
  const getAuthHeader = async (): Promise<string | null> => {
    // If we already have a valid token, return it
    if (authHeader && !isTokenExpired(authHeader)) {
      return authHeader;
    }

    // Otherwise get a fresh token
    try {
      const token = await getIdToken();
      if (token) {
        // Use the raw token without 'Bearer ' prefix to match backend expectations
        const newHeader = token;
        setAuthHeader(newHeader);
        return newHeader;
      }
    } catch (error) {
      console.error('Error refreshing auth token:', error);
    }

    return null;
  };

  /**
   * Check if a token is expired
   * @param authHeader Authorization header containing the token
   * @returns true if the token is expired or invalid
   */
  const isTokenExpired = (authHeader: string): boolean => {
    try {
      // Extract token from header
      const token = authHeader.split(' ')[1];
      if (!token) return true;

      // Decode the token (JWT) to get expiration
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Check expiration (exp is in seconds)
      const now = Math.floor(Date.now() / 1000);
      return payload.exp <= now;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired if we can't check
    }
  };

  /**
   * Get seconds until token expiration
   * @returns Number of seconds until token expires, or null if no valid token
   */
  const tokenExpiresIn = (): number | null => {
    if (!authHeader) return null;

    try {
      // Extract token from header
      const token = authHeader.split(' ')[1];
      if (!token) return null;

      // Decode the token (JWT) to get expiration
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Calculate time remaining
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now ? payload.exp - now : null;
    } catch (error) {
      console.error('Error calculating token expiration:', error);
      return null;
    }
  };

  /**
   * Explicitly refresh the auth token
   */
  const refreshToken = async (): Promise<boolean> => {
    try {
      const token = await getIdToken();
      if (token) {
        setAuthHeader(token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  return {
    getAuthHeader,
    refreshToken,
    isTokenExpired: authHeader ? isTokenExpired(authHeader) : true,
    tokenExpiresIn: tokenExpiresIn(),
  };
};
