import React, { useEffect, useState } from 'react';
import Board from '@cloudscape-design/board-components/board';
import BoardItem from '@cloudscape-design/board-components/board-item';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import BarChart from '@cloudscape-design/components/bar-chart';
import PieChart from '@cloudscape-design/components/pie-chart';
import Table from '@cloudscape-design/components/table';
import Grid from '@cloudscape-design/components/grid';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Link from '@cloudscape-design/components/link';
import Icon from '@cloudscape-design/components/icon';
import Alert from '@cloudscape-design/components/alert';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../context/ApiContext';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  age: number;
  description?: string;
}

interface DashboardItemData {
  title: string;
  type: string;
}

interface BoardItemType {
  id: string;
  rowSpan: number;
  columnSpan: number;
  data: DashboardItemData;
}

interface PieChartDatum {
  title: string;
  value: number;
}

interface BarChartDatum {
  x: string;
  y: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const api = useApi(); // Move the hook call to the top level
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard items state
  const [dashboardItems, setDashboardItems] = useState<BoardItemType[]>(() => {
    // Try to load saved dashboard layout from localStorage
    try {
      const savedLayout = localStorage.getItem('petstore-dashboard-layout');
      if (savedLayout) {
        try {
          return JSON.parse(savedLayout);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Failed to parse saved dashboard layout', e);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to access localStorage', e);
    }

    // Default dashboard layout
    return [
      {
        id: 'welcome',
        rowSpan: 1,
        columnSpan: 4,
        data: { title: 'Welcome', type: 'welcome' }
      },
      {
        id: 'pet-types',
        rowSpan: 2,
        columnSpan: 2,
        data: { title: 'Pet Types', type: 'pie-chart' }
      },
      {
        id: 'pet-ages',
        rowSpan: 2,
        columnSpan: 2,
        data: { title: 'Pet Ages', type: 'bar-chart' }
      },
      {
        id: 'recent-pets',
        rowSpan: 2,
        columnSpan: 4,
        data: { title: 'Recent Pets', type: 'table' }
      }
    ];
  });

  // Fetch pets data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPets();
    } else {
      setLoading(false);
      // Ensure pets is empty array when not authenticated
      setPets([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchPets = async () => {
    setError(null);
    try {
      setLoading(true);
      // Use the API context that was initialized at the top level
      const response = await api.get('pets');

      // Process the response to handle different API response formats
      let petsData: unknown[] = [];

      // Handle the specific API response format: { status: "success", data: { pets: [...] } }
      if (response?.data?.pets && Array.isArray(response.data.pets)) {
        petsData = response.data.pets;
      } else if (Array.isArray(response)) {
        petsData = response;
      } else if (response && typeof response === 'object') {
        // If response is an object that might contain pets array
        if (response?.data?.pets && Array.isArray(response.data.pets)) {
          petsData = response.data.pets;
        } else if (response.pets && Array.isArray(response.pets)) {
          petsData = response.pets;
        } else if (response.items && Array.isArray(response.items)) {
          petsData = response.items;
        } else if (response.data && Array.isArray(response.data)) {
          petsData = response.data;
        } else {
          // Last resort: try to extract all valid pet objects from response
          petsData = Object.values(response).filter(item =>
            item && typeof item === 'object' && 'id' in item
          );
        }
      }

      // Normalize the pet data to ensure all required fields exist
      const normalizedPets = petsData.map((pet: unknown) => {
        const petObj = pet as Record<string, unknown>;
        return {
        id: String(petObj?.id || `temp-${Math.random().toString(36).substring(2, 9)}`),
        name: String(petObj?.name || 'Unknown'),
        type: String(petObj?.species || petObj?.type || 'Unknown'),
        breed: String(petObj?.breed || 'Unknown'),
        age: typeof petObj?.age === 'number' ? petObj.age : 0
      };
      });

      setPets(normalizedPets);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching pets:', error);
      setPets([]);
      setError('Failed to load pets. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Save dashboard layout when it changes
  useEffect(() => {
    try {
      localStorage.setItem('petstore-dashboard-layout', JSON.stringify(dashboardItems));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to save dashboard layout to localStorage', e);
    }
  }, [dashboardItems]);

  // Prepare data for charts
  const petTypeData = React.useMemo<PieChartDatum[]>(() => {
    if (!pets || !Array.isArray(pets) || !pets.length) return [];

    const typeCounts: Record<string, number> = pets.reduce((acc: Record<string, number>, pet) => {
      const petType = pet?.type || 'Unknown';
      // Capitalize the first letter for consistency
      const normalizedType = petType.charAt(0).toUpperCase() + petType.slice(1).toLowerCase();
      acc[normalizedType] = (acc[normalizedType] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(typeCounts).map(([type, count]) => ({
      title: type,
      value: count
    }));
  }, [pets]);

  const petAgeData = React.useMemo<BarChartDatum[]>(() => {
    if (!pets || !Array.isArray(pets) || !pets.length) return [];

    // Group pets by age ranges
    const ageRanges: Record<string, number> = {
      '0-1': 0,
      '2-5': 0,
      '6-10': 0,
      '11+': 0
    };

    pets.forEach(pet => {
      const age = typeof pet?.age === 'number' ? pet.age : 0;

      if (age <= 1) ageRanges['0-1']++;
      else if (age <= 5) ageRanges['2-5']++;
      else if (age <= 10) ageRanges['6-10']++;
      else ageRanges['11+']++;
    });

    return Object.entries(ageRanges).map(([range, count]) => ({
      x: range,
      y: count
    }));
  }, [pets]);

  // Function to handle safe navigation
  const handleNavigation = (path: string) => {
    try {
      navigate(path);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to navigate:", path, err);
    }
  };

  // Render different content based on item type
  const renderItemContent = (item: BoardItemType) => {
    if (!item || !item.data || !item.data.type) {
      return <Box>Invalid widget configuration</Box>;
    }

    switch (item.data.type) {
      case 'welcome':
        return (
          <SpaceBetween size="l">
            <Box variant="p">
              {isAuthenticated
                ? `Welcome back, ${user?.email || 'User'}! This is your personalized PetStore dashboard.`
                : 'Welcome to PetStore! Sign in to manage your pets and see your personalized dashboard.'}
            </Box>

            {!isAuthenticated && (
              <SpaceBetween size="m" direction="horizontal">
                <Button variant="primary" onClick={() => handleNavigation('/login')}>
                  Sign In
                </Button>
                <Button onClick={() => handleNavigation('/signup')}>
                  Sign Up
                </Button>
              </SpaceBetween>
            )}
          </SpaceBetween>
        );

      case 'pie-chart':
        return (
          <PieChart
            data={petTypeData}
            detailPopoverContent={(datum) => [
              { key: 'Type', value: datum.title },
              { key: 'Count', value: datum.value }
            ]}
            i18nStrings={{
              filterLabel: 'Filter',
              filterPlaceholder: 'Filter pet types',
              filterSelectedAriaLabel: 'selected',
              detailPopoverDismissAriaLabel: 'Dismiss',
              legendAriaLabel: 'Legend',
              chartAriaRoleDescription: 'Pie chart'
            }}
            empty={
              <Box textAlign="center" color="inherit">
                <b>No data available</b>
                <Box variant="p" color="inherit">
                  {isAuthenticated
                    ? 'Add some pets to see data here.'
                    : 'Sign in to see your pet data.'}
                </Box>
              </Box>
            }
            hideFilter
            hideLegend
            fitHeight
          />
        );

      case 'bar-chart':
        return (
          <BarChart
            series={[{ title: 'Pets by age', type: 'bar', data: petAgeData }]}
            i18nStrings={{
              filterLabel: 'Filter',
              filterPlaceholder: 'Filter pet ages',
              filterSelectedAriaLabel: 'selected',
              legendAriaLabel: 'Legend',
              chartAriaRoleDescription: 'Bar chart',
              xAxisAriaRoleDescription: 'Age range',
              yAxisAriaRoleDescription: 'Count'
            }}
            ariaLabel="Pet ages bar chart"
            empty={
              <Box textAlign="center" color="inherit">
                <b>No data available</b>
                <Box variant="p" color="inherit">
                  {isAuthenticated
                    ? 'Add some pets to see data here.'
                    : 'Sign in to see your pet data.'}
                </Box>
              </Box>
            }
            hideFilter
            hideLegend
            fitHeight
          />
        );

      case 'table':
        const safeItems = Array.isArray(pets) ? pets.slice(0, 5) : [];
        return (
          <Table
            columnDefinitions={[
              {
                id: 'name',
                header: 'Name',
                cell: item => item.name || 'Unknown',
                sortingField: 'name'
              },
              {
                id: 'type',
                header: 'Type',
                cell: item => item.type || 'Unknown'
              },
              {
                id: 'breed',
                header: 'Breed',
                cell: item => item.breed || 'Unknown'
              },
              {
                id: 'age',
                header: 'Age',
                cell: item => `${item.age !== undefined ? item.age : 'Unknown'} ${item.age === 1 ? 'year' : 'years'}`
              }
            ]}
            items={safeItems}
            loading={loading}
            loadingText="Loading pets"
            empty={
              <Box textAlign="center" color="inherit">
                <b>No pets</b>
                <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                  {isAuthenticated
                    ? 'No pets to display. Add a pet to get started.'
                    : 'Sign in to see your pet data.'}
                </Box>
                {isAuthenticated && (
                  <Button onClick={() => handleNavigation('/pets/new')}>Add pet</Button>
                )}
              </Box>
            }
            header={
              <Header
                counter={`(${Array.isArray(pets) ? Math.min(pets.length, 5) : 0}${Array.isArray(pets) && pets.length > 5 ? '+' : ''})`}
                actions={
                  <Button onClick={() => handleNavigation('/pets')}>View all</Button>
                }
              >
                Recent Pets
              </Header>
            }
          />
        );

      default:
        return <Box>Unknown widget type</Box>;
    }
  };

  return (
    <Box margin={{ bottom: 'l' }}>
      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          dismissible
          onDismiss={() => setError(null)}
          header="Error loading data"
        >
          {error}
        </Alert>
      )}

      {/* Header Section with Blue Background */}
      <div style={{
        background: '#232f3e',
        padding: '40px 0',
        color: '#ffffff'
      }}>
        <Box padding={{ vertical: 'xxxl', horizontal: 's' }}>
          <Grid
            gridDefinition={[
              {
                offset: { l: 2, xxs: 1 },
                colspan: { l: 8, xxs: 10 },
              },
              {
                colspan: { xl: 6, l: 5, s: 6, xxs: 10 },
                offset: { l: 2, xxs: 1 },
              },
              {
                colspan: { xl: 2, l: 3, s: 4, xxs: 10 },
                offset: { s: 0, xxs: 1 },
              },
            ]}
          >
            <Box fontWeight="light" padding={{ top: 'xs' }} color="inherit">
              <span style={{ color: '#d5dbdb' }}>
                Pet Management System
              </span>
            </Box>
            <div style={{ color: '#ffffff' }}>
              <Box
                variant="h1"
                fontWeight="heavy"
                padding="n"
                fontSize="display-l"
                color="inherit"
              >
                Pet Store Dashboard
              </Box>
              <Box
                fontWeight="light"
                padding={{ bottom: 's' }}
                fontSize="display-l"
                color="inherit"
              >
                Manage Your Pets with Ease
              </Box>
              <Box variant="p" fontWeight="light" color="inherit">
                <span style={{ color: '#d5dbdb' }}>
                  Welcome to the Pet Store Dashboard. This application allows you to manage your pets,
                  track their information, and ensure they receive the care they need. Built with AWS
                  Cognito for authentication and Amazon Verified Permissions for fine-grained access control.
                </span>
              </Box>
            </div>
            <div style={{ marginBottom: '38px' }}>
              <Container>
                <SpaceBetween size="xl">
                  <Box variant="h2" padding="n">
                    Manage Your Pets
                  </Box>
                  <Box variant="p" padding="n">
                    Get started by adding a new pet or viewing your existing pets.
                  </Box>
                  <Button
                    onClick={() => handleNavigation('/pets/new')}
                    variant="primary"
                  >
                    Add New Pet
                  </Button>
                </SpaceBetween>
              </Container>
            </div>
          </Grid>
        </Box>
      </div>

      {/* Main Content Section */}
      <Box padding={{ top: 'xxxl', horizontal: 's' }}>
        <Grid
          gridDefinition={[
            {
              colspan: { xl: 6, l: 5, s: 6, xxs: 10 },
              offset: { l: 2, xxs: 1 },
            },
            {
              colspan: { xl: 2, l: 3, s: 4, xxs: 10 },
              offset: { s: 0, xxs: 1 },
            },
          ]}
        >
          <SpaceBetween size="xxl">
            <div>
              <Box
                variant="h1"
                tagOverride="h2"
                padding={{ bottom: 's', top: 'n' }}
              >
                Your Dashboard
              </Box>
              <Container>
                <Board<DashboardItemData>
                  renderItem={(item) => {
                    if (!item) {
                      return <BoardItem
                        header={<Header variant="h2">Empty</Header>}
                        i18nStrings={{
                          dragHandleAriaLabel: "Drag handle",
                          dragHandleAriaDescription:
                            "Use Space or Enter to activate drag, arrow keys to move, Space or Enter to submit, or Escape to discard.",
                          resizeHandleAriaLabel: "Resize handle",
                          resizeHandleAriaDescription:
                            "Use Space or Enter to activate resize, arrow keys to move, Space or Enter to submit, or Escape to discard."
                        }}
                      >
                        <Box>No data available</Box>
                      </BoardItem>;
                    }
                    return (
                      <BoardItem
                        header={<Header variant="h2">{item.data?.title || 'Widget'}</Header>}
                        i18nStrings={{
                          dragHandleAriaLabel: "Drag handle",
                          dragHandleAriaDescription:
                            "Use Space or Enter to activate drag, arrow keys to move, Space or Enter to submit, or Escape to discard.",
                          resizeHandleAriaLabel: "Resize handle",
                          resizeHandleAriaDescription:
                            "Use Space or Enter to activate resize, arrow keys to move, Space or Enter to submit, or Escape to discard."
                        }}
                      >
                        {renderItemContent(item as BoardItemType)}
                      </BoardItem>
                    );
                  }}
                  onItemsChange={event => {
                    if (event?.detail?.items) {
                      setDashboardItems(event.detail.items as BoardItemType[]);
                    }
                  }}
                  items={dashboardItems}
                  i18nStrings={{
                    liveAnnouncementDndStarted: operationType =>
                      operationType === "resize" ? "Resizing" : "Dragging",
                    liveAnnouncementDndItemReordered: operation => {
                      const columns = `column ${operation.placement.x + 1}`;
                      const rows = `row ${operation.placement.y + 1}`;
                      return `Item moved to ${operation.direction === "horizontal" ? columns : rows}.`;
                    },
                    liveAnnouncementDndItemResized: operation => {
                      const columnsConstraint = operation.isMinimalColumnsReached ? " (minimal)" : "";
                      const rowsConstraint = operation.isMinimalRowsReached ? " (minimal)" : "";
                      const sizeAnnouncement = operation.direction === "horizontal"
                        ? `columns ${operation.placement.width}${columnsConstraint}`
                        : `rows ${operation.placement.height}${rowsConstraint}`;
                      return `Item resized to ${sizeAnnouncement}.`;
                    },
                    liveAnnouncementDndItemInserted: operation => {
                      const columns = `column ${operation.placement.x + 1}`;
                      const rows = `row ${operation.placement.y + 1}`;
                      return `Item inserted to ${columns}, ${rows}.`;
                    },
                    liveAnnouncementDndCommitted: operationType => `${operationType} committed`,
                    liveAnnouncementDndDiscarded: operationType => `${operationType} discarded`,
                    liveAnnouncementItemRemoved: op => `Removed item ${op.item.data.title}.`,
                    navigationAriaLabel: "Dashboard navigation",
                    navigationAriaDescription: "Click on non-empty item to move focus over",
                    navigationItemAriaLabel: item => item ? item.data.title : "Empty"
                  }}
                  empty={
                    <Box textAlign="center" padding="xl">
                      <SpaceBetween size="l">
                        <Box variant="h3">No dashboard items</Box>
                        <Box variant="p">Add items to create your personalized dashboard.</Box>
                        <Button>Add item</Button>
                      </SpaceBetween>
                    </Box>
                  }
                />
              </Container>
            </div>

            <div>
              <Box
                variant="h1"
                tagOverride="h2"
                padding={{ bottom: 's', top: 'n' }}
              >
                Features and Benefits
              </Box>
              <Container>
                <ColumnLayout columns={2} variant="text-grid">
                  <div>
                    <Box variant="h3" padding={{ top: 'n' }}>
                      Secure Authentication
                    </Box>
                    <Box variant="p">
                      Our application uses AWS Cognito for secure user authentication,
                      ensuring that your pet data is protected and only accessible by you.
                    </Box>
                  </div>
                  <div>
                    <Box variant="h3" padding={{ top: 'n' }}>
                      Fine-grained Access Control
                    </Box>
                    <Box variant="p">
                      With Amazon Verified Permissions, we implement fine-grained access control
                      to ensure that users can only access and modify their own pets.
                    </Box>
                  </div>
                  <div>
                    <Box variant="h3" padding={{ top: 'n' }}>
                      Easy Pet Management
                    </Box>
                    <Box variant="p">
                      Add, update, and delete your pets with ease. Keep track of important
                      information like species, age, and health status.
                    </Box>
                  </div>
                  <div>
                    <Box variant="h3" padding={{ top: 'n' }}>
                      Responsive Design
                    </Box>
                    <Box variant="p">
                      Access your pet information from any device with our responsive
                      design that works on desktop, tablet, and mobile.
                    </Box>
                  </div>
                </ColumnLayout>
              </Container>
            </div>
          </SpaceBetween>

          {/* Sidebar */}
          <div style={{ marginTop: '-86px' }}>
            <SpaceBetween size="xxl">
              <Container
                header={
                  <Header variant="h2">
                    Quick Actions
                  </Header>
                }
              >
                <ul
                  aria-label="Quick action links"
                  style={{
                    listStyleType: 'none',
                    margin: 0,
                    padding: 0
                  }}
                >
                  <li style={{ borderTop: '1px solid #e9ebed', padding: '0.8rem 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', paddingTop: 0 }}>
                    <Link onFollow={() => handleNavigation('/pets/new')}>
                      Add New Pet
                    </Link>
                  </li>
                  <li style={{ borderTop: '1px solid #e9ebed', padding: '0.8rem 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <Link onFollow={() => handleNavigation('/pets')}>
                      View All Pets
                    </Link>
                  </li>
                  <li style={{ borderTop: '1px solid #e9ebed', padding: '0.8rem 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', paddingBottom: 0 }}>
                    <Link onFollow={() => handleNavigation('/login')}>
                      Manage Profile
                    </Link>
                  </li>
                </ul>
              </Container>

              <Container
                header={
                  <Header variant="h2">
                    Resources <Icon name="external" />
                  </Header>
                }
              >
                <ul
                  aria-label="Additional resource links"
                  style={{
                    listStyleType: 'none',
                    margin: 0,
                    padding: 0
                  }}
                >
                  <li style={{ borderTop: '1px solid #e9ebed', padding: '0.8rem 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', paddingTop: 0 }}>
                    <Link
                      external
                      externalIconAriaLabel="Opens in a new tab"
                      href="https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html"
                    >
                      AWS Cognito Documentation
                    </Link>
                  </li>
                  <li style={{ borderTop: '1px solid #e9ebed', padding: '0.8rem 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <Link
                      external
                      externalIconAriaLabel="Opens in a new tab"
                      href="https://docs.aws.amazon.com/verifiedpermissions/latest/userguide/what-is-avp.html"
                    >
                      Amazon Verified Permissions Guide
                    </Link>
                  </li>
                  <li style={{ borderTop: '1px solid #e9ebed', padding: '0.8rem 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', paddingBottom: 0 }}>
                    <Link
                      external
                      externalIconAriaLabel="Opens in a new tab"
                      href="https://github.com/aws-samples/avp-sample-apps"
                    >
                      Sample Apps Repository
                    </Link>
                  </li>
                </ul>
              </Container>
            </SpaceBetween>
          </div>
        </Grid>
      </Box>
    </Box>
  );
};

export default HomePage;
