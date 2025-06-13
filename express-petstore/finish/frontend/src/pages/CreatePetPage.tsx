import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const CreatePetPage: React.FC = () => {
  const navigate = useNavigate();
  const api = useApi(); // Move the hook call to the top level
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  
  // Validation state
  const [nameError, setNameError] = useState('');
  const [typeError, setTypeError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [formError, setFormError] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Validate all fields immediately
  useEffect(() => {
    validateName(name);
    validateType(type);
    validateAge(age);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = name !== '' || type !== '' || breed !== '' || age !== '' || description !== '';
    setHasUnsavedChanges(hasChanges);
  }, [name, type, breed, age, description]);
  
  // Validation functions
  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError('Name is required');
      return false;
    }
    setNameError('');
    return true;
  };
  
  const validateType = (value: string): boolean => {
    if (!value) {
      setTypeError('Type is required');
      return false;
    }
    setTypeError('');
    return true;
  };
  
  const validateAge = (value: string): boolean => {
    if (value) {
      const ageNum = parseInt(value, 10);
      if (isNaN(ageNum) || ageNum < 0) {
        setAgeError('Age must be a positive number');
        return false;
      }
    }
    setAgeError('');
    return true;
  };
  
  // Handle form submission
  const handleSubmit: NonCancelableEventHandler<ButtonProps.ClickDetail> = async () => {
    // Validate all fields
    const isNameValid = validateName(name);
    const isTypeValid = validateType(type);
    const isAgeValid = validateAge(age);
    
    if (!isNameValid || !isTypeValid || !isAgeValid) {
      setFormError('Please fix the errors in the form before submitting.');
      return;
    }
    
    setFormError('');
    
    try {
      setLoading(true);
      
      const newPet = {
        name,
        species: type,
        breed,
        age: age ? parseInt(age, 10) : 0,
        description
      };
      
      // Use the API context that was initialized at the top level
      await api.post('pets', newPet);
      
      setHasUnsavedChanges(false);
      navigate('/pets');
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('Error creating pet:', error);
      setFormError('Failed to create pet. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle cancel/leave
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowLeaveModal(true);
    } else {
      navigate('/pets');
    }
  };
  
  return (
    <Form
      header={<Header variant="h1">Add New Pet</Header>}
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={handleCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>Create pet</Button>
        </SpaceBetween>
      }
      errorText={formError}
    >
      <Container>
        <SpaceBetween size="l">
          <FormField 
            label="Name" 
            errorText={nameError}
            constraintText="Pet name must be between 1 and 50 characters."
          >
            <Input
              value={name}
              onChange={({ detail }) => {
                setName(detail.value);
                validateName(detail.value);
              }}
              onBlur={() => validateName(name)}
              placeholder="Enter pet name"
              autoFocus
            />
          </FormField>
          
          <FormField 
            label="Type" 
            errorText={typeError}
            constraintText="Select the type of pet."
          >
            <Select
              selectedOption={type ? { label: type, value: type } : null}
              onChange={({ detail }) => {
                setType(detail.selectedOption?.value || '');
                validateType(detail.selectedOption?.value || '');
              }}
              onBlur={() => validateType(type)}
              options={petTypes}
              placeholder="Select pet type"
              expandToViewport={false}
              autoFocus={false}
              ariaRequired={true}
            />
          </FormField>
          
          <FormField 
            label="Breed"
            constraintText="Optional: Specify the breed of your pet."
          >
            <Input
              value={breed}
              onChange={({ detail }) => setBreed(detail.value)}
              placeholder="Enter breed"
            />
          </FormField>
          
          <FormField 
            label="Age" 
            errorText={ageError}
            constraintText="Age must be a positive number."
          >
            <Input
              value={age}
              onChange={({ detail }) => {
                setAge(detail.value);
                validateAge(detail.value);
              }}
              onBlur={() => validateAge(age)}
              placeholder="Enter age in years"
              type="number"
            />
          </FormField>
          
          <FormField 
            label="Description"
            constraintText="Optional: Add a description for your pet."
          >
            <Textarea
              value={description}
              onChange={({ detail }) => setDescription(detail.value)}
              placeholder="Enter description"
            />
          </FormField>
        </SpaceBetween>
      </Container>
      
      <Modal
        visible={showLeaveModal}
        onDismiss={() => setShowLeaveModal(false)}
        header="Unsaved changes"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => navigate('/pets')}>Leave page</Button>
            </SpaceBetween>
          </Box>
        }
      >
        You have unsaved changes that will be lost if you leave this page.
      </Modal>
    </Form>
  );
};

export default CreatePetPage;
