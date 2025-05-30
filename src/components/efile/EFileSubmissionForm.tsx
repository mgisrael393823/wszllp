import React, { useState, useContext, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { EFileContext } from '@/context/EFileContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { ensureAuth, fileToBase64, submitFiling, validateFile } from '@/utils/efile';
import { EFileSubmission, EFileDocument } from '@/types/efile';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { ENHANCED_EFILING_PHASE_A, ENHANCED_EFILING_PHASE_B } from '@/config/features';
import { JURISDICTIONS, type Jurisdiction } from '@/config/jurisdictions';

interface PaymentAccount { 
  id: string; 
  name: string; 
}

export function usePaymentAccounts() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/tyler/payment-accounts');
        
        // Check if response has content
        const contentType = res.headers.get('content-type');
        const hasJson = contentType && contentType.includes('application/json');
        
        if (!hasJson) {
          throw new Error('Invalid response format');
        }
        
        const data = await res.json();
        if (res.ok) {
          setAccounts(data.accounts || []);
          setError(data.error || null);
        } else {
          throw new Error(data.error || 'Failed to load accounts');
        }
      } catch (err) {
        console.error('Error fetching payment accounts:', err);
        setError((err as Error).message);
        // Provide a minimal fallback
        setAccounts([{ id: 'error', name: 'Failed to load payment accounts' }]);
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  return { accounts, loading, error };
}

