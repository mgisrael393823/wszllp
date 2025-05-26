import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { format, parseISO, isValid } from 'date-fns';
import { ArrowLeft, Plus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import InvoiceForm from './InvoiceForm';
import PaymentPlanForm from './PaymentPlanForm';
import { formatCurrency } from '../../utils/utils';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useData();
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentPlanModalOpen, setIsPaymentPlanModalOpen] = useState(false);

  const invoice = state.invoices.find(i => i.invoiceId === id);
  const associatedCase = invoice ? state.cases.find(c => c.caseId === invoice.caseId) : null;
  const paymentPlans = state.paymentPlans.filter(p => p.invoiceId === id);

  if (!invoice || !associatedCase) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Invoice not found</h2>
        <p className="mt-2 text-gray-600">The requested invoice could not be found.</p>
        <Button
          variant="outline"
          onClick={() => navigate('/invoices')}
          className="mt-4"
          icon={<ArrowLeft size={16} />}
        >
          Back to Invoices
        </Button>
      </div>
    );
  }

  const paymentPlanColumns = [
    {
      header: 'Due Date',
      accessor: (item: typeof state.paymentPlans[0]) => {
        const date = typeof item.installmentDate === 'string'
          ? parseISO(item.installmentDate)
          : item.installmentDate instanceof Date
          ? item.installmentDate
          : null;
        return date && isValid(date)
          ? format(date, 'MMM d, yyyy')
          : 'Invalid Date';
      },
      sortable: true,
    },
    {
      header: 'Amount',
      accessor: (item: typeof state.paymentPlans[0]) => formatCurrency(item.amount),
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (item: typeof state.paymentPlans[0]) => (
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${item.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`
          }
        >
          {item.paid ? 'Paid' : 'Unpaid'}
        </span>
      ),
      sortable: false,
    },
  ];

  // Calculate total paid amount
  const totalPaid = paymentPlans
    .filter(p => p.paid)
    .reduce((sum, plan) => sum + plan.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/invoices')}
          icon={<ArrowLeft size={16} />}
        >
          Back to Invoices
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Invoice for {associatedCase.plaintiff} v. {associatedCase.defendant}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Invoice ID: {invoice.invoiceId}
          </p>
        </div>
        <Button
          onClick={() => setIsInvoiceModalOpen(true)}
          variant="outline"
        >
          Edit Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Details</h3>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {formatCurrency(invoice.amount)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span 
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${invoice.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`
                  }
                >
                  {invoice.paid ? 'Paid' : 'Unpaid'}
                </span>
              </dd>
            </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(() => {
                    const date = typeof invoice.issueDate === 'string'
                      ? parseISO(invoice.issueDate)
                      : invoice.issueDate instanceof Date
                      ? invoice.issueDate
                      : null;
                    return date && isValid(date)
                      ? format(date, 'MMMM d, yyyy')
                      : 'Invalid Date';
                  })()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(() => {
                    const date = typeof invoice.dueDate === 'string'
                      ? parseISO(invoice.dueDate)
                      : invoice.dueDate instanceof Date
                      ? invoice.dueDate
                      : null;
                    return date && isValid(date)
                      ? format(date, 'MMMM d, yyyy')
                      : 'Invalid Date';
                  })()}
                </dd>
              </div>
          </dl>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Amount Paid</dt>
              <dd className="mt-1 text-2xl font-semibold text-green-600">
                {formatCurrency(totalPaid)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Balance Due</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {formatCurrency(invoice.amount - totalPaid)}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Payment Plans</h3>
          <Button
            onClick={() => setIsPaymentPlanModalOpen(true)}
            icon={<Plus size={16} />}
            size="sm"
          >
            Add Payment Plan
          </Button>
        </div>
        
        <Table
          data={paymentPlans}
          columns={paymentPlanColumns}
          keyField="planId"
          emptyMessage="No payment plans set up yet."
        />
      </Card>

      {isInvoiceModalOpen && (
        <InvoiceForm
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          invoiceId={id}
        />
      )}

      {isPaymentPlanModalOpen && (
        <PaymentPlanForm
          isOpen={isPaymentPlanModalOpen}
          onClose={() => setIsPaymentPlanModalOpen(false)}
          invoiceId={id}
          planId={null}
          remainingAmount={invoice.amount - totalPaid}
        />
      )}
    </div>
  );
};

export default InvoiceDetail;