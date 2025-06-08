import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface DraftData {
  id: string;
  data: any;
  createdAt: string;
}

const EFileDrafts: React.FC<{ onLoadDraft: (data: any) => void }> = ({ onLoadDraft }) => {
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = () => {
    const savedDrafts = JSON.parse(localStorage.getItem('efileDrafts') || '[]');
    setDrafts(savedDrafts.reverse()); // Show newest first
  };

  const handleLoadDraft = (draft: DraftData) => {
    onLoadDraft(draft.data);
    addToast({
      type: 'success',
      title: 'Draft Loaded',
      message: 'Draft loaded successfully. Please re-upload any files.',
      duration: 5000
    });
  };

  const handleDeleteDraft = (draftId: string) => {
    const updatedDrafts = drafts.filter(d => d.id !== draftId);
    localStorage.setItem('efileDrafts', JSON.stringify(updatedDrafts.reverse()));
    setDrafts(updatedDrafts);
    addToast({
      type: 'success',
      title: 'Draft Deleted',
      message: 'Draft has been deleted.',
      duration: 3000
    });
  };

  const handleClearAllDrafts = () => {
    if (window.confirm('Are you sure you want to delete all drafts?')) {
      localStorage.removeItem('efileDrafts');
      setDrafts([]);
      addToast({
        type: 'success',
        title: 'All Drafts Cleared',
        message: 'All drafts have been deleted.',
        duration: 3000
      });
    }
  };

  if (drafts.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <p>No saved drafts found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-neutral-900">Saved Drafts ({drafts.length})</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleClearAllDrafts}
          className="text-red-600 hover:text-red-700"
        >
          Clear All Drafts
        </Button>
      </div>
      
      <div className="space-y-3">
        {drafts.map((draft) => (
          <Card key={draft.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="text-sm text-neutral-600 mb-1">
                  Saved on: {new Date(draft.createdAt).toLocaleString()}
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Case Type:</span> {draft.data.caseType || 'Not selected'}</p>
                  <p><span className="font-medium">Attorney ID:</span> {draft.data.attorneyId || 'Not entered'}</p>
                  {draft.data.petitioner?.businessName && (
                    <p><span className="font-medium">Petitioner:</span> {draft.data.petitioner.businessName}</p>
                  )}
                  {draft.data.petitioner?.firstName && (
                    <p><span className="font-medium">Petitioner:</span> {draft.data.petitioner.firstName} {draft.data.petitioner.lastName}</p>
                  )}
                  {draft.data.defendants?.length > 0 && (
                    <p><span className="font-medium">Defendants:</span> {draft.data.defendants.length} defendant(s)</p>
                  )}
                  {draft.data.files?.length > 0 && (
                    <p><span className="font-medium">Files:</span> {draft.data.files.length} file(s) (need to re-upload)</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleLoadDraft(draft)}
                >
                  Load Draft
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDeleteDraft(draft.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EFileDrafts;