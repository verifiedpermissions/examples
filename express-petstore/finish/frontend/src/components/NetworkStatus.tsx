import React, { useState, useEffect } from 'react';
import Alert from '@cloudscape-design/components/alert';

const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <Alert type="warning">
      Network connection lost. You are currently offline. Some features may not be available.
    </Alert>
  );
};

export default NetworkStatus;
