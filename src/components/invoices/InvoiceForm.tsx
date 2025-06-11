import React, { useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { useForm, Controller } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string | null;
  defaultCaseId?: string;
}

interface InvoiceFormData {
  amount: number;
  description: string;
  issueDate: string;
  dueDate: string;
  caseId: string;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ isOpen, onClose, invoiceId, defaultCaseId }) => {
  const { state, dispatch } = useData();
  const { addToast } = useToast();
  const invoice = invoiceId ? state.invoices.find(i => i.invoiceId === invoiceId) : null;
  const isEditing = !!invoice;

  const { register, handleSubmit, formState: { errors }, reset, setValue, control } = useForm<InvoiceFormData>({
    defaultValues: {
      amount: invoice?.amount || 0,
      description: invoice?.description || '',
      issueDate: invoice?.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      caseId: invoice?.caseId || defaultCaseId || '',
    }
  });

  // Set default case when modal opens (only when modal opens, not when it closes)
  useEffect(() => {
    if (isOpen && !isEditing && defaultCaseId) {
      setValue('caseId', defaultCaseId);
    }
  }, [isOpen, defaultCaseId, isEditing, setValue]);

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      if (isEditing && invoice) {
        // Update existing invoice
        const { error } = await supabase
          .from('invoices')
          .update({
            amount: Number(data.amount),
            description: data.description,
            issue_date: new Date(data.issueDate).toISOString(),
            due_date: new Date(data.dueDate).toISOString(),
          })
          .eq('id', invoice.invoiceId);

        if (error) throw error;

        dispatch({
          type: 'UPDATE_INVOICE',
          payload: {
            ...invoice,
            amount: Number(data.amount),
            description: data.description,
            issueDate: new Date(data.issueDate).toISOString(),
            dueDate: new Date(data.dueDate).toISOString(),
          }
        });

        addToast({
          type: 'success',
          title: 'Invoice Updated',
          message: 'Invoice has been updated successfully',
        });
      } else {
        // Create new invoice
        const newInvoice = {
          case_id: data.caseId,
          amount: Number(data.amount),
          description: data.description,
          issue_date: new Date(data.issueDate).toISOString(),
          due_date: new Date(data.dueDate).toISOString(),
          paid: false,
        };

        const { data: createdInvoice, error } = await supabase
          .from('invoices')
          .insert([newInvoice])
          .select()
          .single();

        if (error) throw error;

        // Transform to match frontend schema
        const transformedInvoice = {
          invoiceId: createdInvoice.id,
          caseId: createdInvoice.case_id,
          amount: createdInvoice.amount,
          description: createdInvoice.description,
          issueDate: createdInvoice.issue_date,
          dueDate: createdInvoice.due_date,
          paid: createdInvoice.paid,
          createdAt: createdInvoice.created_at,
          updatedAt: createdInvoice.updated_at,
        };

        dispatch({
          type: 'ADD_INVOICE',
          payload: transformedInvoice
        });

        addToast({
          type: 'success',
          title: 'Invoice Created',
          message: `Invoice #${createdInvoice.invoice_id} has been created`,
        });
      }

      onClose();
      reset();
    } catch (error) {
      console.error('Error saving invoice:', error);
      addToast({
        type: 'error',
        title: isEditing ? 'Update Failed' : 'Creation Failed',
        message: 'Failed to save invoice. Please try again.',
      });
    }
  };

  // Get cases for dropdown
  const cases = state.cases.map(c => ({
    value: c.caseId,
    label: `${c.plaintiff} v. ${c.defendant}`
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Invoice" : "Create Invoice"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!isEditing && (
          <div>
            <Controller
              name="caseId"
              control={control}
              rules={{ required: 'Case is required' }}
              render={({ field }) => (
                <Select
                  label="Case"
                  options={cases}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.caseId?.message}
                  disabled={!!defaultCaseId}
                  required
                />
              )}
            />
          </div>
        )}

        <div>
          <Input
            label="Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('amount', { 
              required: 'Amount is required', 
              min: { value: 0.01, message: 'Amount must be greater than 0' }
            })}
            error={errors.amount?.message}
          />
        </div>

        <div>
          <Input
            label="Description"
            type="text"
            placeholder="Legal services, filing fees, etc."
            {...register('description')}
          />
        </div>

        <div>
          <Input
            label="Issue Date"
            type="date"
            {...register('issueDate', { required: 'Issue date is required' })}
            error={errors.issueDate?.message}
          />
        </div>

        <div>
          <Input
            label="Due Date"
            type="date"
            {...register('dueDate', { required: 'Due date is required' })}
            error={errors.dueDate?.message}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Save Changes' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InvoiceForm;