import React, { useState, useEffect } from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Box from '@cloudscape-design/components/box';
import Alert from '@cloudscape-design/components/alert';
import Table from '@cloudscape-design/components/table';
import Pagination from '@cloudscape-design/components/pagination';
import TextFilter from '@cloudscape-design/components/text-filter';
import ButtonDropdown from '@cloudscape-design/components/button-dropdown';
import Modal from '@cloudscape-design/components/modal';
import Flashbar from '@cloudscape-design/components/flashbar';
import { useNavigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import { useApi } from '../context/ApiContext';

interface Pet {
  id: string;
  name: string;
  type: string;
  species?: string;
  breed: string;
  age: number;
}

// Interface for the raw pet data from API
interface ApiPet {
  id?: string;
  name?: string;
  type?: string;
  species?: string;
  breed?: string;
  age?: number;
  [key: string]: unknown; // Allow for any other properties
}

// Interface for notifications
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  content: string;
  dismissible: boolean;
  dismissLabel?: string;
  onDismiss?: () => void;
}

const PetsPage: React.FC = () => {
  const navigate = useNavigate();
  const api = useApi(); // Move the hook call to the top level

  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [selectedPets, setSelectedPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Filter state
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    fetchPets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications((prevNotifications) => prevNotifications.slice(1));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification]);
  };

  const fetchPets = async () => {
    try {
      setLoading(true);

      // Debug: Log the auth token that will be used
      try {
        const session = await Auth.currentSession();
        // eslint-disable-next-line no-console
        console.log(
          'Auth token being used:',
          session.getIdToken().getJwtToken().substring(0, 20) + '...'
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('Could not log auth token:', e);
      }

      // Use the API context that was initialized at the top level
      const response = await api.get('pets');

      // Ensure response is an array
      let petsData: ApiPet[] = [];

      // Handle the specific API response format: { status: "success", data: { pets: [...] } }
      if (response?.data?.pets && Array.isArray(response.data.pets)) {
        petsData = response.data.pets;
      } else if (Array.isArray(response)) {
        petsData = response;
      } else if (response && typeof response === 'object') {
        // If response is an object that might contain pets array
        if (response.pets && Array.isArray(response.pets)) {
          petsData = response.pets;
        } else if (response.items && Array.isArray(response.items)) {
          petsData = response.items;
        } else if (response.data && Array.isArray(response.data)) {
          petsData = response.data;
        } else {
          // Last resort: try to extract all valid pet objects from response
          petsData = Object.values(response).filter(
            (item) => item && typeof item === 'object' && 'id' in item
          ) as ApiPet[];
        }
      }

      // Normalize the pet data to ensure all required fields exist
      const normalizedPets = petsData.map((pet: ApiPet) => ({
        id: String(
          pet?.id || `temp-${Math.random().toString(36).substring(2, 9)}`
        ),
        name: String(pet?.name || 'Unknown'),
        type: String(pet?.species || pet?.type || 'Unknown'),
        breed: String(pet?.breed || 'Unknown'),
        age: typeof pet?.age === 'number' ? pet.age : 0,
      }));

      setPets(normalizedPets);
      setFilteredPets(normalizedPets);
      setSelectedPets([]);

      // Log what we're getting for debugging
      // eslint-disable-next-line no-console
      console.log('API Response:', response);

      // We've already handled the nested data.pets structure above
      // eslint-disable-next-line no-console
      console.log('Normalized Pets:', normalizedPets);
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('Error fetching pets:', error);
      // Log more detailed error information
      const errorObj = error as { response?: unknown };
      if (errorObj.response) {
        // eslint-disable-next-line no-console
        console.error('Error response:', errorObj.response);
      }
      setError(
        'Failed to load pets: ' + ((error as Error).message || 'Unknown error')
      );
      setPets([]);
      setFilteredPets([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter pets based on search text
  useEffect(() => {
    if (!filterText) {
      setFilteredPets(pets);
      return;
    }

    const filtered = pets.filter((pet) => {
      const searchText = filterText.toLowerCase();
      return (
        pet.name.toLowerCase().includes(searchText) ||
        pet.type.toLowerCase().includes(searchText) ||
        pet.breed.toLowerCase().includes(searchText)
      );
    });

    setFilteredPets(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [filterText, pets]);

  // Calculate pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPets = filteredPets.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredPets.length / pageSize);

  // Handle navigation to pet details
  const handleViewPet = (petId: string) => {
    navigate(`/pets/${petId}`);
  };

  // Handle navigation to edit pet
  const handleEditPet = (petId: string) => {
    navigate(`/pets/${petId}/edit`);
  };

  // Handle navigation to create pet
  const handleCreatePet = () => {
    navigate('/pets/new');
  };

  // Handle delete confirmation
  const handleDeleteConfirmation = () => {
    setShowDeleteModal(true);
  };

  // Handle delete pets
  const handleDeletePets = async () => {
    if (selectedPets.length === 0) {
      setShowDeleteModal(false);
      return;
    }

    setDeleteLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Delete each selected pet
      for (const pet of selectedPets) {
        try {
          await api.delete(`pets/${pet.id}`);
          successCount++;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Error deleting pet:", pet.id, error);
          errorCount++;
        }
      }

      // Show notification based on results
      if (successCount > 0 && errorCount === 0) {
        addNotification({
          id: `delete-success-${Date.now()}`,
          type: 'success',
          content: `Successfully deleted ${successCount} ${
            successCount === 1 ? 'pet' : 'pets'
          }.`,
          dismissible: true,
        });
      } else if (successCount > 0 && errorCount > 0) {
        addNotification({
          id: `delete-partial-${Date.now()}`,
          type: 'warning',
          content: `Deleted ${successCount} ${
            successCount === 1 ? 'pet' : 'pets'
          }, but failed to delete ${errorCount} ${
            errorCount === 1 ? 'pet' : 'pets'
          }.`,
          dismissible: true,
        });
      } else {
        addNotification({
          id: `delete-error-${Date.now()}`,
          type: 'error',
          content: `Failed to delete ${errorCount} ${
            errorCount === 1 ? 'pet' : 'pets'
          }.`,
          dismissible: true,
        });
      }

      // Refresh the pet list
      fetchPets();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error during batch delete:', error);
      addNotification({
        id: `delete-error-${Date.now()}`,
        type: 'error',
        content: 'An error occurred while deleting pets.',
        dismissible: true,
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  // Handle action dropdown selection
  const handleActionSelect = ({ detail }: { detail: { id: string } }) => {
    switch (detail.id) {
      case 'delete':
        handleDeleteConfirmation();
        break;
      case 'view':
        if (selectedPets.length === 1) {
          handleViewPet(selectedPets[0].id);
        }
        break;
      case 'edit':
        if (selectedPets.length === 1) {
          handleEditPet(selectedPets[0].id);
        }
        break;
      default:
        break;
    }
  };

  return (
    <Container>
      <SpaceBetween size="l">
        {notifications.length > 0 && <Flashbar items={notifications} />}

        <Header
          variant="h1"
          counter={
            selectedPets.length > 0
              ? `(${selectedPets.length}/${filteredPets.length})`
              : `(${filteredPets.length})`
          }
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <ButtonDropdown
                items={[
                  {
                    text: 'View details',
                    id: 'view',
                    disabled: selectedPets.length !== 1,
                  },
                  {
                    text: 'Edit',
                    id: 'edit',
                    disabled: selectedPets.length !== 1,
                  },
                  {
                    text: 'Delete',
                    id: 'delete',
                    disabled: selectedPets.length === 0,
                  },
                ]}
                onItemClick={handleActionSelect}
                disabled={selectedPets.length === 0}
              >
                Actions
              </ButtonDropdown>
              <Button variant="primary" onClick={handleCreatePet}>
                Add pet
              </Button>
            </SpaceBetween>
          }
        >
          Pets
        </Header>

        {error && (
          <Alert
            type="error"
            dismissible
            onDismiss={() => setError(null)}
            header="Error loading pets"
          >
            {error}
          </Alert>
        )}

        <Table
          columnDefinitions={[
            {
              id: 'name',
              header: 'Name',
              cell: (item) => item.name,
              sortingField: 'name',
            },
            {
              id: 'type',
              header: 'Type',
              cell: (item) => item.type,
              sortingField: 'type',
            },
            {
              id: 'breed',
              header: 'Breed',
              cell: (item) => item.breed,
              sortingField: 'breed',
            },
            {
              id: 'age',
              header: 'Age',
              cell: (item) =>
                `${item.age} ${item.age === 1 ? 'year' : 'years'}`,
              sortingField: 'age',
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (item) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={() => handleViewPet(item.id)}>View</Button>
                  <Button onClick={() => handleEditPet(item.id)}>Edit</Button>
                </SpaceBetween>
              ),
            },
          ]}
          items={paginatedPets}
          loading={loading}
          loadingText="Loading pets"
          selectionType="multi"
          selectedItems={selectedPets}
          onSelectionChange={({ detail }) =>
            setSelectedPets(detail.selectedItems)
          }
          trackBy="id"
          ariaLabels={{
            selectionGroupLabel: 'Pet selection',
            allItemsSelectionLabel: ({ selectedItems }) =>
              `${
                selectedItems.length === paginatedPets.length
                  ? 'Deselect'
                  : 'Select'
              } all pets`,
            itemSelectionLabel: ({ selectedItems }, item) =>
              `${
                selectedItems.some((i) => i.id === item.id)
                  ? 'Deselect'
                  : 'Select'
              } ${item.name}`,
          }}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No pets</b>
              <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                No pets to display.
              </Box>
              <Button onClick={handleCreatePet}>Add pet</Button>
            </Box>
          }
          filter={
            <TextFilter
              filteringText={filterText}
              filteringPlaceholder="Find pets"
              filteringAriaLabel="Filter pets"
              onChange={({ detail }) => setFilterText(detail.filteringText)}
              countText={`${filteredPets.length} ${
                filteredPets.length === 1 ? 'match' : 'matches'
              }`}
            />
          }
          pagination={
            <Pagination
              currentPageIndex={currentPage}
              pagesCount={totalPages}
              onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
              ariaLabels={{
                nextPageLabel: 'Next page',
                previousPageLabel: 'Previous page',
                pageLabel: (pageNumber) => `Page ${pageNumber} of all pages`,
              }}
            />
          }
        />
      </SpaceBetween>

      {/* Delete confirmation modal */}
      <Modal
        visible={showDeleteModal}
        onDismiss={() => setShowDeleteModal(false)}
        header="Delete pets"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={deleteLoading}
                onClick={handleDeletePets}
              >
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        {selectedPets.length === 1 ? (
          <p>
            Are you sure you want to delete the pet "{selectedPets[0].name}"?
            This action cannot be undone.
          </p>
        ) : (
          <p>
            Are you sure you want to delete {selectedPets.length} pets? This
            action cannot be undone.
          </p>
        )}
      </Modal>
    </Container>
  );
};

export default PetsPage;
