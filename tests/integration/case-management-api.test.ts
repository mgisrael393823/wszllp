import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Integration tests that actually connect to test database
describe('Case Management API Integration', () => {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
  );

  let testUserId: string;
  let testCaseId: string;
  let createdRecords: { table: string; id: string }[] = [];

  beforeEach(async () => {
    // Create a test user for integration tests
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (userError || !userData.user) {
      throw new Error(`Failed to create test user: ${userError?.message}`);
    }

    testUserId = userData.user.id;
  });

  afterEach(async () => {
    // Clean up created records in reverse order
    for (const record of createdRecords.reverse()) {
      try {
        await supabase.from(record.table).delete().eq('id', record.id);
      } catch (error) {
        console.warn(`Failed to clean up ${record.table} record ${record.id}:`, error);
      }
    }
    createdRecords = [];

    // Clean up test user
    if (testUserId) {
      try {
        await supabase.auth.admin.deleteUser(testUserId);
      } catch (error) {
        console.warn(`Failed to clean up test user ${testUserId}:`, error);
      }
    }
  });

  describe('Database Functions', () => {
    it('should create case with transaction function', async () => {
      const { data: caseId, error } = await supabase.rpc('create_case_with_transaction', {
        p_user_id: testUserId,
        p_jurisdiction: 'il',
        p_county: 'cook',
        p_case_type: 'eviction',
        p_attorney_id: 'ATT123',
        p_reference_id: `WSZ-${Date.now()}`,
        p_status: 'Open',
        p_case_category: '7',
      });

      expect(error).toBeNull();
      expect(caseId).toBeDefined();
      expect(typeof caseId).toBe('string');

      testCaseId = caseId!;
      createdRecords.push({ table: 'cases', id: testCaseId });

      // Verify case was created with correct data
      const { data: case_, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', testCaseId)
        .single();

      expect(caseError).toBeNull();
      expect(case_).toMatchObject({
        id: testCaseId,
        user_id: testUserId,
        case_number: expect.stringMatching(/^WSZ-\d+$/),
        type: 'eviction',
        status: 'Open',
      });
    });

    it('should create document with validation function', async () => {
      // First create a case
      const { data: caseId } = await supabase.rpc('create_case_with_transaction', {
        p_user_id: testUserId,
        p_jurisdiction: 'il',
        p_county: 'cook',
        p_case_type: 'eviction',
        p_attorney_id: 'ATT123',
        p_reference_id: `WSZ-${Date.now()}`,
        p_status: 'Open',
        p_case_category: '7',
      });

      testCaseId = caseId!;
      createdRecords.push({ table: 'cases', id: testCaseId });

      // Now create document
      const envelopeId = `ENV-${Date.now()}`;
      const filingId = `FIL-${Date.now()}`;
      const timestamp = new Date().toISOString();

      const { data: documentId, error } = await supabase.rpc('create_document_with_validation', {
        p_case_id: testCaseId,
        p_envelope_id: envelopeId,
        p_filing_id: filingId,
        p_file_name: 'test-complaint.pdf',
        p_doc_type: 'Complaint',
        p_efile_status: 'submitted',
        p_efile_timestamp: timestamp,
      });

      expect(error).toBeNull();
      expect(documentId).toBeDefined();
      expect(typeof documentId).toBe('string');

      createdRecords.push({ table: 'documents', id: documentId! });

      // Verify document was created with correct data
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId!)
        .single();

      expect(docError).toBeNull();
      expect(document).toMatchObject({
        id: documentId,
        case_id: testCaseId,
        envelope_id: envelopeId,
        filing_id: filingId,
        original_filename: 'test-complaint.pdf',
        type: 'Complaint',
        efile_status: 'submitted',
        status: 'Pending',
      });

      // Verify timestamp was set correctly
      expect(new Date(document.efile_timestamp)).toBeInstanceOf(Date);
    });

    it('should prevent duplicate documents', async () => {
      // Create a case first
      const { data: caseId } = await supabase.rpc('create_case_with_transaction', {
        p_user_id: testUserId,
        p_jurisdiction: 'il',
        p_county: 'cook',
        p_case_type: 'eviction',
        p_attorney_id: 'ATT123',
        p_reference_id: `WSZ-${Date.now()}`,
        p_status: 'Open',
        p_case_category: '7',
      });

      testCaseId = caseId!;
      createdRecords.push({ table: 'cases', id: testCaseId });

      const envelopeId = `ENV-${Date.now()}`;
      const filingId = `FIL-${Date.now()}`;
      const timestamp = new Date().toISOString();

      // Create first document
      const { data: documentId1, error: error1 } = await supabase.rpc('create_document_with_validation', {
        p_case_id: testCaseId,
        p_envelope_id: envelopeId,
        p_filing_id: filingId,
        p_file_name: 'test-complaint.pdf',
        p_doc_type: 'Complaint',
        p_efile_status: 'submitted',
        p_efile_timestamp: timestamp,
      });

      expect(error1).toBeNull();
      expect(documentId1).toBeDefined();
      createdRecords.push({ table: 'documents', id: documentId1! });

      // Attempt to create duplicate document
      const { data: documentId2, error: error2 } = await supabase.rpc('create_document_with_validation', {
        p_case_id: testCaseId,
        p_envelope_id: envelopeId, // Same envelope ID
        p_filing_id: filingId,     // Same filing ID
        p_file_name: 'duplicate-complaint.pdf',
        p_doc_type: 'Complaint',
        p_efile_status: 'submitted',
        p_efile_timestamp: timestamp,
      });

      expect(error2).toBeDefined();
      expect(error2?.message).toContain('already exists');
      expect(documentId2).toBeNull();
    });

    it('should validate case existence before creating document', async () => {
      const nonExistentCaseId = '00000000-0000-0000-0000-000000000000';

      const { data: documentId, error } = await supabase.rpc('create_document_with_validation', {
        p_case_id: nonExistentCaseId,
        p_envelope_id: `ENV-${Date.now()}`,
        p_filing_id: `FIL-${Date.now()}`,
        p_file_name: 'test-complaint.pdf',
        p_doc_type: 'Complaint',
        p_efile_status: 'submitted',
        p_efile_timestamp: new Date().toISOString(),
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain('does not exist');
      expect(documentId).toBeNull();
    });
  });

  describe('API Endpoints Integration', () => {
    it('should handle complete case and document creation flow', async () => {
      // Test the full flow that would happen in production
      const referenceId = `WSZ-${Date.now()}`;
      
      // Step 1: Create case via API logic (simulated)
      const { data: caseId, error: caseError } = await supabase.rpc('create_case_with_transaction', {
        p_user_id: testUserId,
        p_jurisdiction: 'il',
        p_county: 'cook',
        p_case_type: 'eviction',
        p_attorney_id: 'ATT123',
        p_reference_id: referenceId,
        p_status: 'Open',
        p_case_category: '7',
      });

      expect(caseError).toBeNull();
      expect(caseId).toBeDefined();
      testCaseId = caseId!;
      createdRecords.push({ table: 'cases', id: testCaseId });

      // Step 2: Create document via API logic (simulated)
      const envelopeId = 'envelope-123-test';
      const filingId = 'filing-001';
      
      const { data: documentId, error: docError } = await supabase.rpc('create_document_with_validation', {
        p_case_id: testCaseId,
        p_envelope_id: envelopeId,
        p_filing_id: filingId,
        p_file_name: 'eviction_complaint.pdf',
        p_doc_type: 'document',
        p_efile_status: 'submitted',
        p_efile_timestamp: new Date().toISOString(),
      });

      expect(docError).toBeNull();
      expect(documentId).toBeDefined();
      createdRecords.push({ table: 'documents', id: documentId! });

      // Step 3: Verify data integrity
      const { data: case_, error: caseSelectError } = await supabase
        .from('cases')
        .select(`
          *,
          documents (
            id,
            envelope_id,
            filing_id,
            original_filename,
            efile_status
          )
        `)
        .eq('id', testCaseId)
        .single();

      expect(caseSelectError).toBeNull();
      expect(case_).toBeDefined();
      expect(case_.documents).toHaveLength(1);
      expect(case_.documents[0]).toMatchObject({
        envelope_id: envelopeId,
        filing_id: filingId,
        original_filename: 'eviction_complaint.pdf',
        efile_status: 'submitted',
      });
    });

    it('should handle high concurrency document creation', async () => {
      // Create a case first
      const { data: caseId } = await supabase.rpc('create_case_with_transaction', {
        p_user_id: testUserId,
        p_jurisdiction: 'il',
        p_county: 'cook',
        p_case_type: 'eviction',
        p_attorney_id: 'ATT123',
        p_reference_id: `WSZ-${Date.now()}`,
        p_status: 'Open',
        p_case_category: '7',
      });

      testCaseId = caseId!;
      createdRecords.push({ table: 'cases', id: testCaseId });

      // Simulate concurrent document creation attempts
      const baseTimestamp = Date.now();
      const documentCreationPromises = Array.from({ length: 5 }, (_, i) =>
        supabase.rpc('create_document_with_validation', {
          p_case_id: testCaseId,
          p_envelope_id: `ENV-${baseTimestamp}`,
          p_filing_id: `FIL-${baseTimestamp}-${i}`, // Different filing IDs
          p_file_name: `document-${i}.pdf`,
          p_doc_type: 'document',
          p_efile_status: 'submitted',
          p_efile_timestamp: new Date().toISOString(),
        })
      );

      const results = await Promise.allSettled(documentCreationPromises);
      
      // All should succeed since they have different filing IDs
      const successResults = results.filter(r => r.status === 'fulfilled' && r.value.data);
      expect(successResults).toHaveLength(5);

      // Add all created documents to cleanup list
      successResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.data) {
          createdRecords.push({ table: 'documents', id: result.value.data });
        }
      });
    });
  });
});