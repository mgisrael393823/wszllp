import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Users, Plus } from 'lucide-react';
import { ContactsProvider } from './ContactsProvider';
import ContactList from './ContactList';
import ContactDetail from './ContactDetail';
import ContactForm from './ContactForm';
import Button from '../ui/Button';

/**
 * Main Contacts Page component
 * This serves as the container for all contact-related views
 * It also provides the Refine context to all child components
 */
const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <ContactsProvider>
      <div className="max-w-7xl mx-auto">
        <Routes>
          <Route 
            path="/" 
            element={
              <>
                {/* Page Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
                      <p className="mt-1 text-sm text-gray-500">
                        Manage all your contacts, clients, and relationships
                      </p>
                    </div>
                    <Button 
                      variant="primary" 
                      icon={<Plus size={16} />}
                      onClick={() => navigate('/contacts/new')}
                    >
                      New Contact
                    </Button>
                  </div>
                </div>
                
                {/* Contact List */}
                <ContactList />
              </>
            }
          />
          <Route path="/new" element={<ContactForm />} />
          <Route path="/:id" element={<ContactDetail />} />
          <Route path="/:id/edit" element={<ContactForm />} />
        </Routes>
      </div>
    </ContactsProvider>
  );
};

export default ContactsPage;