import React, { useState, useContext } from 'react';
import { useMutation } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { EFileContext } from '@/context/EFileContext';
import { ensureAuth, fileToBase64, submitFiling } from '@/utils/efile';
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

  const mutation = useMutation(
    ({ payload, token }: { payload: any; token: string }) => submitFiling(payload, token),
    {
      onSuccess: data => {
        dispatch({ type: 'ADD_ENVELOPE', caseId: formData.caseNumber, envelopeId: data.item.id });
        setFormData({ jurisdiction: 'il', county: 'cook', caseNumber: '', attorneyId: '', files: null });
        alert('eFiling submitted successfully!');
      },
      onError: err => {
        console.error(err);
        alert('There was an error submitting your eFiling.');
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
      const token = await ensureAuth(state.authToken, state.tokenExpires, dispatch);
      const files = await Promise.all(
        Array.from(formData.files as FileList).map(file =>
          fileToBase64(file).then(b64 => ({
            code: 'document',
            description: file.name,
            file: b64,
            file_name: file.name,
            doc_type: '189705',
          }))
        )
      );
      const payload = {
        reference_id: uuidv4(),
        jurisdiction: `${formData.county}:cvd1`,
        case_category: '7',
        case_type: formData.caseNumber,
        filings: files,
        payment_account_id: 'demo',
        filing_attorney_id: formData.attorneyId,
        filing_party_id: 'Party_25694092',
      } as any;
      mutation.mutate({ payload, token });
    } catch (err) {
      console.error(err);
      alert('There was an error submitting your eFiling.');
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
