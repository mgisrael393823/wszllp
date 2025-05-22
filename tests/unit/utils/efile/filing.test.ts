import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitFiling, getFilingStatus } from '@/utils/efile/filing';
import { apiClient } from '@/utils/efile/apiClient';
import type { EFileSubmission } from '@/types/efile';

// Mock the apiClient module
vi.mock('@/utils/efile/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('Filing utilities', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
  });
  
  describe('submitFiling', () => {
    it('should call API with correct parameters and return response', async () => {
      // Create a mock submission
      const mockSubmission: EFileSubmission = {
        reference_id: 'test-ref-123',
        jurisdiction: 'COOK:cvd1',
        case_category: '7',
        case_type: 'CV2023123456',
        filings: [
          {
            code: 'COMP',
            description: 'Complaint',
            file: 'base64data',
            file_name: 'complaint.pdf',
            doc_type: 'application/pdf',
          }
        ],
        payment_account_id: 'acc123',
        filing_attorney_id: 'atty456',
        filing_party_id: 'party789',
        is_initial_filing: true,
      };
      
      // Mock successful API response
      const mockResponse = {
        data: {
          envelope_id: 'env-123456',
          status: 'submitted',
          tracking_number: 'trk-789012',
          message: 'Successfully submitted'
        }
      };
      
      // Setup the mock to return our response
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
      
      // Call the function
      const result = await submitFiling(mockSubmission, 'test-auth-token');
      
      // Check API was called correctly
      expect(apiClient.post).toHaveBeenCalledWith(
        '/il/efile',
        { data: mockSubmission },
        { headers: { authtoken: 'test-auth-token' } }
      );
      
      // Check result
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should throw error if API call fails', async () => {
      // Mock API error
      const mockError = new Error('API error');
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);
      
      // Create a simple mock submission
      const mockSubmission: EFileSubmission = {
        reference_id: 'test-ref-123',
        jurisdiction: 'COOK:cvd1',
        case_category: '7',
        case_type: 'CV2023123456',
        filings: [],
        payment_account_id: 'acc123',
        filing_attorney_id: 'atty456',
        filing_party_id: 'party789',
      };
      
      // Check that the function throws
      await expect(submitFiling(mockSubmission, 'test-auth-token'))
        .rejects.toThrow('API error');
    });
  });
  
  describe('getFilingStatus', () => {
    it('should call API with correct parameters and return status', async () => {
      // Mock successful API response
      const mockResponse = {
        data: {
          envelope_id: 'env-123456',
          status: 'accepted',
          tracking_number: 'trk-789012',
          filings: [
            {
              code: 'COMP',
              status: 'accepted',
              stamped_document: 'base64stampeddata',
              reviewer_comment: 'Accepted by court',
            }
          ]
        }
      };
      
      // Setup the mock to return our response
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
      
      // Call the function
      const result = await getFilingStatus('env-123456', 'test-auth-token');
      
      // Check API was called correctly
      expect(apiClient.get).toHaveBeenCalledWith(
        '/il/envelope/env-123456?fields=client_matter_number,jurisdiction,case_number,case_tracking_id,case_category,case_type,filings(file,status,stamped_document,reviewer_comment,status_reason)',
        { headers: { authtoken: 'test-auth-token' } }
      );
      
      // Check result
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should throw error if API call fails', async () => {
      // Mock API error
      const mockError = new Error('API error');
      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);
      
      // Check that the function throws
      await expect(getFilingStatus('env-123456', 'test-auth-token'))
        .rejects.toThrow('API error');
    });
  });
});