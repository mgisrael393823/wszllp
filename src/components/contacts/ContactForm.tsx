import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  useForm, 
  Controller 
} from 'react-hook-form';
import {
  useCreate,
  useUpdate,
  useOne
} from '@refinedev/core';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Briefcase,
  ArrowLeft,
  Save
} from 'lucide-react';
import { Card } from '../ui/shadcn-card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Contact } from '../../types/schema';

const ContactForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  // Set up form
  const { 
    control, 
    handleSubmit, 
    reset,
    formState: { errors, isDirty }
  } = useForm<Contact>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'PM',
      company: '',
      address: '',
      notes: '',
    },
  });
  
  // Set up API hooks from Refine
  const { mutate: createContact } = useCreate<Contact>();
  const { mutate: updateContact } = useUpdate<Contact>();
  
  // Fetch contact data for edit mode
  const { data, isLoading: isLoadingContact } = useOne<Contact>({
    resource: 'contacts',
    id: id || '',
    queryOptions: {
      enabled: isEditMode,
    },
  });
  
  // When editing, populate form with contact data
  useEffect(() => {
    if (isEditMode && data?.data) {
      reset(data.data);
    }
  }, [isEditMode, data, reset]);
  
  // Handle form submission
  const onSubmit = (formData: Contact) => {
    if (isEditMode) {
      // Update existing contact
      updateContact(
        {
          resource: 'contacts',
          id: id || '',
          values: formData,
        },
        {
          onSuccess: () => {
            navigate(`/contacts/${id}`);
          },
        }
      );
    } else {
      // Create new contact
      createContact(
        {
          resource: 'contacts',
          values: formData,
        },
        {
          onSuccess: (data) => {
            // Navigate to the newly created contact
            navigate(`/contacts/${data.data.id}`);
          },
        }
      );
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header with back button */}
      <div className="mb-6">
        <Button
          variant="text"
          onClick={() => navigate(isEditMode ? `/contacts/${id}` : '/contacts')}
          icon={<ArrowLeft size={16} />}
          className="mb-4"
        >
          {isEditMode ? 'Back to Contact' : 'Back to Contacts'}
        </Button>
        
        <h1 className="text-2xl font-bold text-neutral-900">
          {isEditMode ? 'Edit Contact' : 'Add New Contact'}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {isEditMode 
            ? 'Update contact information' 
            : 'Create a new contact in your database'}
        </p>
      </div>
      
      {/* Contact Form Card */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">Contact Information</h2>
            
            <div className="space-y-6">
              {/* Name field */}
              <div>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Name"
                      placeholder="Enter contact name"
                      error={errors.name?.message}
                      icon={<User size={18} />}
                    />
                  )}
                />
              </div>
              
              {/* Role field */}
              <div>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Role"
                      options={[
                        { value: 'PM', label: 'Property Manager' },
                        { value: 'Attorney', label: 'Attorney' },
                        { value: 'Paralegal', label: 'Paralegal' },
                        { value: 'Client', label: 'Client' },
                        { value: 'Other', label: 'Other' },
                      ]}
                    />
                  )}
                />
              </div>
              
              {/* Email field */}
              <div>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      label="Email"
                      placeholder="Enter email address"
                      error={errors.email?.message}
                      icon={<Mail size={18} />}
                    />
                  )}
                />
              </div>
              
              {/* Phone field */}
              <div>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Phone"
                      placeholder="Enter phone number"
                      error={errors.phone?.message}
                      icon={<Phone size={18} />}
                    />
                  )}
                />
              </div>
              
              {/* Company field */}
              <div>
                <Controller
                  name="company"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Company"
                      placeholder="Enter company name"
                      error={errors.company?.message}
                      icon={<Briefcase size={18} />}
                    />
                  )}
                />
              </div>
              
              {/* Address field */}
              <div>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Address"
                      placeholder="Enter address"
                      error={errors.address?.message}
                      icon={<MapPin size={18} />}
                      multiline
                      rows={3}
                    />
                  )}
                />
              </div>
              
              {/* Notes field */}
              <div>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Notes"
                      placeholder="Add any additional notes about this contact"
                      multiline
                      rows={4}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </Card>
        
        {/* Form Actions */}
        <div className="flex justify-end gap-3 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate(isEditMode ? `/contacts/${id}` : '/contacts')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<Save size={16} />}
            disabled={!isDirty}
          >
            {isEditMode ? 'Update Contact' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;