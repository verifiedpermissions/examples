import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Box from '@cloudscape-design/components/box';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Alert from '@cloudscape-design/components/alert';
import Modal from '@cloudscape-design/components/modal';
import { useApi } from '../context/ApiContext';

interface Pet {
  id: string;
  name: string;
  type?: string;
  species?: string;
  breed?: string;
  age?: number;
  description?: string;
  [key: string]: unknown;
}

const PetDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useApi(); // Move the hook call to the top level

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPet(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPet = async (petId: string) => {
    try {
      setLoading(true);
      // Use the API context that was initialized at the top level
      const response = await api.get(`pets/${petId}`);

      // Extract pet data from the response structure
      // The API returns: { status: "success", data: { pet: {...} } }
      const petData = response?.data?.pet || response;
      setPet(petData);
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('Error fetching pet:', error);
      setError('Failed to load pet details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      setDeleteLoading(true);
      // Use the API context that was initialized at the top level
      await api.delete(`pets/${id}`);

      navigate('/pets');
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('Error deleting pet:', error);
      setError('Failed to delete pet');
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box textAlign="center" padding="xl">
          Loading pet details...
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert type="error" header="Error">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!pet) {
    return (
      <Container>
        <Alert type="warning" header="Pet not found">
          The requested pet could not be found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => navigate(`/pets/${id}/edit`)}>Edit</Button>
              <Button onClick={() => setShowDeleteModal(true)}>Delete</Button>
            </SpaceBetween>
          }
        >
          {pet.name}
        </Header>

        <ColumnLayout columns={2} variant="text-grid">
          <div>
            <Box variant="h3">Details</Box>
            <SpaceBetween size="l">
              <div>
                <Box variant="awsui-key-label">Type</Box>
                <div>{pet.species || pet.type || 'Unknown'}</div>
              </div>
              <div>
                <Box variant="awsui-key-label">Breed</Box>
                <div>{pet.breed || 'Unknown'}</div>
              </div>
              <div>
                <Box variant="awsui-key-label">Age</Box>
                <div>{pet.age !== undefined ? `${pet.age} ${pet.age === 1 ? 'year' : 'years'}` : 'Unknown'}</div>
              </div>
            </SpaceBetween>
          </div>

          <div>
            <Box variant="h3">Description</Box>
            <p>{pet.description || 'No description available.'}</p>
          </div>
        </ColumnLayout>

        <Box textAlign="center">
          <Button onClick={() => navigate('/pets')}>Back to pets</Button>
        </Box>
      </SpaceBetween>

      <Modal
        visible={showDeleteModal}
        onDismiss={() => setShowDeleteModal(false)}
        header="Delete pet"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="primary" loading={deleteLoading} onClick={handleDelete}>Delete</Button>
            </SpaceBetween>
          </Box>
        }
      >
        Are you sure you want to delete {pet.name}? This action cannot be undone.
      </Modal>
    </Container>
  );
};

export default PetDetailPage;
