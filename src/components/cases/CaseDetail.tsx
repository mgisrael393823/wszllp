import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { format } from 'date-fns';
import { ArrowLeft, Plus, Calendar, FileText } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import HearingForm from '../hearings/HearingForm';
import DocumentForm from '../documents/DocumentForm';

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useData();
  const [isHearingModalOpen, setIsHearingModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

  const caseData = state.cases.find(c => c.caseId === id);
  const caseHearings = state.hearings.filter(h => h.caseId === id);
  const caseDocuments = state.documents.filter(d => d.caseId === id);

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Case not found</h2>
        <p className="mt-2 text-gray-600">The requested case could not be found.</p>
        <Button
          variant="outline"
          onClick={() => navigate('/cases')}
          className="mt-4"
          icon={<ArrowLeft size={16} />}
        >
          Back to Cases
        </Button>
      </div>
    );
  }

  const hearingColumns = [
    {
      header: 'Court',
      accessor: 'courtName',
      sortable: true,
    },
    {
      header: 'Date',
      accessor: (item: typeof state.hearings[0]) => 
        format(new Date(item.hearingDate), 'MMM d, yyyy'),
      sortable: true,
    },
    {
      header: 'Time',
      accessor: (item: typeof state.hearings[0]) => 
        format(new Date(item.hearingDate), 'h:mm a'),
      sortable: false,
    },
    {
      header: 'Outcome',
      accessor: (item: typeof state.hearings[0]) => 
        item.outcome || 'Pending',
      sortable: false,
    },
  ];

  const documentColumns = [
    {
      header: 'Type',
      accessor: 'type',
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (item: typeof state.documents[0]) => (
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
              item.status === 'Served' ? 'bg-green-100 text-green-800' : 
                'bg-red-100 text-red-800'}`
          }
        >
          {item.status}
        </span>
      ),
      sortable: false,
    },
    {
      header: 'Service Date',
      accessor: (item: typeof state.documents[0]) => 
        item.serviceDate ? format(new Date(item.serviceDate), 'MMM d, yyyy') : 'Not served',
      sortable: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/cases')}
          icon={<ArrowLeft size={16} />}
        >
          Back to Cases
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {caseData.plaintiff} v. {caseData.defendant}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Case ID: {caseData.caseId}
          </p>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Case Details</h3>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${caseData.status === 'Intake' ? 'bg-blue-100 text-blue-800' : 
                        caseData.status === 'Active' ? 'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'}`
                    }
                  >
                    {caseData.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.address}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Intake Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(caseData.intakeDate), 'MMMM d, yyyy')}
                </dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-blue-900 flex items-center gap-2">
                  <Calendar size={16} />
                  Upcoming Hearings
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-blue-900">
                  {caseHearings.filter(h => new Date(h.hearingDate) > new Date()).length}
                </dd>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-green-900 flex items-center gap-2">
                  <FileText size={16} />
                  Active Documents
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-green-900">
                  {caseDocuments.filter(d => d.status === 'Pending').length}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Hearings</h3>
            <Button
              onClick={() => setIsHearingModalOpen(true)}
              icon={<Plus size={16} />}
              size="sm"
            >
              Add Hearing
            </Button>
          </div>
          
          <Table
            data={caseHearings}
            columns={hearingColumns}
            keyField="hearingId"
            emptyMessage="No hearings scheduled yet."
          />
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Documents</h3>
            <Button
              onClick={() => setIsDocumentModalOpen(true)}
              icon={<Plus size={16} />}
              size="sm"
            >
              Add Document
            </Button>
          </div>
          
          <Table
            data={caseDocuments}
            columns={documentColumns}
            keyField="docId"
            emptyMessage="No documents added yet."
          />
        </Card>
      </div>

      {isHearingModalOpen && (
        <HearingForm
          isOpen={isHearingModalOpen}
          onClose={() => setIsHearingModalOpen(false)}
          hearingId={null}
          defaultCaseId={id}
        />
      )}

      {isDocumentModalOpen && (
        <DocumentForm
          isOpen={isDocumentModalOpen}
          onClose={() => setIsDocumentModalOpen(false)}
          docId={null}
          defaultCaseId={id}
        />
      )}
    </div>
  );
};

export default CaseDetail;