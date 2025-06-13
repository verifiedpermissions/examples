import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ConfigProvider } from './context/ConfigContext';
import { ApiProvider } from './context/ApiContext';
import { Amplify } from 'aws-amplify';
import './index.css';

// Configure Amplify with basic settings
// The full configuration will be loaded from the ConfigProvider
Amplify.configure({
  Auth: {
    region: 'us-east-1',
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ConfigProvider>
      <ApiProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ApiProvider>
    </ConfigProvider>
  </React.StrictMode>
);
