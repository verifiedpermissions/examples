import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Select from '@cloudscape-design/components/select';
import Textarea from '@cloudscape-design/components/textarea';
import Form from '@cloudscape-design/components/form';
import Modal from '@cloudscape-design/components/modal';
import Box from '@cloudscape-design/components/box';
import { NonCancelableEventHandler } from '@cloudscape-design/components/internal/events';
import { ButtonProps } from '@cloudscape-design/components/button';
import { useApi } from '../context/ApiContext';

const petTypes = [
  { label: 'Dog', value: 'Dog' },
  { label: 'Cat', value: 'Cat' },
  { label: 'Bird', value: 'Bird' },
  { label: 'Fish', value: 'Fish' },
  { label: 'Reptile', value: 'Reptile' },
  { label: 'Small Animal', value: 'Small Animal' },
  { label: 'Other', value: 'Other' }
];

const EditPetPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useApi(); // Move the hook call to the top level
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialData, setInitialData] = useState<Record<string, unknown>>({});
  
  // Fetch pet data
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
      const petData = response?.data?.pet || response?.pet || response;
      
      // eslint-disable-next-line no-console
      console.log('Pet data:', petData);
      
      // Safely set values with fallbacks
      setName(petData?.name || '');
      setType(petData?.species || petData?.type || '');
      setBreed(petData?.breed || '');
      // Safely handle age which might be missing or in a different format
      const ageValue = petData?.age !== undefined ? String(petData.age) : '';
      setAge(ageValue);
      setDescription(petData?.description || '');
      
      // Store initial data for change detection
      setInitialData({
        name: petData?.name || '',
        type: petData?.species || petData?.type || '',
        breed: petData?.breed || '',
        age: ageValue,
        description: petData?.description || ''
      });
      
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('Error fetching pet:', error);
      setError('Failed to load pet details');
    } finally {
      setLoading(false);
    }
  };
  
  // Check for unsaved changes
  useEffect(() => {
    const currentData = {
      name,
      type,
      breed,
      age,
      description
    };
    
    const hasChanges = Object.keys(currentData).some(key => {
      return currentData[key as keyof typeof currentData] !== initialData[key];
    });
    
    setHasUnsavedChanges(hasChanges);
  }, [name, type, breed, age, description, initialData]);
  
  // Handle form submission
  const handleSubmit: NonCancelableEventHandler<ButtonProps.ClickDetail> = async () => {
    if (!id) {
      setError('Pet ID is missing');
      return;
    }
    
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 0) {
      setError('Age must be a positive number');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const updatedPet = {
        name,
        species: type,
        breed,
        age: ageNum,
        description
      };
      
      // Use the API context that was initialized at the top level
      await api.put(`pets/${id}`, updatedPet);
      
      setHasUnsavedChanges(false);
      navigate(`/pets/${id}`);
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('Error updating pet:', error);
      setError('Failed to update pet');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle cancel/leave
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowLeaveModal(true);
    } else {
      navigate(`/pets/${id}`);
    }
  };
  
  if (loading) {
    return (
      <Container>
        <div>Loading pet details...</div>
      </Container>
    );
  }
  
  return (
    <Container>
      <Form
        header={<Header variant="h1">Edit Pet</Header>}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={handleCancel}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} loading={saving}>Save changes</Button>
          </SpaceBetween>
        }
        errorText={error}
      >
        <SpaceBetween size="l">
          <FormField label="Name" errorText={!name ? 'Name is required' : undefined}>
            <Input
              value={name}
              onChange={({ detail }) => setName(detail.value)}
              placeholder="Enter pet name"
            />
          </FormField>
          
          <FormField label="Type" errorText={!type ? 'Type is required' : undefined}>
            <Select
              selectedOption={type ? { label: type, value: type } : null}
              onChange={({ detail }) => setType(detail.selectedOption?.value || '')}
              options={petTypes}
              placeholder="Select pet type"
            />
          </FormField>
          
          <FormField label="Breed">
            <Input
              value={breed}
              onChange={({ detail }) => setBreed(detail.value)}
              placeholder="Enter breed"
            />
          </FormField>
          
          <FormField 
            label="Age" 
            errorText={age && (isNaN(parseInt(age, 10)) || parseInt(age, 10) < 0) ? 'Age must be a positive number' : undefined}
          >
            <Input
              value={age}
              onChange={({ detail }) => setAge(detail.value)}
              placeholder="Enter age in years"
              type="number"
            />
          </FormField>
          
          <FormField label="Description">
            <Textarea
              value={description}
              onChange={({ detail }) => setDescription(detail.value)}
              placeholder="Enter description"
            />
          </FormField>
        </SpaceBetween>
      </Form>
      
      <Modal
        visible={showLeaveModal}
        onDismiss={() => setShowLeaveModal(false)}
        header="Unsaved changes"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => navigate(`/pets/${id}`)}>Leave page</Button>
            </SpaceBetween>
          </Box>
        }
      >
        You have unsaved changes that will be lost if you leave this page.
      </Modal>
    </Container>
  );
};

export default EditPetPage;
