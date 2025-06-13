import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Box from '@cloudscape-design/components/box';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import { useAuth } from '../context/AuthContext';

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!user) {
    return (
      <Container>
        <Header variant="h1">Profile</Header>
        <Box>You are not signed in.</Box>
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={() => navigate('/login')}>Sign in</Button>
          <Button variant="primary" onClick={() => navigate('/signup')}>Sign up</Button>
        </SpaceBetween>
      </Container>
    );
  }

  return (
    <Container>
      <Header variant="h1">Your Profile</Header>
      <ColumnLayout columns={1} variant="text-grid">
        <SpaceBetween size="l">
          <div>
            <Box variant="awsui-key-label">Email</Box>
            <Box variant="p">{user.email}</Box>
          </div>
          
          {user.groups && user.groups.length > 0 && (
            <div>
              <Box variant="awsui-key-label">Groups</Box>
              <Box variant="p">{user.groups.join(', ')}</Box>
            </div>
          )}
          
          <div>
            <Box variant="awsui-key-label">User ID</Box>
            <Box variant="p">{user.sub}</Box>
          </div>
          
          <SpaceBetween direction="horizontal" size="xs">
            <Button 
              variant="primary" 
              onClick={handleSignOut} 
              loading={isSigningOut}
            >
              Sign out
            </Button>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </SpaceBetween>
        </SpaceBetween>
      </ColumnLayout>
    </Container>
  );
};

export default ProfilePage;
