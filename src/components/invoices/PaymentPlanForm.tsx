import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Calendar, DollarSign } from 'lucide-react';

interface PaymentPlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  planId: string | null;
  remainingAmount: number;
}

const PaymentPlanForm: React.FC<PaymentPlanFormProps> = ({
  isOpen,
  onClose,
  invoiceId,
  planId,
  remainingAmount,
}) => {
  const { dispatch } = useData();
  const [amount, setAmount] = useState('');
  const [installmentDate, setInstallmentDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!installmentDate) {
      setError('Please select an installment date');
      return;
    }

    if (amountValue > remainingAmount) {
      setError(`Amount cannot exceed the remaining balance of $${remainingAmount.toFixed(2)}`);
      return;
    }

    const newPlan = {
      planId: planId || crypto.randomUUID(),
      invoiceId,
      amount: amountValue,
      installmentDate: new Date(installmentDate).toISOString(),
      paid: false,
    };

    dispatch({
      type: planId ? 'UPDATE_PAYMENT_PLAN' : 'ADD_PAYMENT_PLAN',
      payload: newPlan,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={planId ? 'Edit Payment Plan' : 'Add Payment Plan'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-neutral-700">
            Amount
          </label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            icon={<DollarSign size={16} />}
            required
          />
        </div>

        <div>
          <label htmlFor="installmentDate" className="block text-sm font-medium text-neutral-700">
            Installment Date
          </label>
          <Input
            id="installmentDate"
            type="date"
            value={installmentDate}
            onChange={(e) => setInstallmentDate(e.target.value)}
            icon={<Calendar size={16} />}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit">
            {planId ? 'Update' : 'Add'} Payment Plan
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentPlanForm;