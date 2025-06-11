import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, DollarSign, Clock, CheckCircle, BarChart3 } from 'lucide-react';
import Button from '../ui/Button';
import TabBar, { TabItem } from '../ui/TabBar';
import InvoiceList from './InvoiceList';
import InvoiceForm from './InvoiceForm';
import { useData } from '../../context/DataContext';

type InvoiceStatus = 'all' | 'unpaid' | 'paid' | 'overdue' | 'reports';

/**
 * Main Invoices Page component
 * Follows the standard page-container pattern with status-based tab filtering
 * Manages the InvoiceForm modal state and tab-based filtering
 */
const InvoicesPage: React.FC = () => {
  const { state } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);

  // Get active tab from URL params, default to 'all'
  const activeTab = (searchParams.get('tab') as InvoiceStatus) || 'all';

  const handleAddInvoice = () => {
    setIsInvoiceFormOpen(true);
  };

  const handleCloseInvoiceForm = () => {
    setIsInvoiceFormOpen(false);
  };

  // Calculate counts for each status
  const statusCounts = useMemo(() => {
    const now = new Date();
    const unpaid = state.invoices.filter(invoice => !invoice.paid);
    const paid = state.invoices.filter(invoice => invoice.paid);
    const overdue = unpaid.filter(invoice => {
      const dueDate = typeof invoice.dueDate === 'string' 
        ? new Date(invoice.dueDate) 
        : invoice.dueDate;
      return dueDate && dueDate < now;
    });

    return {
      all: state.invoices.length,
      unpaid: unpaid.length,
      paid: paid.length,
      overdue: overdue.length
    };
  }, [state.invoices]);

  // Define tabs for the Invoices section with proper routes
  const tabs: TabItem[] = [
    {
      label: 'All Invoices',
      value: 'all',
      route: '/invoices',
      icon: <DollarSign size={16} />,
      count: statusCounts.all
    },
    {
      label: 'Unpaid',
      value: 'unpaid',
      route: '/invoices?tab=unpaid',
      icon: <Clock size={16} />,
      count: statusCounts.unpaid
    },
    {
      label: 'Paid',
      value: 'paid',
      route: '/invoices?tab=paid',
      icon: <CheckCircle size={16} />,
      count: statusCounts.paid
    },
    {
      label: 'Overdue',
      value: 'overdue',
      route: '/invoices?tab=overdue',
      icon: <Clock size={16} />,
      count: statusCounts.overdue
    },
    {
      label: 'Reports',
      value: 'reports',
      route: '/invoices?tab=reports',
      icon: <BarChart3 size={16} />
    }
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">
            Manage billing and payment tracking for your cases
          </p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />}
          onClick={handleAddInvoice}
        >
          Add Invoice
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 backdrop-blur-sm pb-2 -mx-6 px-6">
        <TabBar tabs={tabs} />
      </div>

      {/* Tab Content */}
      {activeTab === 'reports' ? (
        <div className="p-8 text-center bg-white rounded-lg border border-neutral-200">
          <BarChart3 size={64} className="mx-auto text-neutral-400 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Reports Coming Soon</h3>
          <p className="text-neutral-500">Invoice analytics and reporting features will be available here.</p>
        </div>
      ) : (
        <InvoiceList 
          onAddInvoice={handleAddInvoice} 
          statusFilter={activeTab}
        />
      )}

      {/* Invoice Form Modal */}
      {isInvoiceFormOpen && (
        <InvoiceForm
          isOpen={isInvoiceFormOpen}
          onClose={handleCloseInvoiceForm}
          invoiceId={null}
        />
      )}
    </div>
  );
};

export default InvoicesPage;