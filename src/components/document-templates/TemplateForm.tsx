import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { v4 as uuidv4 } from 'uuid';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { DocumentTemplate } from '../../types/schema';
import { AlertCircle, Info, Tag, HelpCircle } from 'lucide-react';

interface TemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string | null;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ isOpen, onClose, templateId }) => {
  const { state, dispatch } = useData();
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'variables'>('content');
  const [showVariableHelper, setShowVariableHelper] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Other' as DocumentTemplate['category'],
    content: '',
    variables: [] as string[],
    isActive: true,
  });

  // New variable input state
  const [newVariable, setNewVariable] = useState('');

  // Find existing template if editing
  useEffect(() => {
    if (templateId) {
      const existingTemplate = state.documentTemplates.find(t => t.templateId === templateId);
      if (existingTemplate) {
        setForm({
          name: existingTemplate.name,
          description: existingTemplate.description || '',
          category: existingTemplate.category,
          content: existingTemplate.content,
          variables: existingTemplate.variables || [],
          isActive: existingTemplate.isActive,
        });
      }
    }
  }, [templateId, state.documentTemplates]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: checked }));
  };

  const addVariable = () => {
    if (!newVariable.trim()) {
      setFormError('Variable name cannot be empty');
      return;
    }
    
    // Check if variable already exists
    if (form.variables.includes(newVariable.trim())) {
      setFormError('Variable already exists');
      return;
    }
    
    // Add the variable
    setForm(prev => ({
      ...prev,
      variables: [...prev.variables, newVariable.trim()],
    }));
    setNewVariable('');
    setFormError(null);
  };

  const removeVariable = (variable: string) => {
    setForm(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable),
    }));
  };

  const insertVariable = (variable: string) => {
    // Insert the variable at the current cursor position
    const textarea = document.getElementById('templateContent') as HTMLTextAreaElement;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const textBefore = form.content.substring(0, cursorPos);
      const textAfter = form.content.substring(textarea.selectionEnd);
      
      const newContent = `${textBefore}{{${variable}}}${textAfter}`;
      setForm(prev => ({ ...prev, content: newContent }));
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = cursorPos + variable.length + 4; // +4 for the '{{}}'
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const insertCaseField = (field: string) => {
    // Insert case-specific field
    const textarea = document.getElementById('templateContent') as HTMLTextAreaElement;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const textBefore = form.content.substring(0, cursorPos);
      const textAfter = form.content.substring(textarea.selectionEnd);
      
      const newContent = `${textBefore}{{case.${field}}}${textAfter}`;
      setForm(prev => ({ ...prev, content: newContent }));
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = cursorPos + field.length + 8; // +8 for the '{{case.}}'
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleSubmit = () => {
    // Form validation
    if (!form.name) {
      setFormError('Template name is required');
      return;
    }

    if (!form.content) {
      setFormError('Template content is required');
      return;
    }

    const now = new Date().toISOString();
    
    if (templateId) {
      // Update existing template
      const updatedTemplate: DocumentTemplate = {
        ...state.documentTemplates.find(t => t.templateId === templateId)!,
        name: form.name,
        description: form.description,
        category: form.category,
        content: form.content,
        variables: form.variables.length > 0 ? form.variables : undefined,
        isActive: form.isActive,
        updatedAt: now,
      };
      
      dispatch({ type: 'UPDATE_DOCUMENT_TEMPLATE', payload: updatedTemplate });
    } else {
      // Create new template
      const newTemplate: DocumentTemplate = {
        templateId: uuidv4(),
        name: form.name,
        description: form.description,
        category: form.category,
        content: form.content,
        variables: form.variables.length > 0 ? form.variables : undefined,
        isActive: form.isActive,
        createdAt: now,
        updatedAt: now,
      };
      
      dispatch({ type: 'ADD_DOCUMENT_TEMPLATE', payload: newTemplate });
    }
    
    onClose();
  };

  // Category options
  const categoryOptions = [
    { value: 'Complaint', label: 'Complaint' },
    { value: 'Summons', label: 'Summons' },
    { value: 'Notice', label: 'Notice' },
    { value: 'Motion', label: 'Motion' },
    { value: 'Order', label: 'Order' },
    { value: 'Letter', label: 'Letter' },
    { value: 'Agreement', label: 'Agreement' },
    { value: 'Other', label: 'Other' },
  ];

  // Available case fields
  const caseFields = [
    { field: 'caseId', description: 'Unique case identifier' },
    { field: 'plaintiff', description: 'Plaintiff name' },
    { field: 'defendant', description: 'Defendant name' },
    { field: 'address', description: 'Property address' },
    { field: 'status', description: 'Current case status' },
    { field: 'intakeDate', description: 'Initial intake date' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={templateId ? 'Edit Document Template' : 'Create Document Template'}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name*
            </label>
            <Input
              name="name"
              value={form.name}
              onChange={handleInputChange}
              placeholder="Enter template name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category*
            </label>
            <Select
              name="category"
              value={form.category}
              onChange={handleInputChange}
              options={categoryOptions}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleInputChange}
            placeholder="Describe this template"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            rows={2}
          />
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('content')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'content'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Template Content
            </button>
            <button
              onClick={() => setActiveTab('variables')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'variables'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Variables
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {form.variables.length}
              </span>
            </button>
          </nav>
        </div>
        
        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Template Content*
              </label>
              <Button
                variant="text"
                size="sm"
                icon={<HelpCircle size={16} />}
                onClick={() => setShowVariableHelper(!showVariableHelper)}
              >
                {showVariableHelper ? 'Hide Help' : 'Show Help'}
              </Button>
            </div>
            
            {showVariableHelper && (
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex items-start">
                  <Info size={20} className="text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Template Variables</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Use variables by wrapping them in double curly braces, like: <code>{'{{variableName}}'}</code>
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Case fields are available automatically using: <code>{'{{case.fieldName}}'}</code>
                    </p>
                    
                    <div className="mt-3">
                      <h5 className="font-medium text-blue-800 text-sm">Available Case Fields</h5>
                      <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {caseFields.map(cf => (
                          <button 
                            key={cf.field}
                            onClick={() => insertCaseField(cf.field)}
                            className="text-left text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded flex items-center justify-between"
                          >
                            <span><code>{'{{case.' + cf.field + '}}'}</code></span>
                            <span className="text-blue-700">{cf.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {form.variables.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium text-blue-800 text-sm">Your Variables</h5>
                        <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {form.variables.map(variable => (
                            <button 
                              key={variable}
                              onClick={() => insertVariable(variable)}
                              className="text-left text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
                            >
                              <code>{'{{' + variable + '}}'}</code>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <textarea
              id="templateContent"
              name="content"
              value={form.content}
              onChange={handleInputChange}
              placeholder="Enter the template content here..."
              className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-primary-500 focus:border-primary-500"
              rows={15}
            />
          </div>
        )}
        
        {/* Variables Tab */}
        {activeTab === 'variables' && (
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-md">
              <div className="flex">
                <Info size={20} className="text-yellow-500 mr-3 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  Define the variables that users will be able to fill in when generating documents from this template.
                  Variables can be used in the template content by surrounding them with double curly braces, like <code>{'{{variableName}}'}</code>.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <Input
                name="newVariable"
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                placeholder="New variable name"
                className="flex-1 mr-2"
              />
              <Button
                onClick={addVariable}
                icon={<Plus size={16} />}
              >
                Add
              </Button>
            </div>
            
            {form.variables.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variable Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {form.variables.map((variable) => (
                      <tr key={variable}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <Tag size={16} className="text-gray-400 mr-2" />
                            <code>{'{{' + variable + '}}'}</code>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => removeVariable(variable)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50 rounded-md">
                <p className="text-gray-500">No variables defined yet.</p>
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={form.isActive}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
            Template is active and available for use
          </label>
        </div>

        {formError && (
          <div className="text-red-500 text-sm flex items-center">
            <AlertCircle size={16} className="mr-1" />
            {formError}
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-5 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
          >
            {templateId ? 'Save Template' : 'Create Template'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TemplateForm;