import React, { useState, useEffect } from 'react';
import Form from '@cloudscape-design/components/form';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ConfirmSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { confirmSignUp } = useAuth();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get email from sessionStorage
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('signupEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleSubmit = async () => {
    setError(null);

    if (!email || !code) {
      setError('Please enter your email and verification code');
      return;
    }

    setIsLoading(true);

    try {
      await confirmSignUp(email, code);
      // Clear the stored email
      sessionStorage.removeItem('signupEmail');
      navigate('/login');
    } catch (err: unknown) {
      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Confirmation error:', err);
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm sign up';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => navigate('/login')}>
              Back to sign in
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={isLoading}>
              Confirm
            </Button>
          </SpaceBetween>
        }
        header={<Header variant="h1">Confirm sign up</Header>}
      >
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container
          header={
            <Header variant="h2">
              Verification
            </Header>
          }
        >
          <SpaceBetween direction="vertical" size="l">
            <Alert type="info">
              A verification code has been sent to your email address. Please enter the code below to complete your registration.
            </Alert>

            <FormField label="Email" constraintText="Required">
              <Input
                type="email"
                value={email}
                onChange={({ detail }) => setEmail(detail.value)}
                disabled={!!sessionStorage.getItem('signupEmail')}
              />
            </FormField>

            <FormField label="Verification code" constraintText="Required">
              <Input
                type="text"
                value={code}
                onChange={({ detail }) => setCode(detail.value)}
              />
            </FormField>
          </SpaceBetween>
        </Container>
      </Form>
    </form>
  );
};

export default ConfirmSignupPage;
