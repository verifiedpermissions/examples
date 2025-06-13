import React from 'react';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

const ConnectionStatusIndicator: React.FC = () => {
  const { status, latency } = useConnectionStatus();

  // Define styles based on connection status
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'green';
      case 'offline':
        return 'red';
      case 'slow':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Connected';
      case 'offline':
        return 'Offline - Check your connection';
      case 'slow':
        return 'Slow connection';
      default:
        return 'Checking connection...';
    }
  };

  const indicatorStyle = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.8rem',
    color: getStatusColor(),
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#f5f5f5',
    marginLeft: 'auto',
  };

  const dotStyle = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: getStatusColor(),
    marginRight: '6px',
  };

  return (
    <div style={indicatorStyle}>
      <div style={dotStyle} />
      <span>{getStatusText()}</span>
      {latency && status !== 'offline' && (
        <span style={{ marginLeft: '6px', fontSize: '0.7rem' }}>
          ({latency}ms)
        </span>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;
