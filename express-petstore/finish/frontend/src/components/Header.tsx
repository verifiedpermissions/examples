import React from 'react';
import Header from '@cloudscape-design/components/header';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HeaderComponent: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Header variant="h1">PetStore</Header>
      
      {isAuthenticated ? (
        <Button onClick={handleSignOut}>Sign out</Button>
      ) : (
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={() => navigate('/login')}>Sign in</Button>
          <Button variant="primary" onClick={() => navigate('/signup')}>Sign up</Button>
        </SpaceBetween>
      )}
    </div>
  );
};

export default HeaderComponent;
