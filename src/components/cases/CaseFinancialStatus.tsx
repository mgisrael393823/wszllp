import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  CreditCard,
  PieChart,
  Download
} from 'lucide-react';
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { MetricCard, StatusCard, ActionListCard } from '../ui';
import { Card } from '../ui/shadcn-card';
import Button from '../ui/Button';
import { useData } from '../../context/DataContext';
import { useInvoices } from '../../hooks/useInvoices';
import { cn } from '@/lib/utils';

interface CaseFinancialStatusProps {
  caseId: string;
  className?: string;
}

interface FinancialMetrics {
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  lastPaymentDate: Date | null;
  nextDueDate: Date | null;
  paymentProgress: number;
  overdueInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
}

/**
 * CaseFinancialStatus - Comprehensive financial tracking for cases
 * Shows billing summary, payment status, and financial metrics
 */
export const CaseFinancialStatus: React.FC<CaseFinancialStatusProps> = ({ 
  caseId, 
  className 
}) => {
  const { state } = useData();
  const [showDetails, setShowDetails] = useState(false);
  
  // Get case data from context and invoices from Supabase
  const caseData = state.cases.find(c => c.caseId === caseId);
  const { invoices: caseInvoices, isLoading, error } = useInvoices({ caseId });
  
  // Calculate financial metrics
  const metrics: FinancialMetrics = useMemo(() => {
    const today = new Date();
    
    const totalBilled = caseInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidInvoices = caseInvoices.filter(inv => inv.paid);
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalOutstanding = totalBilled - totalPaid;
    
    // Calculate overdue amount
    const overdueInvoices = caseInvoices.filter(inv => {
      if (inv.paid) return false;
      const dueDate = typeof inv.dueDate === 'string' 
        ? parseISO(inv.dueDate) 
        : inv.dueDate;
      return dueDate && isValid(dueDate) && dueDate < today;
    });
    
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    // Get last payment date
    const lastPayment = paidInvoices
      .sort((a, b) => {
        const dateA = typeof a.issueDate === 'string' ? parseISO(a.issueDate) : a.issueDate;
        const dateB = typeof b.issueDate === 'string' ? parseISO(b.issueDate) : b.issueDate;
        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
      })[0];
    
    const lastPaymentDate = lastPayment 
      ? (typeof lastPayment.issueDate === 'string' 
          ? parseISO(lastPayment.issueDate) 
          : lastPayment.issueDate)
      : null;
    
    // Get next due date
    const unpaidWithDueDate = caseInvoices
      .filter(inv => !inv.paid && inv.dueDate)
      .sort((a, b) => {
        const dateA = typeof a.dueDate === 'string' ? parseISO(a.dueDate) : a.dueDate;
        const dateB = typeof b.dueDate === 'string' ? parseISO(b.dueDate) : b.dueDate;
        return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
      })[0];
    
    const nextDueDate = unpaidWithDueDate
      ? (typeof unpaidWithDueDate.dueDate === 'string'
          ? parseISO(unpaidWithDueDate.dueDate)
          : unpaidWithDueDate.dueDate)
      : null;
    
    const paymentProgress = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;
    
    return {
      totalBilled,
      totalPaid,
      totalOutstanding,
      overdueAmount,
      lastPaymentDate,
      nextDueDate,
      paymentProgress,
      overdueInvoices: overdueInvoices.length,
      paidInvoices: paidInvoices.length,
      pendingInvoices: caseInvoices.filter(inv => !inv.paid).length
    };
  }, [caseInvoices]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Get status for payment
  const getPaymentStatus = (): 'completed' | 'active' | 'overdue' | 'pending' => {
    if (metrics.paymentProgress === 100) return 'completed';
    if (metrics.overdueAmount > 0) return 'overdue';
    if (metrics.paymentProgress > 0) return 'active';
    return 'pending';
  };
  
  // Quick actions for financial management
  const financialActions = [
    {
      id: 'create-invoice',
      icon: FileText,
      title: 'Create Invoice',
      subtitle: 'Generate new invoice',
      onClick: () => console.log('Create invoice')
    },
    {
      id: 'record-payment',
      icon: CreditCard,
      title: 'Record Payment',
      subtitle: 'Log payment received',
      onClick: () => console.log('Record payment')
    },
    {
      id: 'payment-plan',
      icon: Calendar,
      title: 'Payment Plan',
      subtitle: 'Set up installments',
      onClick: () => console.log('Payment plan')
    },
    {
      id: 'export-statement',
      icon: Download,
      title: 'Export Statement',
      subtitle: 'Download financial report',
      onClick: () => console.log('Export statement')
    }
  ];
  
  if (!caseData) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="animate-pulse">
          <div className="h-32 bg-neutral-200 rounded-xl mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-neutral-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600">Failed to load financial data</p>
          <p className="text-sm text-neutral-600 mt-2">Please try refreshing the page</p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Financial Overview Card */}
      <StatusCard
        title="Financial Status"
        status={getPaymentStatus()}
        subtitle={`${metrics.paidInvoices} of ${caseInvoices.length} invoices paid`}
        description={
          metrics.overdueAmount > 0 
            ? `${formatCurrency(metrics.overdueAmount)} overdue`
            : metrics.totalOutstanding > 0
            ? `${formatCurrency(metrics.totalOutstanding)} outstanding`
            : 'All payments received'
        }
        icon={DollarSign}
        metadata={[
          { label: "Total Billed", value: formatCurrency(metrics.totalBilled) },
          { label: "Total Paid", value: formatCurrency(metrics.totalPaid) },
          { label: "Outstanding", value: formatCurrency(metrics.totalOutstanding) },
          { 
            label: "Payment Progress", 
            value: `${Math.round(metrics.paymentProgress)}%` 
          }
        ]}
        actions={[
          {
            label: showDetails ? "Hide Details" : "Show Details",
            onClick: () => setShowDetails(!showDetails),
            variant: 'outline'
          }
        ]}
      />
      
      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Billed"
          value={formatCurrency(metrics.totalBilled)}
          icon={DollarSign}
          subtitle={`${caseInvoices.length} invoices`}
        />
        
        <MetricCard
          title="Paid to Date"
          value={formatCurrency(metrics.totalPaid)}
          icon={CheckCircle}
          subtitle={`${metrics.paidInvoices} paid`}
          trend={
            metrics.totalPaid > 0 
              ? { value: `${Math.round(metrics.paymentProgress)}%`, isPositive: true }
              : undefined
          }
        />
        
        <MetricCard
          title="Outstanding"
          value={formatCurrency(metrics.totalOutstanding)}
          icon={Clock}
          subtitle={`${metrics.pendingInvoices} pending`}
          trend={
            metrics.totalOutstanding > 0
              ? { value: "Due", isPositive: false }
              : { value: "Paid", isPositive: true }
          }
        />
        
        <MetricCard
          title="Overdue"
          value={formatCurrency(metrics.overdueAmount)}
          icon={AlertCircle}
          subtitle={`${metrics.overdueInvoices} invoices`}
          trend={
            metrics.overdueAmount > 0
              ? { value: "Action needed", isPositive: false }
              : undefined
          }
        />
      </div>
      
      {/* Payment Timeline */}
      {showDetails && (
        <>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Payment Timeline</h3>
              
              <div className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-600">Payment Progress</span>
                    <span className="font-medium">{Math.round(metrics.paymentProgress)}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        metrics.overdueAmount > 0 
                          ? "bg-red-500" 
                          : metrics.paymentProgress === 100 
                          ? "bg-green-500" 
                          : "bg-blue-500"
                      )}
                      style={{ width: `${metrics.paymentProgress}%` }}
                    />
                  </div>
                </div>
                
                {/* Key Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <p className="text-sm text-neutral-600">Last Payment</p>
                    <p className="font-medium">
                      {metrics.lastPaymentDate && isValid(metrics.lastPaymentDate)
                        ? format(metrics.lastPaymentDate, 'MMM d, yyyy')
                        : 'No payments yet'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Next Due Date</p>
                    <p className="font-medium">
                      {metrics.nextDueDate && isValid(metrics.nextDueDate)
                        ? (() => {
                            const daysUntilDue = differenceInDays(metrics.nextDueDate, new Date());
                            const dateStr = format(metrics.nextDueDate, 'MMM d, yyyy');
                            if (daysUntilDue < 0) return `${dateStr} (${Math.abs(daysUntilDue)} days overdue)`;
                            if (daysUntilDue === 0) return `${dateStr} (Due today)`;
                            return `${dateStr} (${daysUntilDue} days)`;
                          })()
                        : 'No upcoming due dates'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Invoice List */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Invoices</h3>
              
              <div className="space-y-3">
                {caseInvoices
                  .sort((a, b) => {
                    const dateA = typeof a.issueDate === 'string' ? parseISO(a.issueDate) : a.issueDate;
                    const dateB = typeof b.issueDate === 'string' ? parseISO(b.issueDate) : b.issueDate;
                    return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
                  })
                  .slice(0, 5)
                  .map(invoice => {
                    const issueDate = typeof invoice.issueDate === 'string'
                      ? parseISO(invoice.issueDate)
                      : invoice.issueDate;
                    const dueDate = typeof invoice.dueDate === 'string'
                      ? parseISO(invoice.dueDate)
                      : invoice.dueDate;
                    
                    const isOverdue = !invoice.paid && dueDate && isValid(dueDate) && dueDate < new Date();
                    
                    return (
                      <div 
                        key={invoice.invoiceId} 
                        className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            invoice.paid ? "bg-green-100" : isOverdue ? "bg-red-100" : "bg-yellow-100"
                          )}>
                            <FileText className={cn(
                              "w-5 h-5",
                              invoice.paid ? "text-green-600" : isOverdue ? "text-red-600" : "text-yellow-600"
                            )} />
                          </div>
                          <div>
                            <p className="font-medium">Invoice #{invoice.invoiceId}</p>
                            <p className="text-sm text-neutral-600">
                              {issueDate && isValid(issueDate)
                                ? format(issueDate, 'MMM d, yyyy')
                                : 'Invalid date'}
                              {invoice.description && ` • ${invoice.description}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                          <p className={cn(
                            "text-sm",
                            invoice.paid ? "text-green-600" : isOverdue ? "text-red-600" : "text-yellow-600"
                          )}>
                            {invoice.paid ? "Paid" : isOverdue ? "Overdue" : "Pending"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {caseInvoices.length > 5 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => console.log('View all invoices')}
                >
                  View All {caseInvoices.length} Invoices
                </Button>
              )}
            </div>
          </Card>
        </>
      )}
      
      {/* Quick Actions */}
      <ActionListCard
        title="Financial Actions"
        description="Manage billing and payments"
        items={financialActions}
      />
    </div>
  );
};

export default CaseFinancialStatus;