import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { File, AlertCircle, Loader } from 'lucide-react';
import DocumentList from './DocumentList';
import Card from '../ui/Card';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';

/**
 * Document Overview component
 * Shows document categories and recent documents
 */
const DocumentOverview: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch document counts by type
  useEffect(() => {
    const fetchDocumentCounts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get counts for each document type
        const types = ['Complaint', 'Summons', 'Motion', 'Order', 'Affidavit', 'Other'];
        const countPromises = types.map(type => 
          supabase
            .from('documents')
            .select('id', { count: 'exact' })
            .eq('type', type)
        );
        
        const results = await Promise.all(countPromises);
        
        // Build counts object
        const counts: Record<string, number> = {};
        results.forEach((result, index) => {
          if (result.error) throw result.error;
          counts[types[index]] = result.count || 0;
        });
        
        setDocumentCounts(counts);
      } catch (err) {
        console.error('❌ DocumentOverview error:', err);
        if (err instanceof Error) {
          console.error('   message:', err.message);
          console.error('   details:', (err as any).details || 'no details');
          console.error('   hint:', (err as any).hint || 'no hint');
          console.error('   code:', (err as any).code || 'no code');
        }
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        
        // Show error toast
        addToast({
          type: 'error',
          title: 'Error Loading Document Counts',
          message: errorObj.message || 'Failed to load document counts. Please try again.',
          duration: 5000
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocumentCounts();
  }, [addToast]);
  
  // Error display component
  const ErrorMessage = () => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
      <div className="flex">
        <AlertCircle size={20} className="text-red-500 mr-2" />
        <div>
          <h3 className="text-sm font-medium text-red-800">Error loading document data</h3>
          <p className="text-sm text-red-700 mt-1">
            {typeof error === 'string' ? error : error?.message || 'Failed to load document counts. Please try again.'}
          </p>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="space-y-6">
      {error && <ErrorMessage />}
      
      {/* Document Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/documents/list?type=Complaint')}>
          <div className="flex items-center">
            <div className="bg-primary-100 p-3 rounded-lg">
              <File className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium">Complaints</h3>
              <p className="text-sm text-neutral-500">
                Case filings and complaints
                {!isLoading && documentCounts['Complaint'] !== undefined && (
                  <span className="ml-2 text-primary-600">
                    ({documentCounts['Complaint']})
                  </span>
                )}
                {isLoading && <Loader size={12} className="inline ml-2 animate-spin" />}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/documents/list?type=Summons')}>
          <div className="flex items-center">
            <div className="bg-success-100 p-3 rounded-lg">
              <File className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium">Summons</h3>
              <p className="text-sm text-neutral-500">
                Summons and notices
                {!isLoading && documentCounts['Summons'] !== undefined && (
                  <span className="ml-2 text-success-600">
                    ({documentCounts['Summons']})
                  </span>
                )}
                {isLoading && <Loader size={12} className="inline ml-2 animate-spin" />}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/documents/list?type=Other')}>
          <div className="flex items-center">
            <div className="bg-secondary-100 p-3 rounded-lg">
              <File className="h-6 w-6 text-secondary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium">Other Documents</h3>
              <p className="text-sm text-neutral-500">
                Motions, orders, and other filings
                {!isLoading && (
                  <span className="ml-2 text-secondary-600">
                    ({(documentCounts['Motion'] || 0) + 
                      (documentCounts['Order'] || 0) + 
                      (documentCounts['Affidavit'] || 0) + 
                      (documentCounts['Other'] || 0)})
                  </span>
                )}
                {isLoading && <Loader size={12} className="inline ml-2 animate-spin" />}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Recent Documents */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Documents</h2>
        <DocumentList limit={5} />
      </div>
    </div>
  );
};

export default DocumentOverview;