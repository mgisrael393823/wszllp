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
import { Card } from '../ui/shadcn-card';
import { ENHANCED_EFILING_PHASE_A, ENHANCED_EFILING_PHASE_B } from '@/config/features';
import { JURISDICTIONS, type Jurisdiction } from '@/config/jurisdictions';
import { TYLER_CONFIG } from '@/config/tyler-api';

interface PaymentAccount { 
  id: string; 
  name: string; 
}

interface Attorney {
  id: string;
  firmId: string;
  barNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  displayName: string;
}

export function useAttorneys() {
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAttorneys() {
      try {
        // Use production URL if in development to bypass proxy issues
        const apiUrl = import.meta.env.DEV 
          ? 'https://wszllp.vercel.app/api/tyler/attorneys'
          : '/api/tyler/attorneys';
        const res = await fetch(apiUrl);
        
        // Check if response has content
        const contentType = res.headers.get('content-type');
        const hasJson = contentType && contentType.includes('application/json');
        
        if (!hasJson) {
          throw new Error('Invalid response format');
        }
        
        const data = await res.json();
        if (res.ok) {
          setAttorneys(data.attorneys || []);
          setError(data.error || null);
        } else {
          throw new Error(data.error || 'Failed to load attorneys');
        }
      } catch (err) {
        console.error('Error fetching attorneys:', err);
        setError((err as Error).message);
        // Provide a minimal fallback
        setAttorneys([{ 
          id: 'error', 
          displayName: 'Failed to load attorneys',
          firmId: '',
          barNumber: '',
          firstName: '',
          middleName: '',
          lastName: ''
        }]);
      } finally {
        setLoading(false);
      }
    }
    fetchAttorneys();
  }, []);

  return { attorneys, loading, error };
}

