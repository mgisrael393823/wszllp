import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, AlertCircle, Loader, File, Scale, FileCheck } from 'lucide-react';
import DocumentList from './DocumentList';
import { ActionListCard, MetricCard } from '../ui';
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

  // Calculate total documents
  const totalDocuments = Object.values(documentCounts).reduce((sum, count) => sum + count, 0);
  
  // Calculate other documents count
  const otherDocumentsCount = (documentCounts['Motion'] || 0) + 
                            (documentCounts['Order'] || 0) + 
                            (documentCounts['Affidavit'] || 0) + 
                            (documentCounts['Other'] || 0);

  // Create document category items for ActionListCard
  const documentCategoryItems = [
    {
      id: 'complaints',
      icon: FileText,
      title: 'Complaints',
      subtitle: 'Case filings and initial complaints',
      value: isLoading ? '...' : String(documentCounts['Complaint'] || 0),
      onClick: () => navigate('/documents/list?type=Complaint')
    },
    {
      id: 'summons',
      icon: Scale,
      title: 'Summons',
      subtitle: 'Court summons and legal notices',
      value: isLoading ? '...' : String(documentCounts['Summons'] || 0),
      onClick: () => navigate('/documents/list?type=Summons')
    },
    {
      id: 'motions',
      icon: FileCheck,
      title: 'Motions',
      subtitle: 'Filed motions and responses',
      value: isLoading ? '...' : String(documentCounts['Motion'] || 0),
      onClick: () => navigate('/documents/list?type=Motion')
    },
    {
      id: 'orders',
      icon: Scale,
      title: 'Orders',
      subtitle: 'Court orders and rulings',
      value: isLoading ? '...' : String(documentCounts['Order'] || 0),
      onClick: () => navigate('/documents/list?type=Order')
    },
    {
      id: 'other',
      icon: File,
      title: 'Other Documents',
      subtitle: 'Affidavits and miscellaneous filings',
      value: isLoading ? '...' : String(otherDocumentsCount),
      onClick: () => navigate('/documents/list?type=Other')
    }
  ];
  
  // Error display component
  const ErrorMessage = () => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
      <div className="flex">
        <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
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
      
      {/* Document Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Documents"
          value={isLoading ? '...' : String(totalDocuments)}
          icon={FileText}
          subtitle="All document types"
        />
        <MetricCard
          title="Complaints Filed"
          value={isLoading ? '...' : String(documentCounts['Complaint'] || 0)}
          icon={Scale}
          subtitle="Active complaints"
          onClick={() => navigate('/documents/list?type=Complaint')}
        />
        <MetricCard
          title="Pending Review"
          value="0"
          icon={AlertCircle}
          subtitle="Requires attention"
          trend={{ value: "No pending", isPositive: true }}
        />
      </div>
      
      {/* Document Categories using ActionListCard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActionListCard
          title="Document Categories"
          description="Browse documents by type"
          items={documentCategoryItems}
          showDividers={true}
        />
        
        {/* Recent Documents */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Documents</h2>
          <DocumentList limit={5} />
        </div>
      </div>
    </div>
  );
};

export default DocumentOverview;