interface FormData {
  jurisdiction: string;
  county: string;
  jurisdictionCode?: string; // Phase B
  caseType: string;
  filingType: 'initial' | 'subsequent';
  existingCaseNumber?: string;
  attorneyId: string;
  // Phase A: Enhanced fields
  paymentAccountId?: string;
  amountInControversy?: string;
  showAmountInControversy?: boolean;
  petitioner?: {
    type: 'business' | 'individual';
    businessName?: string;
    firstName?: string;
    lastName?: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  // FIXED: Use defendants array instead of single defendant
  defendants: Array<{
    firstName: string;
    lastName: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  }>;
  files: FileList | null;
  referenceId: string;
}

interface FormErrors {
  jurisdiction?: string;
  county?: string;
  jurisdictionCode?: string; // Phase B
  caseType?: string;
  existingCaseNumber?: string;
  attorneyId?: string;
  paymentAccountId?: string;
  amountInControversy?: string;
  'petitioner.businessName'?: string;
  'petitioner.firstName'?: string;
  'petitioner.lastName'?: string;
  'petitioner.zipCode'?: string;
  'defendants.0.firstName'?: string;
  'defendants.0.lastName'?: string;
  'defendants.0.zipCode'?: string;
  files?: string;
}

const EFileSubmissionForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    jurisdiction: 'il',
    county: 'cook',
    jurisdictionCode: '', // Phase B
    caseType: '',
    filingType: 'initial',
    existingCaseNumber: '',
    attorneyId: '',
    // Phase A: Initialize enhanced fields
    paymentAccountId: '',
    amountInControversy: '',
    showAmountInControversy: false,
    petitioner: {
      type: 'business',
      businessName: '',
      firstName: '',
      lastName: '',
      addressLine1: '',
      city: '',
      state: 'IL',
      zipCode: ''
    },
    // FIXED: Initialize defendants as array
    defendants: [{
      firstName: '',
      lastName: '',
      addressLine1: '',
      city: '',
      state: 'IL',
      zipCode: ''
    }],
    files: null,
    referenceId: `WSZ-${Date.now()}`,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingCase, setIsSavingCase] = useState(false);
  const { state, dispatch } = useContext(EFileContext);
  const { dispatch: dataDispatch } = useData();
  const { addToast } = useToast();
  const { user } = useAuth();
  const { accounts, loading: accountsLoading, error: accountsError } = usePaymentAccounts();

  // Case management integration functions
  const createCaseRecord = async (tylerData: any) => {
    if (!user?.id) {
      console.warn('User not authenticated, skipping case creation');
      return null;
    }

    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          jurisdiction: formData.jurisdiction,
          county: formData.county,
          caseType: formData.caseType,
          attorneyId: formData.attorneyId,
          referenceId: formData.referenceId,
          // Phase A: Send enhanced payload
          ...(ENHANCED_EFILING_PHASE_A && {
            paymentAccountId: formData.paymentAccountId,
            amountInControversy: formData.amountInControversy,
            showAmountInControversy: formData.showAmountInControversy,
            petitioner: formData.petitioner,
            // FIXED: Send defendants array instead of single defendant
            defendants: formData.defendants
          })
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Case creation failed: ${error.error}`);
      }

      const result = await response.json();
      return result.caseId;
    } catch (error) {
      console.error('Error creating case record:', error);
      // Show warning but don't fail the Tyler submission
      addToast({
        type: 'warning',
        title: 'Case Management Warning',
        message: 'E-filing succeeded but case record creation failed. Contact support if needed.',
        duration: 8000
      });
      return null;
    }
  };

  const createDocumentRecords = async (caseId: string, tylerData: any) => {
    if (!caseId || !formData.files || !tylerData?.item) return;

    try {
      // Create document records for each filed document
      const documentPromises = Array.from(formData.files).map(async (file, index) => {
        const filing = tylerData.item.filings?.[index];
        if (!filing) return;

        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            caseId: caseId,
            envelopeId: tylerData.item.id,
            filingId: filing.id,
            fileName: file.name,
            docType: filing.code || 'document',
            status: filing.status || 'submitted',
            timestamp: new Date().toISOString()
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`Document creation failed for ${file.name}:`, error);
        }
      });

      await Promise.allSettled(documentPromises);
    } catch (error) {
      console.error('Error creating document records:', error);
      // Log but don't notify user - this is background processing
    }
  };
  
  // Check for saved drafts when component mounts
  useEffect(() => {
    // Get the most recent draft, if any
    const drafts = Object.values(state.drafts).sort((a, b) => 
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
    
    if (drafts.length > 0) {
      const latestDraft = drafts[0];
      addToast({
        type: 'info',
        title: 'Draft Available',
        message: `You have a saved draft from ${new Date(latestDraft.savedAt).toLocaleString()}. Would you like to restore it?`,
        duration: 10000
      });
    }
  }, []);

  // Using TanStack Query v5 API format with proper types
  const mutation = useMutation({
    mutationFn: ({ payload, token }: { payload: EFileSubmission; token: string }) => 
      submitFiling(payload, token),
    onSuccess: async data => {
      dispatch({ type: 'ADD_ENVELOPE', caseId: data.item.case_number || formData.referenceId, envelopeId: data.item.id });
      
      // Case management integration - create case and document records
      try {
        setIsSavingCase(true);
        
        // Step 1: Create case record
        const caseId = await createCaseRecord(data);
        
        // Step 2: Create document records (if case creation succeeded)
        if (caseId) {
          await createDocumentRecords(caseId, data);
        }
      } catch (error) {
        console.error('Case management integration error:', error);
        // Don't fail the overall submission - Tyler filing already succeeded
      } finally {
        setIsSavingCase(false);
      }
      
      // Add to system notifications
      dataDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          notificationId: uuidv4(),
          title: 'Filing submitted',
          message: `Envelope ${data.item.id} submitted successfully`,
          type: 'System',
          priority: 'Low',
          isRead: false,
          entityType: 'Filing',
          entityId: data.item.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      
      // Show success toast
      addToast({
        type: 'success',
        title: 'Filing Submitted',
        message: `Envelope ${data.item.id} submitted successfully. You can track its status in the Filing Status panel.`,
        duration: 5000
      });
      
      // Reset form
      setFormData({ 
        jurisdiction: 'il', 
        county: 'cook',
        jurisdictionCode: '', // Phase B
        caseType: '', 
        filingType: 'initial',
        existingCaseNumber: '',
        attorneyId: '',
        // Phase A: Reset enhanced fields
        paymentAccountId: '',
        amountInControversy: '',
        showAmountInControversy: false,
        petitioner: {
          type: 'business',
          businessName: '',
          firstName: '',
          lastName: '',
          addressLine1: '',
          city: '',
          state: 'IL',
          zipCode: ''
        },
        // Reset defendants array
        defendants: [{
          firstName: '',
          lastName: '',
          addressLine1: '',
          city: '',
          state: 'IL',
          zipCode: ''
        }],
        files: null,
        referenceId: `WSZ-${Date.now()}`
      });
    },
    onError: err => {
      console.error(err);
      
      // Add to system notifications
      dataDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          notificationId: uuidv4(),
          title: 'Filing error',
          message: err instanceof Error ? err.message : 'Submission failed',
          type: 'System',
          priority: 'High',
          isRead: false,
          entityType: 'Filing',
          entityId: formData.existingCaseNumber || formData.referenceId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      
      // Show error toast
      addToast({
        type: 'error',
        title: 'Filing Error',
        message: err instanceof Error ? err.message : 'Submission failed. Please try again or contact support.',
        duration: 8000
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const jurisdictions = [
    { value: 'ca', label: 'California' },
    { value: 'ny', label: 'New York' },
    { value: 'tx', label: 'Texas' },
    { value: 'fl', label: 'Florida' },
    { value: 'il', label: 'Illinois' },
  ];

  const counties = {
    il: [
      { value: 'cook', label: 'Cook County' },
      { value: 'dupage', label: 'DuPage County' },
      { value: 'kane', label: 'Kane County' },
      { value: 'lake', label: 'Lake County' },
      { value: 'will', label: 'Will County' },
    ],
    ca: [
      { value: 'losangeles', label: 'Los Angeles County' },
      { value: 'orange', label: 'Orange County' },
      { value: 'sandiego', label: 'San Diego County' },
      { value: 'santaclara', label: 'Santa Clara County' },
    ],
    ny: [
      { value: 'newyork', label: 'New York County' },
      { value: 'kings', label: 'Kings County (Brooklyn)' },
      { value: 'queens', label: 'Queens County' },
      { value: 'bronx', label: 'Bronx County' },
    ],
    tx: [
      { value: 'harris', label: 'Harris County' },
      { value: 'dallas', label: 'Dallas County' },
      { value: 'bexar', label: 'Bexar County' },
      { value: 'travis', label: 'Travis County' },
    ],
    fl: [
      { value: 'miamidade', label: 'Miami-Dade County' },
      { value: 'broward', label: 'Broward County' },
      { value: 'hillsborough', label: 'Hillsborough County' },
      { value: 'orange_fl', label: 'Orange County' },
    ],
  } as const;

  const caseTypes = [
    { value: '201996', label: 'Eviction – Joint Action – Commercial Complaint Filed – Jury' },
    { value: '201995', label: 'Eviction – Joint Action – Commercial Complaint Filed – Non-Jury' },
    { value: '237042', label: 'Eviction – Joint Action – Residential Complaint Filed – Jury' },
    { value: '237037', label: 'Eviction – Joint Action – Residential Complaint Filed – Non-Jury' },
    { value: '201992', label: 'Eviction – Possession – Commercial Complaint Filed – Jury' },
    { value: '201991', label: 'Eviction – Possession – Commercial Complaint Filed – Non-Jury' },
    { value: '237041', label: 'Eviction – Possession – Residential Complaint Filed – Jury' },
    { value: '237036', label: 'Eviction – Possession – Residential Complaint Filed – Non-Jury' },
  ];

  const filingTypes = [
    { value: 'initial', label: 'Initial Filing (New Case)' },
    { value: 'subsequent', label: 'Subsequent Filing (Existing Case)' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'jurisdiction') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        county: counties[value as keyof typeof counties]?.[0]?.value || '',
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string) => (value: string) => {
    if (name === 'jurisdiction') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        county: counties[value as keyof typeof counties]?.[0]?.value || '',
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Phase A: Enhanced input handlers
  const handlePetitionerChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      petitioner: {
        ...prev.petitioner!,
        [field]: e.target.value
      }
    }));
    // Clear validation errors for this field
    const errorKey = `petitioner.${field}` as keyof FormErrors;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const handleDefendantChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      defendants: prev.defendants.map((defendant, index) => 
        index === 0 ? { ...defendant, [field]: e.target.value } : defendant
      )
    }));
    // Clear validation errors for this field
    const errorKey = `defendants.0.${field}` as keyof FormErrors;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const handlePetitionerTypeChange = (type: 'business' | 'individual') => {
    setFormData(prev => ({
      ...prev,
      petitioner: {
        ...prev.petitioner!,
        type,
        // Clear fields that don't apply to the new type
        ...(type === 'business' ? { firstName: '', lastName: '' } : { businessName: '' })
      }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (files && files.length > 0) {
      // Validate all files
      const invalidFiles = Array.from(files)
        .map(file => ({ file, validation: validateFile(file) }))
        .filter(item => !item.validation.valid);
      
      if (invalidFiles.length > 0) {
        const errorMessage = invalidFiles
          .map(item => item.validation.error)
          .join('; ');
          
        setErrors(prev => ({ ...prev, files: errorMessage }));
        // Clear the file input
        e.target.value = '';
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, files }));
    if (errors.files) {
      setErrors(prev => ({ ...prev, files: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    let isValid = true;
    
    // Existing validations
    if (!formData.jurisdiction) {
      newErrors.jurisdiction = 'Please select a jurisdiction';
      isValid = false;
    }
    
    // Phase B: Enhanced jurisdiction validation
    if (ENHANCED_EFILING_PHASE_B) {
      if (!formData.jurisdictionCode) {
        newErrors.jurisdictionCode = 'Please select a jurisdiction';
        isValid = false;
      }
      // Enhanced validation: Check jurisdiction code format
      if (formData.jurisdictionCode && !/^[a-z]+:[a-z0-9]+$/.test(formData.jurisdictionCode)) {
        newErrors.jurisdictionCode = 'Invalid jurisdiction format';
        isValid = false;
      }
    } else {
      if (!formData.county) {
        newErrors.county = 'Please select a county';
        isValid = false;
      }
    }
    if (!formData.caseType) {
      newErrors.caseType = 'Please select a case type';
      isValid = false;
    }
    if (formData.filingType === 'subsequent' && !formData.existingCaseNumber) {
      newErrors.existingCaseNumber = 'Please enter the existing case number';
      isValid = false;
    }
    if (!formData.attorneyId) {
      newErrors.attorneyId = 'Please enter an attorney ID';
      isValid = false;
    }
    if (!formData.files || formData.files.length === 0) {
      newErrors.files = 'Please upload at least one document';
      isValid = false;
    }

    // Phase A: Enhanced validations
    if (ENHANCED_EFILING_PHASE_A) {
      // Payment account validation
      if (!formData.paymentAccountId) {
        newErrors.paymentAccountId = 'Please select a payment account';
        isValid = false;
      }

      // Petitioner validation
      if (formData.petitioner) {
        if (formData.petitioner.type === 'business') {
          if (!formData.petitioner.businessName?.trim()) {
            newErrors['petitioner.businessName'] = 'Business name is required';
            isValid = false;
          }
        } else {
          if (!formData.petitioner.firstName?.trim()) {
            newErrors['petitioner.firstName'] = 'First name is required';
            isValid = false;
          }
          if (!formData.petitioner.lastName?.trim()) {
            newErrors['petitioner.lastName'] = 'Last name is required';
            isValid = false;
          }
        }

        // ZIP code validation
        if (formData.petitioner.zipCode && !/^\d{5}(-\d{4})?$/.test(formData.petitioner.zipCode)) {
          newErrors['petitioner.zipCode'] = 'Valid ZIP code required';
          isValid = false;
        }
      }

      // Defendants validation
      if (formData.defendants?.length > 0) {
        const defendant = formData.defendants[0];
        if (!defendant.firstName?.trim()) {
          newErrors['defendants.0.firstName'] = 'First name is required';
          isValid = false;
        }
        if (!defendant.lastName?.trim()) {
          newErrors['defendants.0.lastName'] = 'Last name is required';
          isValid = false;
        }
        // ZIP code validation for defendant
        if (defendant.zipCode && !/^\d{5}(-\d{4})?$/.test(defendant.zipCode)) {
          newErrors['defendants.0.zipCode'] = 'Valid ZIP code required';
          isValid = false;
        }
      }

      // Amount in controversy validation (required for certain case types)
      const requiresAmount = ['174140', '174141', '174143'].includes(formData.caseType);
      if (requiresAmount && (!formData.amountInControversy || parseFloat(formData.amountInControversy) <= 0)) {
        newErrors.amountInControversy = 'Amount in controversy is required for this case type';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    try {
      // Get auth token
      const token = await ensureAuth(state.authToken, state.tokenExpires, dispatch);
      
      // Create a draft in the context before sending
      const draftId = uuidv4();
      const draftData = {
        jurisdiction: formData.jurisdiction,
        county: formData.county,
        caseNumber: formData.existingCaseNumber || 'NEW',
        attorneyId: formData.attorneyId,
        files: Array.from(formData.files as FileList).map(file => ({
          id: uuidv4(),
          name: file.name,
          size: file.size,
          type: file.type
        }))
      };
      
      // Save draft for offline recovery
      dispatch({
        type: 'SAVE_DRAFT',
        draft: {
          draftId,
          formData: draftData,
          savedAt: new Date().toISOString(),
          caseId: formData.existingCaseNumber || formData.referenceId,
          autoSaved: true
        }
      });
      
      // Process files with proper error handling
      try {
        // Process files into EFileDocument array
        const files: EFileDocument[] = await Promise.all(
          Array.from(formData.files as FileList).map(file =>
            fileToBase64(file)
              .then(b64 => ({
                code: 'document',
                description: file.name,
                file: b64,
                file_name: file.name,
                doc_type: '189705', // Document type code for eviction complaint
              }))
              .catch(error => {
                // Add specific file error to the form
                throw new Error(`Error processing file ${file.name}: ${error.message}`);
              })
          )
        );
        
        // Create case parties for Phase A enhanced filing
        const caseParties = ENHANCED_EFILING_PHASE_A && formData.petitioner && formData.defendants?.length > 0 ? [
          // Petitioner (business or individual)
          {
            id: 'Party_25694092',
            type: '189138', // Petitioner type code
            ...(formData.petitioner.type === 'business' ? {
              business_name: formData.petitioner.businessName,
              is_business: 'true'
            } : {
              first_name: formData.petitioner.firstName,
              last_name: formData.petitioner.lastName,
              is_business: 'false'
            }),
            address_line_1: formData.petitioner.addressLine1,
            city: formData.petitioner.city,
            state: formData.petitioner.state,
            zip_code: formData.petitioner.zipCode,
            lead_attorney: formData.attorneyId
          },
          // Defendant
          {
            id: 'Party_60273353',
            type: '189131', // Defendant type code
            first_name: formData.defendants[0].firstName,
            last_name: formData.defendants[0].lastName,
            address_line_1: formData.defendants[0].addressLine1,
            city: formData.defendants[0].city,
            state: formData.defendants[0].state,
            zip_code: formData.defendants[0].zipCode,
            is_business: 'false'
          }
        ] : undefined;

        // Create a properly typed submission payload
        const payload: EFileSubmission = {
          reference_id: formData.referenceId,
          jurisdiction: ENHANCED_EFILING_PHASE_B ? formData.jurisdictionCode! : `${formData.county}:cvd1`,
          case_category: '7', // Category code for evictions
          case_type: formData.caseType,
          case_parties: caseParties,
          filings: files,
          filing_type: 'EFile',
          payment_account_id: ENHANCED_EFILING_PHASE_A ? (formData.paymentAccountId || 'demo') : 'demo',
          filing_attorney_id: formData.attorneyId,
          filing_party_id: 'Party_25694092',
          ...(ENHANCED_EFILING_PHASE_A && formData.amountInControversy && {
            amount_in_controversy: formData.amountInControversy,
            show_amount_in_controversy: formData.showAmountInControversy ? 'true' : 'false'
          }),
          is_initial_filing: formData.filingType === 'initial',
          ...(formData.filingType === 'subsequent' && {
            cross_references: [{ type: 'CASE_NUMBER', number: formData.existingCaseNumber }]
          })
        };
        
        // Add audit log entry for submission attempt
        if (state.userPermissions.includes('efile:submit')) {
          mutation.mutate({ payload, token });
        } else {
          throw new Error('You do not have permission to submit e-filings.');
        }
      } catch (fileErr) {
        // Handle file processing errors
        console.error('File processing error:', fileErr);
        
        // Add to system notifications
        dataDispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            notificationId: uuidv4(),
            title: 'Filing error',
            message: fileErr instanceof Error ? fileErr.message : 'Error processing file',
            type: 'System',
            priority: 'High',
            isRead: false,
            entityType: 'Filing',
            entityId: formData.existingCaseNumber || formData.referenceId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
        
        // Show error toast
        addToast({
          type: 'error',
          title: 'File Processing Error',
          message: fileErr instanceof Error ? fileErr.message : 'There was an error processing your files. Please ensure they are valid PDFs or DOCXs under 10MB.',
          duration: 8000
        });
        
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Submission error:', err);
      
      // Show a specific error message based on the type of error
      let errorMessage = 'There was an error submitting your eFiling.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Add to system notifications
      dataDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          notificationId: uuidv4(),
          title: 'Filing error',
          message: errorMessage,
          type: 'System',
          priority: 'High',
          isRead: false,
          entityType: 'Filing',
          entityId: formData.existingCaseNumber || formData.referenceId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      
      // Show error toast
      addToast({
        type: 'error',
        title: 'Submission Error',
        message: errorMessage,
        duration: 8000
      });
      
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} noValidate>
        <Select
          name="jurisdiction"
          label="State or Jurisdiction"
          options={jurisdictions}
          value={formData.jurisdiction}
          onChange={handleSelectChange('jurisdiction')}
          required
          error={errors.jurisdiction}
        />
        {ENHANCED_EFILING_PHASE_B ? (
          <Select
            name="jurisdictionCode"
            label="Jurisdiction"
            options={JURISDICTIONS.map((j: Jurisdiction) => ({
              value: j.code,
              label: j.label
            }))}
            value={formData.jurisdictionCode}
            onChange={handleSelectChange('jurisdictionCode')}
            required
            error={errors.jurisdictionCode}
            data-cy="jurisdiction-select"
          />
        ) : (
          <Select
            name="county"
            label="County"
            options={counties[formData.jurisdiction as keyof typeof counties] || []}
            value={formData.county}
            onChange={handleSelectChange('county')}
            required
            error={errors.county}
          />
        )}
        <Select
          name="filingType"
          label="Filing Type"
          options={filingTypes}
          value={formData.filingType}
          onChange={handleSelectChange('filingType')}
          required
          error={errors.filingType}
        />
        <Select
          name="caseType"
          label="Case Type"
          options={caseTypes}
          value={formData.caseType}
          onChange={handleSelectChange('caseType')}
          required
          error={errors.caseType}
        />
        {formData.filingType === 'subsequent' && (
          <Input
            name="existingCaseNumber"
            label="Existing Case Number"
            type="text"
            value={formData.existingCaseNumber}
            onChange={handleInputChange}
            placeholder="Enter existing case number"
            required
            error={errors.existingCaseNumber}
          />
        )}
        <Input
          name="attorneyId"
          label="Attorney ID"
          type="text"
          value={formData.attorneyId}
          onChange={handleInputChange}
          placeholder="Enter attorney ID"
          required
          error={errors.attorneyId}
        />
        
        {/* Phase A: Enhanced E-Filing Fields */}
        {ENHANCED_EFILING_PHASE_A && (
          <>
            {/* 1. Payment Account Selection */}
            <div className="mb-4">
              <Select
                name="paymentAccountId"
                label="Payment Account"
                options={accounts.map(account => ({ value: account.id, label: account.name }))}
                value={formData.paymentAccountId}
                onChange={handleSelectChange('paymentAccountId')}
                required
                error={errors.paymentAccountId}
                disabled={accountsLoading}
                data-cy="payment-account-select"
              />
              {accountsError && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md" role="alert">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">{accountsError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Petitioner Section */}
            <Card className="p-4 mb-4" data-cy="petitioner-card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Petitioner Information</h3>
              
              {/* Business/Individual Toggle */}
              <div className="mb-4">
                <fieldset>
                  <legend className="text-sm font-medium text-gray-700 mb-2">Petitioner Type</legend>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="business"
                        checked={formData.petitioner?.type === 'business'}
                        onChange={() => handlePetitionerTypeChange('business')}
                        className="mr-2"
                      />
                      Business Entity
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="individual"
                        checked={formData.petitioner?.type === 'individual'}
                        onChange={() => handlePetitionerTypeChange('individual')}
                        className="mr-2"
                      />
                      Individual
                    </label>
                  </div>
                </fieldset>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Conditional Name Fields */}
                {formData.petitioner?.type === 'business' ? (
                  <div className="sm:col-span-2">
                    <Input
                      name="businessName"
                      label="Business Name"
                      value={formData.petitioner?.businessName || ''}
                      onChange={handlePetitionerChange('businessName')}
                      required
                      error={errors['petitioner.businessName']}
                      data-cy="petitioner-business-name"
                    />
                  </div>
                ) : (
                  <>
                    <Input
                      name="firstName"
                      label="First Name"
                      value={formData.petitioner?.firstName || ''}
                      onChange={handlePetitionerChange('firstName')}
                      required
                      error={errors['petitioner.firstName']}
                      data-cy="petitioner-first-name"
                    />
                    <Input
                      name="lastName"
                      label="Last Name"
                      value={formData.petitioner?.lastName || ''}
                      onChange={handlePetitionerChange('lastName')}
                      required
                      error={errors['petitioner.lastName']}
                      data-cy="petitioner-last-name"
                    />
                  </>
                )}

                {/* Address Fields */}
                <div className="sm:col-span-2">
                  <Input
                    name="addressLine1"
                    label="Address Line 1"
                    value={formData.petitioner?.addressLine1 || ''}
                    onChange={handlePetitionerChange('addressLine1')}
                    required
                    data-cy="petitioner-address"
                  />
                </div>
                <Input
                  name="city"
                  label="City"
                  value={formData.petitioner?.city || ''}
                  onChange={handlePetitionerChange('city')}
                  required
                  data-cy="petitioner-city"
                />
                <Input
                  name="state"
                  label="State"
                  value={formData.petitioner?.state || ''}
                  onChange={handlePetitionerChange('state')}
                  required
                  data-cy="petitioner-state"
                />
                <Input
                  name="zipCode"
                  label="ZIP Code"
                  value={formData.petitioner?.zipCode || ''}
                  onChange={handlePetitionerChange('zipCode')}
                  required
                  error={errors['petitioner.zipCode']}
                  aria-describedby={errors['petitioner.zipCode'] ? 'petitioner-zip-error' : undefined}
                  data-cy="petitioner-zip"
                />
                {errors['petitioner.zipCode'] && (
                  <p id="petitioner-zip-error" className="text-sm text-red-600" role="alert">
                    {errors['petitioner.zipCode']}
                  </p>
                )}
              </div>
            </Card>

            {/* 3. Defendant Section */}
            <Card className="p-4 mb-4" data-cy="defendant-card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Defendant Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  name="firstName"
                  label="First Name"
                  value={formData.defendants[0]?.firstName || ''}
                  onChange={handleDefendantChange('firstName')}
                  required
                  error={errors['defendants.0.firstName']}
                  data-cy="defendant-first-name"
                />
                <Input
                  name="lastName"
                  label="Last Name"
                  value={formData.defendants[0]?.lastName || ''}
                  onChange={handleDefendantChange('lastName')}
                  required
                  error={errors['defendants.0.lastName']}
                  data-cy="defendant-last-name"
                />
                <div className="sm:col-span-2">
                  <Input
                    name="addressLine1"
                    label="Address Line 1"
                    value={formData.defendants[0]?.addressLine1 || ''}
                    onChange={handleDefendantChange('addressLine1')}
                    required
                    data-cy="defendant-address"
                  />
                </div>
                <Input
                  name="city"
                  label="City"
                  value={formData.defendants[0]?.city || ''}
                  onChange={handleDefendantChange('city')}
                  required
                  data-cy="defendant-city"
                />
                <Input
                  name="state"
                  label="State"
                  value={formData.defendants[0]?.state || ''}
                  onChange={handleDefendantChange('state')}
                  required
                  data-cy="defendant-state"
                />
                <Input
                  name="zipCode"
                  label="ZIP Code"
                  value={formData.defendants[0]?.zipCode || ''}
                  onChange={handleDefendantChange('zipCode')}
                  required
                  error={errors['defendants.0.zipCode']}
                  aria-describedby={errors['defendants.0.zipCode'] ? 'defendant-zip-error' : undefined}
                  data-cy="defendant-zip"
                />
                {errors['defendants.0.zipCode'] && (
                  <p id="defendant-zip-error" className="text-sm text-red-600" role="alert">
                    {errors['defendants.0.zipCode']}
                  </p>
                )}
              </div>
            </Card>

            {/* 4. Amount in Controversy (conditional on case type) */}
            {['174140', '174141', '174143'].includes(formData.caseType) && (
              <div className="mb-4">
                <Input
                  type="number"
                  name="amountInControversy"
                  label="Amount in Controversy"
                  value={formData.amountInControversy}
                  onChange={handleInputChange}
                  placeholder="Enter dollar amount"
                  error={errors.amountInControversy}
                  data-cy="amount-in-controversy"
                />
                <div className="mt-2">
                  <label className="flex items-center">
                    <input
                      id="showAmount"
                      type="checkbox"
                      checked={formData.showAmountInControversy}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        showAmountInControversy: e.target.checked 
                      }))}
                      className="mr-2"
                      data-cy="show-amount-checkbox"
                    />
                    Show amount on filing
                  </label>
                </div>
              </div>
            )}
          </>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Documents <span className="text-error-600">*</span>
          </label>
          <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${errors.files ? 'border-error-500' : 'border-gray-300'} border-dashed rounded-md`}>
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500">
                  <span>Upload files</span>
                  <input id="file-upload" name="files" type="file" multiple className="sr-only" onChange={handleFileChange} required />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF, DOCX up to 10MB each</p>
            </div>
          </div>
          {errors.files && <p className="mt-1 text-sm text-error-600">{errors.files}</p>}
          {formData.files && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">{Array.from(formData.files).length} file(s) selected</p>
              <ul className="mt-1 text-xs text-gray-500">
                {Array.from(formData.files).map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="mt-6">
          <Button type="submit" variant="primary" fullWidth disabled={isSubmitting || isSavingCase}>
            {isSubmitting ? (
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting to Court...
              </span>
            ) : isSavingCase ? (
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Case Record...
              </span>
            ) : (
              'Submit eFile Batch'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default EFileSubmissionForm;