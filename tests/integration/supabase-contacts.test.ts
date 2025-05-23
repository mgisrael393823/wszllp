import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseDataProvider, contactQueries } from '../../src/utils/refine/supabaseDataProvider';

// Test configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const dataProvider = createSupabaseDataProvider();

// Test data
const testContact = {
  name: 'Test Contact',
  role: 'Attorney' as const,
  email: 'test@example.com',
  phone: '(555) 123-4567',
  company: 'Test Law Firm',
  address: '123 Test St, Test City, TC 12345',
  notes: 'Test contact for integration tests',
};

const testContact2 = {
  name: 'Another Test Contact',
  role: 'Client' as const,
  email: 'test2@example.com',
  phone: '(555) 234-5678',
  company: null,
  address: null,
  notes: 'Second test contact',
};

let createdContactId: string;
let createdContact2Id: string;
let testCaseId: string;

describe('Supabase Contacts Data Provider', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await supabase.from('contacts').delete().like('email', 'test%@example.com');
    await supabase.from('cases').delete().like('plaintiff', 'Test%');
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('case_contacts').delete().eq('case_id', testCaseId);
    await supabase.from('contacts').delete().like('email', 'test%@example.com');
    await supabase.from('cases').delete().like('plaintiff', 'Test%');
  });

  describe('Basic CRUD Operations', () => {
    it('should create a contact', async () => {
      const result = await dataProvider.create({
        resource: 'contacts',
        variables: testContact,
      });

      expect(result.data).toBeDefined();
      expect(result.data.name).toBe(testContact.name);
      expect(result.data.email).toBe(testContact.email);
      expect(result.data.role).toBe(testContact.role);
      expect(result.data.id).toBeDefined();

      createdContactId = result.data.id;
    });

    it('should get a contact by id', async () => {
      const result = await dataProvider.getOne({
        resource: 'contacts',
        id: createdContactId,
      });

      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(createdContactId);
      expect(result.data.name).toBe(testContact.name);
      expect(result.data.email).toBe(testContact.email);
    });

    it('should update a contact', async () => {
      const updatedData = {
        name: 'Updated Test Contact',
        phone: '(555) 999-8888',
      };

      const result = await dataProvider.update({
        resource: 'contacts',
        id: createdContactId,
        variables: updatedData,
      });

      expect(result.data).toBeDefined();
      expect(result.data.name).toBe(updatedData.name);
      expect(result.data.phone).toBe(updatedData.phone);
      expect(result.data.email).toBe(testContact.email); // Should remain unchanged
    });

    it('should list contacts', async () => {
      // Create second contact for list testing
      const result2 = await dataProvider.create({
        resource: 'contacts',
        variables: testContact2,
      });
      createdContact2Id = result2.data.id;

      const result = await dataProvider.getList({
        resource: 'contacts',
        pagination: { current: 1, pageSize: 10 },
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(2);

      // Check if our test contacts are in the list
      const contactIds = result.data.map((c: any) => c.id);
      expect(contactIds).toContain(createdContactId);
      expect(contactIds).toContain(createdContact2Id);
    });

    it('should filter contacts by role', async () => {
      const result = await dataProvider.getList({
        resource: 'contacts',
        filters: [
          { field: 'role', operator: 'eq', value: 'Attorney' }
        ],
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      
      // All returned contacts should be attorneys
      result.data.forEach((contact: any) => {
        expect(contact.role).toBe('Attorney');
      });

      // Should include our test attorney
      const contactIds = result.data.map((c: any) => c.id);
      expect(contactIds).toContain(createdContactId);
    });

    it('should search contacts by name', async () => {
      const result = await dataProvider.getList({
        resource: 'contacts',
        filters: [
          { field: 'name', operator: 'contains', value: 'Updated Test' }
        ],
      });

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      
      // Should find our updated contact
      const contact = result.data.find((c: any) => c.id === createdContactId);
      expect(contact).toBeDefined();
      expect(contact.name).toContain('Updated Test');
    });

    it('should sort contacts by name', async () => {
      const result = await dataProvider.getList({
        resource: 'contacts',
        sorters: [
          { field: 'name', order: 'asc' }
        ],
      });

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(1);

      // Check if results are sorted
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].name.localeCompare(result.data[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should paginate contacts', async () => {
      const page1 = await dataProvider.getList({
        resource: 'contacts',
        pagination: { current: 1, pageSize: 1 },
      });

      const page2 = await dataProvider.getList({
        resource: 'contacts',
        pagination: { current: 2, pageSize: 1 },
      });

      expect(page1.data).toBeDefined();
      expect(page2.data).toBeDefined();
      expect(page1.data.length).toBe(1);
      expect(page2.data.length).toBe(1);

      // Pages should have different contacts
      expect(page1.data[0].id).not.toBe(page2.data[0].id);
    });

    it('should delete a contact', async () => {
      const result = await dataProvider.deleteOne({
        resource: 'contacts',
        id: createdContact2Id,
      });

      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(createdContact2Id);

      // Verify contact is deleted
      await expect(
        dataProvider.getOne({
          resource: 'contacts',
          id: createdContact2Id,
        })
      ).rejects.toThrow();
    });
  });

  describe('Case-Contact Relationships', () => {
    beforeEach(async () => {
      // Create a test case for relationship testing
      const { data: caseData } = await supabase
        .from('cases')
        .insert({
          id: crypto.randomUUID(),
          plaintiff: 'Test Plaintiff',
          defendant: 'Test Defendant',
          address: '123 Test Address',
          status: 'Active',
        })
        .select()
        .single();

      testCaseId = caseData.id;

      // Create a case-contact link for relationship tests
      await contactQueries.addContactToCase(
        testCaseId,
        createdContactId,
        'Attorney',
        true,
        'Primary attorney for plaintiff'
      );
    });

    it('should link a contact to a case', async () => {
      // Test linking with a different relationship type to avoid duplicate constraint
      const result = await contactQueries.addContactToCase(
        testCaseId,
        createdContactId,
        'Paralegal',
        false,
        'Supporting paralegal for the case'
      );

      expect(result).toBeDefined();
      expect(result.case_id).toBe(testCaseId);
      expect(result.contact_id).toBe(createdContactId);
      expect(result.relationship_type).toBe('Paralegal');
      expect(result.is_primary).toBe(false);
    });

    it('should get contacts for a case', async () => {
      const contacts = await contactQueries.getContactsForCase(testCaseId);

      expect(Array.isArray(contacts)).toBe(true);
      expect(contacts.length).toBeGreaterThanOrEqual(1);

      const linkedContact = contacts.find(cc => cc.contact_id === createdContactId);
      expect(linkedContact).toBeDefined();
      expect(linkedContact.relationship_type).toBe('Attorney');
      expect(linkedContact.contact).toBeDefined();
      expect(linkedContact.contact.name).toBe('Updated Test Contact');
    });

    it('should get cases for a contact', async () => {
      const cases = await contactQueries.getCasesForContact(createdContactId);

      expect(Array.isArray(cases)).toBe(true);
      expect(cases.length).toBeGreaterThanOrEqual(1);

      const linkedCase = cases.find(cc => cc.case_id === testCaseId);
      expect(linkedCase).toBeDefined();
      expect(linkedCase.relationship_type).toBe('Attorney');
      expect(linkedCase.case).toBeDefined();
      expect(linkedCase.case.plaintiff).toBe('Test Plaintiff');
    });
  });

  describe('Communication History', () => {
    it('should log communication with a contact', async () => {
      const communication = {
        contact_id: createdContactId,
        case_id: testCaseId,
        communication_type: 'Email' as const,
        subject: 'Test Email',
        content: 'This is a test email communication',
        direction: 'Outgoing' as const,
        communication_date: new Date().toISOString(),
        follow_up_required: false,
      };

      const result = await contactQueries.logCommunication(communication);

      expect(result).toBeDefined();
      expect(result.contact_id).toBe(createdContactId);
      expect(result.case_id).toBe(testCaseId);
      expect(result.communication_type).toBe('Email');
      expect(result.subject).toBe('Test Email');
      expect(result.direction).toBe('Outgoing');
    });

    it('should get communication history for a contact', async () => {
      const history = await contactQueries.getCommunicationHistory(createdContactId);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThanOrEqual(1);

      const emailComm = history.find(h => h.subject === 'Test Email');
      expect(emailComm).toBeDefined();
      expect(emailComm.communication_type).toBe('Email');
      expect(emailComm.direction).toBe('Outgoing');
    });

    it('should get communication history for a contact filtered by case', async () => {
      const history = await contactQueries.getCommunicationHistory(createdContactId, testCaseId);

      expect(Array.isArray(history)).toBe(true);
      
      // All communications should be for the specified case
      history.forEach(comm => {
        expect(comm.case_id).toBe(testCaseId);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent contact', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      await expect(
        dataProvider.getOne({
          resource: 'contacts',
          id: fakeId,
        })
      ).rejects.toThrow();
    });

    it('should handle invalid email format', async () => {
      await expect(
        dataProvider.create({
          resource: 'contacts',
          variables: {
            ...testContact,
            email: 'invalid-email',
          },
        })
      ).rejects.toThrow();
    });

    it('should handle duplicate email', async () => {
      await expect(
        dataProvider.create({
          resource: 'contacts',
          variables: {
            ...testContact,
            name: 'Different Name',
          },
        })
      ).rejects.toThrow();
    });

    it('should handle missing required fields', async () => {
      await expect(
        dataProvider.create({
          resource: 'contacts',
          variables: {
            role: 'Client',
            email: 'incomplete@example.com',
            // missing name
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Performance & Scalability', () => {
    it('should handle large result sets efficiently', async () => {
      const startTime = Date.now();
      
      const result = await dataProvider.getList({
        resource: 'contacts',
        pagination: { current: 1, pageSize: 100 },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.data).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle complex filters efficiently', async () => {
      const startTime = Date.now();
      
      const result = await dataProvider.getList({
        resource: 'contacts',
        filters: [
          { field: 'role', operator: 'in', value: ['Attorney', 'Paralegal'] },
          { field: 'name', operator: 'contains', value: 'Test' }
        ],
        sorters: [
          { field: 'created_at', order: 'desc' }
        ],
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.data).toBeDefined();
      expect(duration).toBeLessThan(3000); // Should complete in under 3 seconds
    });
  });
});