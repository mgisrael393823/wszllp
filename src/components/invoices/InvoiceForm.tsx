import React from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useForm } from 'react-hook-form';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
}

interface InvoiceFormData {
  amount: number;
  issueDate: string;
  dueDate: string;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ isOpen, onClose, invoiceId }) => {
  const { state, dispatch } = useData();
  const invoice = state.invoices.find(i => i.invoiceId === invoiceId);

  const { register, handleSubmit, formState: { errors } } = useForm<InvoiceFormData>({
    defaultValues: {
      amount: invoice?.amount || 0,
      issueDate: invoice?.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : '',
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
    }
  });

  const onSubmit = (data: InvoiceFormData) => {
    if (!invoice) return;

    dispatch({
      type: 'UPDATE_INVOICE',
      payload: {
        ...invoice,
        amount: Number(data.amount),
        issueDate: new Date(data.issueDate).toISOString(),
        dueDate: new Date(data.dueDate).toISOString(),
      }
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Invoice">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            label="Amount"
            type="number"
            step="0.01"
            {...register('amount', { required: 'Amount is required', min: 0 })}
            error={errors.amount?.message}
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
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InvoiceForm;