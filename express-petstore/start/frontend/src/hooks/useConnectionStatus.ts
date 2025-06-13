import { useEffect, useState } from 'react';

type ConnectionStatus = 'online' | 'offline' | 'slow';

/**
 * Hook to monitor network connection status
 *
 * @returns Connection status object
 */
export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>(
    navigator.onLine ? 'online' : 'offline'
  );
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    // Event handlers for online/offline status
    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection latency periodically
    const checkLatency = async () => {
      if (!navigator.onLine) return;

      try {
        const start = Date.now();
        // Make a small request to the API endpoint
        const response = await fetch('/health', {
          method: 'HEAD',
          cache: 'no-store'
        });

        if (response.ok) {
          const currentLatency = Date.now() - start;
          setLatency(currentLatency);

          // If latency is greater than 1000ms, consider the connection slow
          if (currentLatency > 1000) {
            setStatus('slow');
          } else if (status === 'slow') {
            setStatus('online');
          }
        }
      } catch (error) {
        console.error('Failed to check latency:', error);
      }
    };

    // Check latency right away and then every 30 seconds
    checkLatency();
    const latencyInterval = setInterval(checkLatency, 30000);

    // Clean up event listeners and interval
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(latencyInterval);
    };
  }, [status]);

  return { status, latency };
};
