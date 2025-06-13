import { useState, useCallback } from 'react';
import { ApiError } from '../utils/api';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

interface UseApiResult<T> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T>(
  apiFunction: (...args: unknown[]) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await apiFunction(...args);

        setData(result);

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);

        if (options.onError) {
          options.onError(apiError);
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction, options]
  );

  return { data, error, isLoading, execute, reset };
}

// For handling paginated data from API
export function usePaginatedApi<T>(
  apiFunction: (...args: unknown[]) => Promise<T[]>,
  options: UseApiOptions<T[]> = {}
): UseApiResult<T[]> & { loadMore: (...args: unknown[]) => Promise<void> } {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T[] | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await apiFunction(...args);

        setData(result);

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);

        if (options.onError) {
          options.onError(apiError);
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction, options]
  );

  const loadMore = useCallback(
    async (...args: unknown[]): Promise<void> => {
      if (isLoadingMore || !data) return;

      try {
        setIsLoadingMore(true);

        const moreData = await apiFunction(...args);

        setData(prevData => prevData ? [...prevData, ...moreData] : moreData);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);

        if (options.onError) {
          options.onError(apiError);
        }
      } finally {
        setIsLoadingMore(false);
      }
    },
    [apiFunction, data, isLoadingMore, options]
  );

  return { data, error, isLoading, execute, reset, loadMore };
}
