import React, { useState, useContext, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { EFileContext } from '@/context/EFileContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { ensureAuth, fileToBase64, submitFiling, validateFile } from '@/utils/efile';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface FormData {
  jurisdiction: string;
  county: string;
  caseNumber: string;
  attorneyId: string;
  files: FileList | null;
}

interface FormErrors {
  jurisdiction?: string;
  county?: string;
  caseNumber?: string;
  attorneyId?: string;
  files?: string;
}

const EFileSubmissionForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    jurisdiction: 'il',
    county: 'cook',
    caseNumber: '',
    attorneyId: '',
    files: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state, dispatch } = useContext(EFileContext);
  const { dispatch: dataDispatch } = useData();
  const { addToast } = useToast();
  
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

  const mutation = useMutation(
    ({ payload, token }: { payload: Record<string, unknown>; token: string }) => submitFiling(payload, token),
    {
      onSuccess: data => {
        dispatch({ type: 'ADD_ENVELOPE', caseId: formData.caseNumber, envelopeId: data.item.id });
        
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
        setFormData({ jurisdiction: 'il', county: 'cook', caseNumber: '', attorneyId: '', files: null });
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
            entityId: formData.caseNumber,
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
    },
  );

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
    if (!formData.jurisdiction) {
      newErrors.jurisdiction = 'Please select a jurisdiction';
      isValid = false;
    }
    if (!formData.county) {
      newErrors.county = 'Please select a county';
      isValid = false;
    }
    if (!formData.caseNumber) {
      newErrors.caseNumber = 'Please enter a case number';
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
        caseNumber: formData.caseNumber,
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
          caseId: formData.caseNumber,
          autoSaved: true
        }
      });
      
      // Process files with proper error handling
      try {
        const files = await Promise.all(
          Array.from(formData.files as FileList).map(file =>
            fileToBase64(file)
              .then(b64 => ({
                code: 'document',
                description: file.name,
                file: b64,
                file_name: file.name,
                doc_type: '189705',
              }))
              .catch(error => {
                // Add specific file error to the form
                throw new Error(`Error processing file ${file.name}: ${error.message}`);
              })
          )
        );
        
        const payload: Record<string, unknown> = {
          reference_id: draftId,
          jurisdiction: `${formData.county}:cvd1`,
          case_category: '7',
          case_type: formData.caseNumber,
          filings: files,
          payment_account_id: 'demo',
          filing_attorney_id: formData.attorneyId,
          filing_party_id: 'Party_25694092',
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
            entityId: formData.caseNumber,
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
          entityId: formData.caseNumber,
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
          onChange={handleInputChange}
          required
          error={errors.jurisdiction}
        />
        <Select
          name="county"
          label="County"
          options={counties[formData.jurisdiction as keyof typeof counties] || []}
          value={formData.county}
          onChange={handleInputChange}
          required
          error={errors.county}
        />
        <Input
          name="caseNumber"
          label="Case Number"
          type="text"
          value={formData.caseNumber}
          onChange={handleInputChange}
          placeholder="Enter case number"
          required
          error={errors.caseNumber}
        />
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
          <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
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