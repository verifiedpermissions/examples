import React, { useState } from 'react';
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

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setIsLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: unknown) {
      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Login error:', err);
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
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
            <Button variant="link" onClick={() => navigate('/signup')}>
              Create account
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={isLoading}>
              Sign in
            </Button>
          </SpaceBetween>
        }
        header={<Header variant="h1">Sign in</Header>}
      >
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container>
          <SpaceBetween direction="vertical" size="l">
            <FormField label="Email" constraintText="Required">
              <Input
                type="email"
                value={email}
                onChange={({ detail }) => setEmail(detail.value)}
              />
            </FormField>

            <FormField label="Password" constraintText="Required">
              <Input
                type="password"
                value={password}
                onChange={({ detail }) => setPassword(detail.value)}
              />
            </FormField>
          </SpaceBetween>
        </Container>
      </Form>
    </form>
  );
};

export default LoginPage;
