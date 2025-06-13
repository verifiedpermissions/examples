import React, { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import AppLayout from '@cloudscape-design/components/app-layout';
import Container from '@cloudscape-design/components/container';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import HelpPanel from '@cloudscape-design/components/help-panel';
import Flashbar from '@cloudscape-design/components/flashbar';
import TopNavigation from '@cloudscape-design/components/top-navigation';
// Removed unused import
import { ButtonDropdownProps } from '@cloudscape-design/components/button-dropdown';
import { I18nProvider } from '@cloudscape-design/components/i18n';
import messages from '@cloudscape-design/components/i18n/messages/all.en';
import { Amplify } from 'aws-amplify';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useConfig } from './context/ConfigContext';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Link from '@cloudscape-design/components/link';

// Pages
import HomePage from './pages/HomePage';
import PetsPage from './pages/PetsPage';
import PetDetailPage from './pages/PetDetailPage';
import CreatePetPage from './pages/CreatePetPage';
import EditPetPage from './pages/EditPetPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ConfirmSignupPage from './pages/ConfirmSignupPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Container>Loading...</Container>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Main App content component
const AppContent: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { config, isLoaded } = useConfig();
  const location = useLocation();
  const navigate = useNavigate();

  // Configure Amplify with the loaded configuration
  useEffect(() => {
    if (config) {
      Amplify.configure({
        Auth: {
          region: config.region,
          userPoolId: config.userPoolId,
          userPoolWebClientId: config.userPoolWebClientId,
        },
      });
    }
  }, [config]);

  // State for app layout components
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);

  // Determine content type based on current route
  const getContentType = () => {
    if (
      location.pathname.includes('/pets/new') ||
      location.pathname.includes('/edit')
    ) {
      return 'form';
    } else if (location.pathname === '/pets') {
      return 'table';
    } else {
      return 'default';
    }
  };

  // Generate breadcrumbs based on current route
  const getBreadcrumbItems = () => {
    const items = [{ text: 'PetStore', href: '/' }];

    if (location.pathname === '/pets') {
      items.push({ text: 'Pets', href: '#' });
    } else if (location.pathname.includes('/pets/new')) {
      items.push({ text: 'Pets', href: '/pets' });
      items.push({ text: 'Create pet', href: '#' });
    } else if (location.pathname.match(/\/pets\/[^/]+\/edit/)) {
      items.push({ text: 'Pets', href: '/pets' });
      items.push({ text: 'Edit pet', href: '#' });
    } else if (location.pathname.match(/\/pets\/[^/]+/)) {
      items.push({ text: 'Pets', href: '/pets' });
      items.push({ text: 'Pet details', href: '#' });
    } else if (location.pathname === '/profile') {
      items.push({ text: 'Profile', href: '#' });
    } else if (location.pathname === '/login') {
      items.push({ text: 'Sign in', href: '#' });
    } else if (location.pathname === '/signup') {
      items.push({ text: 'Create account', href: '#' });
    } else if (location.pathname === '/confirm-signup') {
      items.push({ text: 'Create account', href: '/signup' });
      items.push({ text: 'Confirm sign up', href: '#' });
    }

    return items;
  };

  // Generate navigation items based on authentication status
  const getNavigationItems = () => {
    const items = [{ type: 'link' as const, text: 'Home', href: '/' }];

    if (isAuthenticated) {
      items.push(
        { type: 'link' as const, text: 'Pets', href: '/pets' },
        { type: 'link' as const, text: 'Profile', href: '/profile' }
      );
    }

    return items;
  };

  // Handle help panel content based on current route
  const getHelpPanelContent = () => {
    if (location.pathname === '/pets') {
      return (
        <HelpPanel header={<Box variant="h2">Pets List</Box>}>
          <Box variant="p" padding={{ bottom: 'l' }}>
            This page displays all your pets. You can view, edit, or delete pets
            from this list.
          </Box>

          <Box variant="h3">Actions</Box>
          <SpaceBetween size="s">
            <div>
              <Box variant="strong">Add pet</Box>
              <Box variant="p">Create a new pet record</Box>
            </div>
            <div>
              <Box variant="strong">View</Box>
              <Box variant="p">See detailed information about a pet</Box>
            </div>
            <div>
              <Box variant="strong">Edit</Box>
              <Box variant="p">Modify a pet's information</Box>
            </div>
          </SpaceBetween>
        </HelpPanel>
      );
    } else if (location.pathname.includes('/pets/new')) {
      return (
        <HelpPanel header={<Box variant="h2">Create Pet</Box>}>
          <Box variant="p" padding={{ bottom: 'l' }}>
            Use this form to add a new pet to your collection.
          </Box>

          <Box variant="h3">Required Fields</Box>
          <SpaceBetween size="s">
            <div>
              <Box variant="strong">Name</Box>
              <Box variant="p">Your pet's name</Box>
            </div>
            <div>
              <Box variant="strong">Type</Box>
              <Box variant="p">The type of animal</Box>
            </div>
            <div>
              <Box variant="strong">Breed</Box>
              <Box variant="p">The breed of your pet</Box>
            </div>
            <div>
              <Box variant="strong">Age</Box>
              <Box variant="p">Your pet's age in years</Box>
            </div>
          </SpaceBetween>
        </HelpPanel>
      );
    } else if (location.pathname.includes('/edit')) {
      return (
        <HelpPanel header={<Box variant="h2">Edit Pet</Box>}>
          <Box variant="p" padding={{ bottom: 'l' }}>
            Use this form to update your pet's information.
          </Box>

          <Box variant="h3">Required Fields</Box>
          <SpaceBetween size="s">
            <div>
              <Box variant="strong">Name</Box>
              <Box variant="p">Your pet's name</Box>
            </div>
            <div>
              <Box variant="strong">Type</Box>
              <Box variant="p">The type of animal</Box>
            </div>
            <div>
              <Box variant="strong">Breed</Box>
              <Box variant="p">The breed of your pet</Box>
            </div>
            <div>
              <Box variant="strong">Age</Box>
              <Box variant="p">Your pet's age in years</Box>
            </div>
          </SpaceBetween>
        </HelpPanel>
      );
    } else {
      return (
        <HelpPanel header={<Box variant="h2">PetStore Help</Box>}>
          <Box variant="p" padding={{ bottom: 'l' }}>
            Welcome to the PetStore application. This app allows you to manage
            your pets.
          </Box>

          <Box variant="h3">Features</Box>
          <SpaceBetween size="m">
            <div>
              <Box variant="strong">Dashboard</Box>
              <Box variant="p">View summary information about your pets</Box>
            </div>
            <div>
              <Box variant="strong">Pets</Box>
              <Box variant="p">Manage your pet records</Box>
            </div>
            <div>
              <Box variant="strong">Profile</Box>
              <Box variant="p">View and update your profile information</Box>
            </div>
          </SpaceBetween>

          <Box variant="h3" padding={{ top: 'l', bottom: 's' }}>
            Getting Started
          </Box>
          <SpaceBetween size="s">
            <div>
              <Box variant="p">
                1. Navigate to the <strong>Pets</strong> section using the
                sidebar
              </Box>
            </div>
            <div>
              <Box variant="p">
                2. Click <strong>Add pet</strong> to create your first pet
                record
              </Box>
            </div>
            <div>
              <Box variant="p">
                3. Fill in the required information and save
              </Box>
            </div>
          </SpaceBetween>

          <Box variant="h3" padding={{ top: 'l', bottom: 's' }}>
            Need More Help?
          </Box>
          <Box variant="p">
            Check out our <Link href="#">documentation</Link> for more
            information.
          </Box>
        </HelpPanel>
      );
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get notifications based on application state
  const [notifications, setNotifications] = useState<
    Array<{
      type: 'success' | 'warning' | 'error' | 'info';
      content: string;
      dismissible: boolean;
      id: string;
    }>
  >([]);

  // Add welcome notification when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      setNotifications((prevNotifications) => {
        if (!prevNotifications.some((n) => n.id === 'welcome-message')) {
          return [
            ...prevNotifications,
            {
              type: 'success',
              content: `Welcome back, ${user.email}!`,
              dismissible: true,
              id: 'welcome-message',
            },
          ];
        }
        return prevNotifications;
      });
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
    }
  }, [isAuthenticated, user]);

  // Handle notification dismiss
  const handleDismissNotification = (id: string) => {
    setNotifications(
      notifications.filter((notification) => notification.id !== id)
    );
  };

  // Handle sign out
  const handleUserMenuSelect = (
    e: CustomEvent<ButtonDropdownProps.ItemClickDetails>
  ) => {
    if (e.detail.id === 'signout') {
      handleSignOut();
    } else if (e.detail.id === 'profile') {
      navigate('/profile');
    }
  };

  // Get user menu items
  const getUserMenuItems = () => {
    const items = [
      {
        id: 'profile',
        text: 'Profile',
      },
      {
        id: 'signout',
        text: 'Sign out',
      },
    ];

    return items;
  };

  return (
    <I18nProvider messages={[messages]} locale="en">
      <div id="h" style={{ position: 'sticky', top: 0, zIndex: 1002 }}>
        <TopNavigation
          identity={{
            href: '/',
            title: 'PetStore'
          }}
          utilities={[
            {
              type: 'menu-dropdown',
              text: isAuthenticated ? user?.email || 'User' : 'Account',
              description: isAuthenticated ? 'Your account' : 'Sign in',
              iconName: 'user-profile',
              onItemClick: handleUserMenuSelect,
              items: isAuthenticated
                ? getUserMenuItems()
                : [
                    {
                      id: 'signin',
                      text: 'Sign in',
                      href: '/login',
                    },
                    {
                      id: 'signup',
                      text: 'Create account',
                      href: '/signup',
                    },
                  ],
            },
            {
              type: 'button',
              text: 'Help',
              iconName: 'status-info',
              onClick: () => setToolsOpen(!toolsOpen),
            },
          ]}
          i18nStrings={{
            searchIconAriaLabel: 'Search',
            searchDismissIconAriaLabel: 'Close search',
            overflowMenuTriggerText: 'More',
            overflowMenuTitleText: 'All',
            overflowMenuBackIconAriaLabel: 'Back',
            overflowMenuDismissIconAriaLabel: 'Close menu',
          }}
        />
      </div>

      <AppLayout
        content={
          <div className="app-content">
            <BreadcrumbGroup
              items={getBreadcrumbItems()}
              ariaLabel="Breadcrumbs"
            />

            {notifications.length > 0 ? (
              <Flashbar
                items={notifications.map((notification) => ({
                  ...notification,
                  onDismiss: () => handleDismissNotification(notification.id),
                }))}
              />
            ) : null}

            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/pets"
                element={
                  <ProtectedRoute>
                    <PetsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pets/new"
                element={
                  <ProtectedRoute>
                    <CreatePetPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pets/:id"
                element={
                  <ProtectedRoute>
                    <PetDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pets/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditPetPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/confirm-signup" element={<ConfirmSignupPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        }
        navigation={
          <SideNavigation
            header={{ text: 'Navigation', href: '/' }}
            items={getNavigationItems()}
            activeHref={location.pathname}
            onFollow={(e) => {
              e.preventDefault();
              navigate(e.detail.href);
            }}
          />
        }
        navigationOpen={navigationOpen}
        onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
        tools={getHelpPanelContent()}
        toolsOpen={toolsOpen}
        onToolsChange={({ detail }) => setToolsOpen(detail.open)}
        contentType={getContentType()}
        headerSelector="#h"
        ariaLabels={{
          navigation: 'Side navigation',
          navigationClose: 'Close side navigation',
          navigationToggle: 'Open side navigation',
          notifications: 'Notifications',
          tools: 'Help panel',
          toolsClose: 'Close help panel',
          toolsToggle: 'Open help panel',
        }}
      />
    </I18nProvider>
  );
};

const App: React.FC = () => {
  const { isLoaded, error } = useConfig();

  if (error) {
    return (
      <Container>
        <div style={{ padding: '20px' }}>
          <h1>Configuration Error</h1>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </Container>
    );
  }

  if (!isLoaded) {
    return (
      <Container>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          Loading application...
        </div>
      </Container>
    );
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
