import React from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <SpaceBetween size="l">
        <Header variant="h1">Page not found</Header>
        
        <Alert type="warning">
          The page you are looking for does not exist or has been moved.
        </Alert>
        
        <Box variant="p">
          We couldn't find the page you were looking for. Please check the URL and try again,
          or use one of the links below to navigate to a different page.
        </Box>
        
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="primary" onClick={() => navigate('/')}>
            Go to home page
          </Button>
          <Button onClick={() => navigate('/pets')}>
            View pets
          </Button>
        </SpaceBetween>
      </SpaceBetween>
    </Container>
  );
};

export default NotFoundPage;
