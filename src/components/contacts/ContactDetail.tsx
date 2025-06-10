import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOne, useDelete } from '@refinedev/core';
import { 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Briefcase,
  ArrowLeft
} from 'lucide-react';
import { Card } from '../ui/shadcn-card';
import Button from '../ui/Button';
import { Contact } from '../../types/schema';
import { format, parseISO, isValid } from 'date-fns';

const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use Refine's useOne hook to get contact data
  const { data, isLoading, isError } = useOne<Contact>({
    resource: 'contacts',
    id: id || '',
  });
  
  const contact = data?.data;
  
  // Set up delete hook
  const { mutate: deleteContact } = useDelete();
  
  // Handle delete contact
  const handleDelete = () => {
    // Confirm before deleting
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteContact(
        {
          resource: 'contacts',
          id: id || '',
        },
        {
          onSuccess: () => {
            navigate('/contacts');
          },
        }
      );
    }
  };
  
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-neutral-500">Loading contact information...</p>
      </div>
    );
  }
  
  if (isError || !contact) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center">
        <div className="text-error-500 bg-error-50 p-4 rounded-md inline-flex items-center mb-2">
          <span className="mr-2">⚠️</span> Error loading contact
        </div>
        <p className="text-neutral-500">The contact could not be found</p>
        <Button
          variant="outline"
          onClick={() => navigate('/contacts')}
          className="mt-4"
          icon={<ArrowLeft size={16} />}
        >
          Back to Contacts
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header with back button */}
      <div className="mb-6">
        <Button
          variant="text"
          onClick={() => navigate('/contacts')}
          icon={<ArrowLeft size={16} />}
          className="mb-4"
        >
          Back to Contacts
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-lg">
              {contact.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-neutral-900">{contact.name}</h1>
              <p className="mt-1 text-sm text-neutral-500">{contact.role || 'Contact'}</p>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/contacts/${contact.id}/edit`)}
              icon={<Edit size={16} />}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              icon={<Trash2 size={16} />}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
      
      {/* Contact Information Card */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-medium text-neutral-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Contact details */}
            <div className="space-y-4">
              {contact.email && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center text-neutral-400">
                    <Mail size={18} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-900">Email</p>
                    <p className="text-sm text-neutral-500">{contact.email}</p>
                  </div>
                </div>
              )}
              
              {contact.phone && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center text-neutral-400">
                    <Phone size={18} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-900">Phone</p>
                    <p className="text-sm text-neutral-500">{contact.phone}</p>
                  </div>
                </div>
              )}
              
              {contact.address && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center text-neutral-400">
                    <MapPin size={18} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-900">Address</p>
                    <p className="text-sm text-neutral-500 whitespace-pre-line">{contact.address}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Additional details */}
            <div className="space-y-4">
              {contact.company && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center text-neutral-400">
                    <Briefcase size={18} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-900">Company</p>
                    <p className="text-sm text-neutral-500">{contact.company}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center text-neutral-400">
                  <User size={18} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-neutral-900">Role</p>
                  <p className="text-sm text-neutral-500">{contact.role || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center text-neutral-400">
                  <Calendar size={18} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-neutral-900">Added</p>
                    <p className="text-sm text-neutral-500">
                      {(() => {
                        const date = typeof contact.created_at === 'string'
                          ? parseISO(contact.created_at)
                          : contact.created_at instanceof Date
                          ? contact.created_at
                          : null;
                        return date && isValid(date)
                          ? format(date, 'MMMM d, yyyy')
                          : 'Invalid Date';
                      })()}
                    </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes section */}
          {contact.notes && (
            <div className="mt-6 border-t border-neutral-200 pt-6">
              <h3 className="text-md font-medium text-neutral-900 mb-2">Notes</h3>
              <p className="text-sm text-neutral-500 whitespace-pre-line">{contact.notes}</p>
            </div>
          )}
        </div>
      </Card>
      
      {/* Related Cases section - placeholder for now */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-medium text-neutral-900 mb-4">Related Cases</h2>
          <p className="text-sm text-neutral-500">No cases associated with this contact yet.</p>
        </div>
      </Card>
      
      {/* Recent Activity section - placeholder for now */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-medium text-neutral-900 mb-4">Recent Activity</h2>
          <p className="text-sm text-neutral-500">No recent activity for this contact.</p>
        </div>
      </Card>
    </div>
  );
};

export default ContactDetail;