export function usePaymentAccounts() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        // Use production URL if in development to bypass proxy issues
        const apiUrl = import.meta.env.DEV 
          ? 'https://wszllp.vercel.app/api/tyler/payment-accounts'
          : '/api/tyler/payment-accounts';
        const res = await fetch(apiUrl);
        
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
    addressLine2?: string; // Added address line 2
    city: string;
    state: string;
    zipCode: string;
    leadAttorneyId?: string;
  };
  // FIXED: Use defendants array instead of single defendant
  defendants: Array<{
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string; // Added address line 2
    city: string;
    state: string;
    zipCode: string;
  }>;
  // Separate file uploads for each document type
  complaintFile: File | null;
  summonsFiles: File[]; // Multiple summons files
  affidavitFile: File | null;
  // Cross references
  crossReferenceType?: string;
  crossReferenceNumber?: string;
  // Unknown Occupants toggle
  includeUnknownOccupants: boolean;
  files: FileList | null; // Keep for backward compatibility
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
  'petitioner.leadAttorneyId'?: string;
  'defendants.0.firstName'?: string;
  'defendants.0.lastName'?: string;
  'defendants.0.zipCode'?: string;
  complaintFile?: string;
  summonsFiles?: string;
  affidavitFile?: string;
  crossReferenceType?: string;
  crossReferenceNumber?: string;
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
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      leadAttorneyId: ''
    },
    // FIXED: Initialize defendants as array
    defendants: [{
      firstName: '',
      lastName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: ''
    }],
    complaintFile: null,
    summonsFiles: [],
    affidavitFile: null,
    crossReferenceType: '',
    crossReferenceNumber: '',
    includeUnknownOccupants: false,
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
  const { attorneys, loading: attorneysLoading, error: attorneysError } = useAttorneys();

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
    if (!caseId || !tylerData?.item) return;

    try {
      // Collect all files from the new individual file fields
      const allFiles: { file: File; type: string }[] = [];
      
      if (formData.complaintFile) {
        allFiles.push({ file: formData.complaintFile, type: 'complaint' });
      }
      
      formData.summonsFiles.forEach(file => {
        allFiles.push({ file, type: 'summons' });
      });
      
      if (formData.affidavitFile) {
        allFiles.push({ file: formData.affidavitFile, type: 'affidavit' });
      }
      
      // Create document records for each filed document
      const documentPromises = allFiles.map(async ({ file, type }, index) => {
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
            docType: filing.code || type,
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
    // Check if a draft should be loaded (from drafts page)
    const draftToLoad = localStorage.getItem('efileDraftsToLoad');
    if (draftToLoad) {
      const draftData = JSON.parse(draftToLoad);
      localStorage.removeItem('efileDraftsToLoad');
      
      setFormData({
        ...draftData,
        // Reconstruct file objects (note: actual file data is lost, user will need to re-upload)
        complaintFile: null,
        summonsFiles: [],
        affidavitFile: null,
        files: null,
        // Keep cross references from draft
        crossReferenceType: draftData.crossReferenceType || '',
        crossReferenceNumber: draftData.crossReferenceNumber || ''
      });
      
      return; // Don't show the toast if loading from drafts page
    }
    
    // Check localStorage for drafts
    const savedDrafts = JSON.parse(localStorage.getItem('efileDrafts') || '[]');
    
    if (savedDrafts.length > 0) {
      addToast({
        type: 'info',
        title: 'Saved Drafts Available',
        message: `You have ${savedDrafts.length} saved draft${savedDrafts.length > 1 ? 's' : ''}. Check the Saved Drafts section above to load them.`,
        duration: 8000
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
          addressLine2: '', // Include address line 2 in reset
          city: '',
          state: '',
          zipCode: '',
          leadAttorneyId: ''
        },
        // Reset defendants array
        defendants: [{
          firstName: '',
          lastName: '',
          addressLine1: '',
          addressLine2: '', // Include address line 2 in reset
          city: '',
          state: 'IL',
          zipCode: ''
        }],
        // Reset individual file uploads
        complaintFile: null,
        summonsFiles: [],
        affidavitFile: null,
        // Reset cross references
        crossReferenceType: '',
        crossReferenceNumber: '',
        includeUnknownOccupants: false,
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
    } else if (name === 'attorneyId') {
      // When attorney ID changes, auto-populate cross reference if Cook County Attorney Code is selected
      setFormData(prev => ({
        ...prev,
        [name]: value,
        // Auto-populate cross reference number if type is Cook County Attorney Code
        ...(prev.crossReferenceType === '190864' && { crossReferenceNumber: value })
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
    } else if (name === 'crossReferenceType' && value === '190864') {
      // When Cook County Attorney Code is selected, auto-populate with attorney ID
      setFormData(prev => ({
        ...prev,
        [name]: value,
        crossReferenceNumber: prev.attorneyId || ''
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

  const handleDefendantChange = (index: number, field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      defendants: prev.defendants.map((defendant, i) => 
        i === index ? { ...defendant, [field]: e.target.value } : defendant
      )
    }));
    // Clear validation errors for this field
    const errorKey = `defendants.${index}.${field}` as keyof FormErrors;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const addDefendant = () => {
    setFormData(prev => ({
      ...prev,
      defendants: [...prev.defendants, {
        firstName: '',
        lastName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: ''
      }]
    }));
  };

  const removeDefendant = (index: number) => {
    if (formData.defendants.length > 1) {
      setFormData(prev => ({
        ...prev,
        defendants: prev.defendants.filter((_, i) => i !== index)
      }));
    }
  };

  const handlePetitionerSelectChange = (field: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      petitioner: {
        ...prev.petitioner!,
        [field]: value
      }
    }));
    // Clear validation errors for this field
    const errorKey = `petitioner.${field}` as keyof FormErrors;
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

  const handleSingleFileChange = (fileType: 'complaintFile' | 'affidavitFile') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setErrors(prev => ({ ...prev, [fileType]: validation.error }));
        e.target.value = '';
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [fileType]: file }));
    if (errors[fileType]) {
      setErrors(prev => ({ ...prev, [fileType]: undefined }));
    }
  };

  const handleSummonsFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setErrors(prev => ({ ...prev, summonsFiles: validation.error }));
        e.target.value = '';
        return;
      }
      
      setFormData(prev => ({ 
        ...prev, 
        summonsFiles: [...prev.summonsFiles, file] 
      }));
      
      if (errors.summonsFiles) {
        setErrors(prev => ({ ...prev, summonsFiles: undefined }));
      }
      
      // Clear the input
      e.target.value = '';
    }
  };

  const removeSummonsFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      summonsFiles: prev.summonsFiles.filter((_, i) => i !== index)
    }));
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
    // File validation - require documents based on case type
    if (!formData.complaintFile) {
      newErrors.complaintFile = 'Please upload the eviction complaint';
      isValid = false;
    }
    // Summons is optional for all case types
    // Affidavit is optional for all case types
    
    // Cross reference validation for user input
    if (formData.crossReferenceNumber?.trim() && 
        !formData.crossReferenceType?.trim()) {
      newErrors.crossReferenceType = 'Cross reference type is required when number is provided';
      isValid = false;
    }

    if (formData.crossReferenceNumber?.trim() && 
        !/^\d{3,20}$/.test(formData.crossReferenceNumber.trim())) {
      newErrors.crossReferenceNumber = 'Cross reference number must be 3-20 digits';
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

        // Lead attorney validation
        if (!formData.petitioner.leadAttorneyId?.trim()) {
          newErrors['petitioner.leadAttorneyId'] = 'Lead attorney is required';
          isValid = false;
        }
      }

      // Defendants validation - validate all defendants
      if (formData.defendants?.length > 0) {
        formData.defendants.forEach((defendant, index) => {
          if (!defendant.firstName?.trim()) {
            newErrors[`defendants.${index}.firstName` as keyof FormErrors] = 'First name is required';
            isValid = false;
          }
          if (!defendant.lastName?.trim()) {
            newErrors[`defendants.${index}.lastName` as keyof FormErrors] = 'Last name is required';
            isValid = false;
          }
          // ZIP code validation for defendant
          if (defendant.zipCode && !/^\d{5}(-\d{4})?$/.test(defendant.zipCode)) {
            newErrors[`defendants.${index}.zipCode` as keyof FormErrors] = 'Valid ZIP code required';
            isValid = false;
          }
        });
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
      
      // Collect all files for the draft
      const draftFiles: any[] = [];
      if (formData.complaintFile) {
        draftFiles.push({
          id: uuidv4(),
          name: formData.complaintFile.name,
          size: formData.complaintFile.size,
          type: formData.complaintFile.type
        });
      }
      formData.summonsFiles.forEach(file => {
        draftFiles.push({
          id: uuidv4(),
          name: file.name,
          size: file.size,
          type: file.type
        });
      });
      if (formData.affidavitFile) {
        draftFiles.push({
          id: uuidv4(),
          name: formData.affidavitFile.name,
          size: formData.affidavitFile.size,
          type: formData.affidavitFile.type
        });
      }
      
      const draftData = {
        jurisdiction: formData.jurisdiction,
        county: formData.county,
        caseNumber: formData.existingCaseNumber || 'NEW',
        attorneyId: formData.attorneyId,
        files: draftFiles
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
        // Process individual files into EFileDocument array
        const files: EFileDocument[] = [];
        
        // Process complaint file with case-type-specific filing codes
        if (formData.complaintFile) {
          const complaintB64 = await fileToBase64(formData.complaintFile);
          
          // Determine filing code and description based on case type
          let filingCode: string;
          let description: string;
          
          switch (formData.caseType) {
            case '237042': // Residential Joint Action Jury
            case '237037': // Residential Joint Action Non-Jury
              filingCode = TYLER_CONFIG.FILING_CODES.COMPLAINT.RESIDENTIAL_JOINT;
              description = 'Complaint / Petition - Eviction - Residential - Joint Action';
              break;
            case '201996': // Commercial Joint Action Jury
            case '201995': // Commercial Joint Action Non-Jury
              filingCode = TYLER_CONFIG.FILING_CODES.COMPLAINT.COMMERCIAL_JOINT;
              description = 'Complaint / Petition - Eviction - Commercial - Joint Action';
              break;
            case '237041': // Residential Possession Jury
            case '237036': // Residential Possession Non-Jury
              filingCode = TYLER_CONFIG.FILING_CODES.COMPLAINT.RESIDENTIAL_POSSESSION;
              description = 'Complaint / Petition - Eviction - Residential - Possession';
              break;
            case '201992': // Commercial Possession Jury
            case '201991': // Commercial Possession Non-Jury
              filingCode = TYLER_CONFIG.FILING_CODES.COMPLAINT.COMMERCIAL_POSSESSION;
              description = 'Complaint / Petition - Eviction - Commercial - Possession';
              break;
            default:
              // Fallback to residential joint action
              filingCode = TYLER_CONFIG.FILING_CODES.COMPLAINT.RESIDENTIAL_JOINT;
              description = 'Complaint / Petition - Eviction - Residential - Joint Action';
          }
          
          // Build the complaint filing document
          const fileDoc: any = {
            code: filingCode,
            description: description,
            file: `base64://${complaintB64}`,
            file_name: formData.complaintFile.name,
            doc_type: TYLER_CONFIG.DOC_TYPE
          };
          
          // Cook County requires $5 per defendant at filing time
          const defendantCount = formData.defendants.length + (formData.includeUnknownOccupants ? 1 : 0);
          fileDoc.optional_services = [{ quantity: defendantCount.toString(), code: '282616' }];
          
          files.push(fileDoc);
        }
        
        // Process all summons files
        for (const summonsFile of formData.summonsFiles) {
          const summonsB64 = await fileToBase64(summonsFile);
          files.push({
            code: TYLER_CONFIG.FILING_CODES.SUMMONS,
            description: 'Summons - Issued And Returnable',
            file: `base64://${summonsB64}`,
            file_name: summonsFile.name,
            doc_type: TYLER_CONFIG.DOC_TYPE
          });
        }
        
        // Process affidavit file
        if (formData.affidavitFile) {
          const affidavitB64 = await fileToBase64(formData.affidavitFile);
          files.push({
            code: TYLER_CONFIG.FILING_CODES.AFFIDAVIT,
            description: 'Affidavit Filed',
            file: `base64://${affidavitB64}`,
            file_name: formData.affidavitFile.name,
            doc_type: TYLER_CONFIG.DOC_TYPE
          });
        }
        
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
            address_line_1: formData.petitioner.addressLine1 || '',
            address_line_2: formData.petitioner.addressLine2 || '',
            city: formData.petitioner.city || '',
            state: formData.petitioner.state || '',
            zip_code: formData.petitioner.zipCode || '',
            phone_number: '',
            email: '',
            lead_attorney: formData.petitioner.leadAttorneyId
          },
          // Map all defendants
          ...formData.defendants.map((defendant, index) => ({
            id: `Party_${60273353 + index}`,
            type: '189131', // Defendant type code
            first_name: defendant.firstName,
            last_name: defendant.lastName,
            address_line_1: defendant.addressLine1 || '',
            address_line_2: defendant.addressLine2 || '',
            city: defendant.city || '',
            state: defendant.state || '',
            zip_code: defendant.zipCode || '',
            is_business: 'false',
            phone_number: '',
            email: ''
          })),
          // Unknown Occupants (conditionally included as last defendant)
          ...(formData.includeUnknownOccupants ? [{
            id: 'Party_10518212',
            type: '189131', // Defendant type code
            first_name: 'All',
            last_name: 'Unknown Occupants',
            address_line_1: formData.defendants[0].addressLine1 || '', // Use same address as primary defendant
            address_line_2: formData.defendants[0].addressLine2 || '',
            city: formData.defendants[0].city || '',
            state: formData.defendants[0].state || '',
            zip_code: formData.defendants[0].zipCode || '',
            is_business: 'false',
            phone_number: '',
            email: ''
          }] : [])
        ] : undefined;

        // Create a properly typed submission payload WITHOUT cross_references
        const payload: any = {
          reference_id: formData.referenceId,
          jurisdiction: ENHANCED_EFILING_PHASE_B ? formData.jurisdictionCode! : `${formData.county}:cvd1`,
          case_category: TYLER_CONFIG.CASE_CATEGORY,
          case_type: formData.caseType,
          case_parties: caseParties,
          filings: files,
          filing_type: 'EFile',
          payment_account_id: ENHANCED_EFILING_PHASE_A ? (formData.paymentAccountId || 'demo') : 'demo',
          filing_attorney_id: ENHANCED_EFILING_PHASE_A && formData.petitioner?.leadAttorneyId ? formData.petitioner.leadAttorneyId : formData.attorneyId,
          filing_party_id: 'Party_25694092',
          amount_in_controversy: formData.amountInControversy || '',
          show_amount_in_controversy: formData.showAmountInControversy ? 'true' : 'false',
          is_initial_filing: formData.filingType === 'initial'
        };
        
        // Debug cross reference values
        // console.log('Cross Reference Debug:', {
        //   type: formData.crossReferenceType,
        //   typeLength: formData.crossReferenceType?.length,
        //   number: formData.crossReferenceNumber,
        //   numberLength: formData.crossReferenceNumber?.length,
        //   typeTrimmed: formData.crossReferenceType?.trim(),
        //   numberTrimmed: formData.crossReferenceNumber?.trim()
        // });
        
        // helpers -----------------------------------------------------------------
        const jointActionTypes = ['237037', '237042', '201996', '201995'];

        // build cross_references *once* ------------------------------------------
        let crossRefNumber: string | undefined;
        let crossRefCode: string | undefined;

        // Check user input FIRST (they can override the default)
        if (
          formData.crossReferenceNumber?.trim() &&
          formData.crossReferenceType?.trim() &&
          /^\d{3,20}$/.test(formData.crossReferenceNumber.trim())
        ) {
          crossRefNumber = formData.crossReferenceNumber.trim();
          crossRefCode = formData.crossReferenceType.trim();
        }
        // THEN fallback to 44113 for joint actions if no user input
        else if (jointActionTypes.includes(payload.case_type)) {
          crossRefNumber = TYLER_CONFIG.ATTORNEY_CROSS_REF;
          crossRefCode = TYLER_CONFIG.CROSS_REF_CODE;
        }

        // 3️⃣ attach only when we have a valid number AND code
        if (crossRefNumber && crossRefCode) {
          payload.cross_references = [{ number: crossRefNumber, code: crossRefCode }];
          // Cross-reference applied: { number: crossRefNumber, code: crossRefCode }
        }
        
        // Log the payload for debugging
        // E-File Submission Payload
        // Cross references in payload: payload.cross_references
        
        // Debug filing codes
        // ===== DEBUGGING FILING CODES =====
        // console.log('Total filings:', payload.filings.length);
        // console.log('Filing codes being sent:');
        // payload.filings.forEach((filing: any, index: number) => {
        //   console.log(`Filing ${index + 1}:`, {
        //     code: filing.code,
        //     description: filing.description,
        //     file_name: filing.file_name,
        //     doc_type: filing.doc_type
        //   });
        // });
        
        // Check for any filing with code "332"
        const problematicFiling = payload.filings.find((f: any) => f.code === "332");
        if (problematicFiling) {
          console.error('❌ FOUND FILING WITH CODE 332:', problematicFiling);
          console.error('This filing has file name:', problematicFiling.file_name);
        }
        
        // Also log the formData to see what's being submitted
        // console.log('Form data case type:', formData.caseType);
        // console.log('Files being processed:', {
        //   complaint: formData.complaintFile?.name,
        //   summons: formData.summonsFiles.map(f => f.name),
        //   affidavit: formData.affidavitFile?.name
        // });
        
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

  const handleSaveDraft = () => {
    try {
      // Create a draft ID
      const draftId = uuidv4();
      
      // Collect all files for the draft
      const draftFiles: any[] = [];
      if (formData.complaintFile) {
        draftFiles.push({
          id: uuidv4(),
          name: formData.complaintFile.name,
          size: formData.complaintFile.size,
          type: formData.complaintFile.type
        });
      }
      formData.summonsFiles.forEach(file => {
        draftFiles.push({
          id: uuidv4(),
          name: file.name,
          size: file.size,
          type: file.type
        });
      });
      if (formData.affidavitFile) {
        draftFiles.push({
          id: uuidv4(),
          name: formData.affidavitFile.name,
          size: formData.affidavitFile.size,
          type: formData.affidavitFile.type
        });
      }
      
      // Save the entire form data as a draft
      const draftData = {
        ...formData,
        files: draftFiles,
        savedAt: new Date().toISOString()
      };
      
      // Save to localStorage
      const existingDrafts = JSON.parse(localStorage.getItem('efileDrafts') || '[]');
      existingDrafts.push({
        id: draftId,
        data: draftData,
        createdAt: new Date().toISOString()
      });
      
      // Keep only the last 5 drafts
      if (existingDrafts.length > 5) {
        existingDrafts.shift();
      }
      
      localStorage.setItem('efileDrafts', JSON.stringify(existingDrafts));
      
      // Show success message
      addToast({
        type: 'success',
        title: 'Draft Saved',
        message: 'Your e-filing draft has been saved successfully.',
        duration: 3000
      });
      
      // Also save to context if available
      dispatch({
        type: 'SAVE_DRAFT',
        draft: {
          draftId,
          formData: draftData,
          savedAt: new Date().toISOString(),
          caseId: formData.existingCaseNumber || formData.referenceId,
          autoSaved: false
        }
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save draft. Please try again.',
        duration: 5000
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
        <div>
          <Select
            name="caseType"
            label="Case Type"
            options={caseTypes}
            value={formData.caseType}
            onChange={handleSelectChange('caseType')}
            required
            error={errors.caseType}
          />
          {(formData.caseType === '237042' || formData.caseType === '237037' || 
            formData.caseType === '201996' || formData.caseType === '201995') && (
            <p className="mt-1 text-sm text-blue-600">
              Note: Joint Action cases require a case reference number. If you don't provide one in the Cross References section below, a temporary reference will be auto-generated.
            </p>
          )}
        </div>
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
        
        {/* Cross References Section - Optional */}
        <Card className="p-4 mb-4" data-cy="cross-references-card">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">
            Case Cross References 
            <span className="text-sm font-normal text-neutral-500 ml-2">
              {(formData.caseType === '237042' || formData.caseType === '237037' || 
                formData.caseType === '201996' || formData.caseType === '201995') 
                ? '(Required for Joint Action - leave blank to auto-generate)'
                : '(Optional)'}
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              name="crossReferenceType"
              label="Cross Reference Type"
              options={[
                { value: '', label: 'Select a type (optional)' },
                { value: '190860', label: 'Case Number' },
                { value: '190861', label: 'Prior Case' },
                { value: '190862', label: 'Related Case' },
                { value: '190863', label: 'Appeal Case' }
              ]}
              value={formData.crossReferenceType}
              onChange={handleSelectChange('crossReferenceType')}
              error={errors.crossReferenceType}
              data-cy="cross-reference-type"
            />
            <Input
              name="crossReferenceNumber"
              label="Cross Reference ID"
              type="text"
              value={formData.crossReferenceNumber}
              onChange={handleInputChange}
              placeholder="Enter reference number (optional)"
              error={errors.crossReferenceNumber}
              data-cy="cross-reference-number"
            />
          </div>
        </Card>
        
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
              <h3 className="text-lg font-medium text-neutral-900 mb-4">Petitioner Information</h3>
              
              {/* Business/Individual Toggle */}
              <div className="mb-4">
                <fieldset>
                  <legend className="text-sm font-medium text-neutral-700 mb-2">Petitioner Type</legend>
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
                    label="Address Line 1 (Optional)"
                    value={formData.petitioner?.addressLine1 || ''}
                    onChange={handlePetitionerChange('addressLine1')}
                    data-cy="petitioner-address"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    name="addressLine2"
                    label="Address Line 2 (Optional)"
                    value={formData.petitioner?.addressLine2 || ''}
                    onChange={handlePetitionerChange('addressLine2')}
                    data-cy="petitioner-address-2"
                  />
                </div>
                <Input
                  name="city"
                  label="City (Optional)"
                  value={formData.petitioner?.city || ''}
                  onChange={handlePetitionerChange('city')}
                  data-cy="petitioner-city"
                />
                <Input
                  name="state"
                  label="State (Optional)"
                  value={formData.petitioner?.state || ''}
                  onChange={handlePetitionerChange('state')}
                  data-cy="petitioner-state"
                />
                <Input
                  name="zipCode"
                  label="ZIP Code (Optional)"
                  value={formData.petitioner?.zipCode || ''}
                  onChange={handlePetitionerChange('zipCode')}
                  error={errors['petitioner.zipCode']}
                  aria-describedby={errors['petitioner.zipCode'] ? 'petitioner-zip-error' : undefined}
                  data-cy="petitioner-zip"
                />
                {errors['petitioner.zipCode'] && (
                  <p id="petitioner-zip-error" className="text-sm text-red-600" role="alert">
                    {errors['petitioner.zipCode']}
                  </p>
                )}
                
                {/* Lead Attorney Selection */}
                <div className="sm:col-span-2">
                  <div className="mb-4">
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="leadAttorneyId" className="block text-sm font-medium text-neutral-700">
                          Lead Attorney <span className="text-error-600">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            // TODO: Implement add attorney modal
                            addToast({
                              type: 'info',
                              title: 'Add Attorney',
                              message: 'Attorney management feature coming soon',
                              duration: 3000
                            });
                          }}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          + Add Attorney
                        </button>
                      </div>
                      <Select
                        name="leadAttorneyId"
                        options={attorneys.map(attorney => ({ 
                          value: attorney.id, 
                          label: attorney.displayName 
                        }))}
                        value={formData.petitioner?.leadAttorneyId || ''}
                        onChange={handlePetitionerSelectChange('leadAttorneyId')}
                        required
                        error={errors['petitioner.leadAttorneyId']}
                        disabled={attorneysLoading}
                        data-cy="lead-attorney-select"
                      />
                    </div>
                    {attorneysError && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md" role="alert">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700">{attorneysError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Defendant Section */}
            <Card className="p-4 mb-4" data-cy="defendant-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-neutral-900">Defendant Information</h3>
                <button
                  type="button"
                  onClick={addDefendant}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  data-cy="add-defendant-button"
                >
                  + Add Another Defendant
                </button>
              </div>
              
              {formData.defendants.map((defendant, index) => (
                <div key={index} className="mb-6 p-4 border border-neutral-200 rounded-md">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-neutral-700">Defendant {index + 1}</h4>
                    {formData.defendants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDefendant(index)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      name="firstName"
                      label="First Name"
                      value={defendant.firstName || ''}
                      onChange={handleDefendantChange(index, 'firstName')}
                      required
                      error={errors[`defendants.${index}.firstName` as keyof FormErrors]}
                      data-cy={`defendant-${index}-first-name`}
                    />
                    <Input
                      name="lastName"
                      label="Last Name"
                      value={defendant.lastName || ''}
                      onChange={handleDefendantChange(index, 'lastName')}
                      required
                      error={errors[`defendants.${index}.lastName` as keyof FormErrors]}
                      data-cy={`defendant-${index}-last-name`}
                    />
                    <div className="sm:col-span-2">
                      <Input
                        name="addressLine1"
                        label="Address Line 1 (Optional)"
                        value={defendant.addressLine1 || ''}
                        onChange={handleDefendantChange(index, 'addressLine1')}
                        data-cy={`defendant-${index}-address`}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        name="addressLine2"
                        label="Address Line 2 (Optional)"
                        value={defendant.addressLine2 || ''}
                        onChange={handleDefendantChange(index, 'addressLine2')}
                        data-cy={`defendant-${index}-address-2`}
                      />
                    </div>
                    <Input
                      name="city"
                      label="City (Optional)"
                      value={defendant.city || ''}
                      onChange={handleDefendantChange(index, 'city')}
                      data-cy={`defendant-${index}-city`}
                    />
                    <Input
                      name="state"
                      label="State (Optional)"
                      value={defendant.state || ''}
                      onChange={handleDefendantChange(index, 'state')}
                      data-cy={`defendant-${index}-state`}
                    />
                    <Input
                      name="zipCode"
                      label="ZIP Code (Optional)"
                      value={defendant.zipCode || ''}
                      onChange={handleDefendantChange(index, 'zipCode')}
                      error={errors[`defendants.${index}.zipCode` as keyof FormErrors]}
                      aria-describedby={errors[`defendants.${index}.zipCode` as keyof FormErrors] ? `defendant-${index}-zip-error` : undefined}
                      data-cy={`defendant-${index}-zip`}
                    />
                    {errors[`defendants.${index}.zipCode` as keyof FormErrors] && (
                      <p id={`defendant-${index}-zip-error`} className="text-sm text-red-600" role="alert">
                        {errors[`defendants.${index}.zipCode` as keyof FormErrors]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Unknown Occupants Option */}
              <div className="mt-6 p-4 bg-neutral-50 rounded-md border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-neutral-700">Include Unknown Occupants</h4>
                    <p className="mt-1 text-xs text-neutral-500">
                      Add "All Unknown Occupants" as an additional defendant to ensure proper notice to all parties
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.includeUnknownOccupants}
                      onChange={(e) => setFormData(prev => ({ ...prev, includeUnknownOccupants: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                {formData.includeUnknownOccupants && (
                  <div className="mt-3 p-3 bg-white rounded border border-neutral-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-neutral-600">Name:</span>
                        <span className="ml-2 text-neutral-900">All Unknown Occupants</span>
                      </div>
                      <div>
                        <span className="font-medium text-neutral-600">Address:</span>
                        <span className="ml-2 text-neutral-900">Same as primary defendant</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* 4. Amount in Controversy */}
            <div className="mb-4">
              <Input
                type="number"
                name="amountInControversy"
                label="Amount in Controversy"
                value={formData.amountInControversy}
                onChange={handleInputChange}
                placeholder="Enter dollar amount (e.g., 5000.00)"
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
          </>
        )}

        {/* Document Upload Section - Three separate uploads */}
        <Card className="p-4 mb-4" data-cy="documents-card">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Required Documents</h3>
          
          {/* Complaint Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Upload Eviction Complaint <span className="text-error-600">*</span>
            </label>
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${errors.complaintFile ? 'border-error-500' : 'border-neutral-300'} border-dashed rounded-md`}>
              {!formData.complaintFile ? (
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-neutral-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-neutral-600">
                    <label htmlFor="complaint-upload" className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500">
                      <span>Upload complaint</span>
                      <input id="complaint-upload" name="complaint" type="file" className="sr-only" onChange={handleSingleFileChange('complaintFile')} accept=".pdf,.docx" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-neutral-500">PDF or DOCX up to 10MB</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-green-600">✓ {formData.complaintFile.name}</p>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, complaintFile: null }))}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            {errors.complaintFile && <p className="mt-1 text-sm text-error-600">{errors.complaintFile}</p>}
          </div>

          {/* Summons Upload - Multiple Files Optional */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-neutral-700">
                Upload Summons <span className="text-sm font-normal text-neutral-500">(Optional - Multiple allowed)</span>
              </label>
              <span className="text-sm text-neutral-500">
                {formData.summonsFiles.length} file{formData.summonsFiles.length !== 1 ? 's' : ''} uploaded
              </span>
            </div>
            
            {/* Show uploaded summons files */}
            {formData.summonsFiles.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.summonsFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-md">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-neutral-900">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSummonsFile(index)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Upload new summons */}
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${errors.summonsFiles ? 'border-error-500' : 'border-neutral-300'} border-dashed rounded-md`}>
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-neutral-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-neutral-600">
                  <label htmlFor="summons-upload" className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500">
                    <span>Add summons file</span>
                    <input id="summons-upload" name="summons" type="file" className="sr-only" onChange={handleSummonsFileAdd} accept=".pdf,.docx" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-neutral-500">PDF or DOCX up to 10MB each</p>
              </div>
            </div>
            {errors.summonsFiles && <p className="mt-1 text-sm text-error-600">{errors.summonsFiles}</p>}
          </div>

          {/* Affidavit Upload - Optional */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Upload Affidavit <span className="text-sm font-normal text-neutral-500">(Optional)</span>
            </label>
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${errors.affidavitFile ? 'border-error-500' : 'border-neutral-300'} border-dashed rounded-md`}>
              {!formData.affidavitFile ? (
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-neutral-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-neutral-600">
                    <label htmlFor="affidavit-upload" className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500">
                      <span>Upload affidavit</span>
                      <input id="affidavit-upload" name="affidavit" type="file" className="sr-only" onChange={handleSingleFileChange('affidavitFile')} accept=".pdf,.docx" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-neutral-500">PDF or DOCX up to 10MB</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-green-600">✓ {formData.affidavitFile.name}</p>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, affidavitFile: null }))}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            {errors.affidavitFile && <p className="mt-1 text-sm text-error-600">{errors.affidavitFile}</p>}
          </div>
        </Card>
        <div className="mt-6 space-y-3">
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
          <Button 
            type="button" 
            variant="secondary" 
            fullWidth 
            onClick={handleSaveDraft}
            disabled={isSubmitting || isSavingCase}
          >
            Save as Draft
          </Button>
        </div>
    </form>
  );
};

export default EFileSubmissionForm;