import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import Button from '../ui/Button';
import { StatusCard } from '../ui/StatusCard';
import { FileText, Calendar, User, Users } from 'lucide-react';

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
        {drafts.map((draft) => {
          // Prepare metadata for StatusCard
          const metadata = [
            {
              label: 'Saved',
              value: new Date(draft.createdAt).toLocaleDateString()
            },
            {
              label: 'Case Type',
              value: draft.data.caseType || 'Not selected'
            },
            {
              label: 'Attorney ID',
              value: draft.data.attorneyId || 'Not entered'
            }
          ];

          // Add petitioner info if available
          if (draft.data.petitioner?.businessName) {
            metadata.push({
              label: 'Petitioner',
              value: draft.data.petitioner.businessName
            });
          } else if (draft.data.petitioner?.firstName) {
            metadata.push({
              label: 'Petitioner',
              value: `${draft.data.petitioner.firstName} ${draft.data.petitioner.lastName}`
            });
          }

          // Add defendant count if available
          if (draft.data.defendants?.length > 0) {
            metadata.push({
              label: 'Defendants',
              value: `${draft.data.defendants.length} defendant(s)`
            });
          }

          // Add file count with warning if files need re-upload
          if (draft.data.files?.length > 0) {
            metadata.push({
              label: 'Files',
              value: `${draft.data.files.length} file(s) (need to re-upload)`
            });
          }

          return (
            <StatusCard
              key={draft.id}
              title={`Draft #${draft.id.slice(-8)}`}
              status="draft"
              subtitle="E-filing draft ready to load"
              metadata={metadata}
              actions={[
                {
                  label: 'Load Draft',
                  variant: 'primary',
                  onClick: () => handleLoadDraft(draft)
                },
                {
                  label: 'Delete',
                  variant: 'secondary',
                  onClick: () => handleDeleteDraft(draft.id)
                }
              ]}
            />
          );
        })}
      </div>
    </div>
  );
};

export default EFileDrafts;