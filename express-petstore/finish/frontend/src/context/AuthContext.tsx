import React, { createContext, useContext, useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';

interface User {
  email: string;
  sub: string;
  groups?: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, additionalAttributes?: Record<string, string>) => Promise<any>;
  confirmSignUp: (email: string, code: string) => Promise<any>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setIsAuthenticated(true);
      
      // Extract user information
      const { attributes, signInUserSession } = currentUser;
      const groups = signInUserSession?.idToken?.payload['cognito:groups'] || [];
      
      setUser({
        email: attributes.email,
        sub: attributes.sub,
        groups,
      });
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const user = await Auth.signIn(email, password);
      await checkAuthState();
      return user;
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, additionalAttributes: Record<string, string> = {}) => {
    try {
      // Prepare attributes object
      const attributes = {
        email,
        ...additionalAttributes
      };
      
      const result = await Auth.signUp({
        username: email,
        password,
        attributes,
      });
      return result;
    } catch (error) {
      throw error;
    }
  };

  const confirmSignUp = async (email: string, code: string) => {
    try {
      return await Auth.confirmSignUp(email, code);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await Auth.signOut();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    try {
      const session = await Auth.currentSession();
      return session.getIdToken().getJwtToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    signIn,
    signUp,
    confirmSignUp,
    signOut,
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
