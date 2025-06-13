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

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    // Validate form
    if (!email || !password || !firstName || !lastName) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Include the required name attributes with correct Cognito attribute names (snake_case)
      await signUp(email, password, {
        given_name: firstName,
        family_name: lastName
      });

      // Store email in sessionStorage instead of using navigate state
      sessionStorage.setItem('signupEmail', email);
      navigate('/confirm-signup');
    } catch (err: unknown) {
      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Signup error:', err);
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
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
              Sign in to existing account
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={isLoading}>
              Create account
            </Button>
          </SpaceBetween>
        }
        header={<Header variant="h1">Create account</Header>}
      >
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container
          header={
            <Header variant="h2">
              Account information
            </Header>
          }
        >
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

            <FormField label="Confirm password" constraintText="Required">
              <Input
                type="password"
                value={confirmPassword}
                onChange={({ detail }) => setConfirmPassword(detail.value)}
              />
            </FormField>
          </SpaceBetween>
        </Container>

        <Container
          header={
            <Header variant="h2">
              Personal information
            </Header>
          }
        >
          <SpaceBetween direction="vertical" size="l">
            <FormField label="First name" constraintText="Required">
              <Input
                value={firstName}
                onChange={({ detail }) => setFirstName(detail.value)}
              />
            </FormField>

            <FormField label="Last name" constraintText="Required">
              <Input
                value={lastName}
                onChange={({ detail }) => setLastName(detail.value)}
              />
            </FormField>
          </SpaceBetween>
        </Container>
      </Form>
    </form>
  );
};

export default SignupPage;
