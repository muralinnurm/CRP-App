import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CreditCard, FileText, Check } from 'lucide-react';
import { Client, Project, Payment, PaymentMethod, PaymentStatus } from '../types';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  projects: Project[];
  onSave: (paymentData: Omit<Payment, 'id' | 'created_at'>, editingId?: string) => Promise<void>;
  editingPayment?: Payment | null;
  defaultClientId?: string;
  defaultProjectId?: string;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  isOpen,
  onClose,
  clients,
  projects,
  onSave,
  editingPayment,
  defaultClientId,
  defaultProjectId,
}) => {
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [referenceId, setReferenceId] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('received');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available projects for selected client
  const clientProjects = projects.filter((p) => p.client_id === clientId);

  useEffect(() => {
    if (editingPayment) {
      setClientId(editingPayment.client_id);
      setProjectId(editingPayment.project_id);
      setAmount(String(editingPayment.amount));
      setPaymentDate(editingPayment.payment_date);
      setPaymentMethod(editingPayment.payment_method);
      setReferenceId(editingPayment.reference_id || '');
      setStatus(editingPayment.status);
      setNotes(editingPayment.notes || '');
    } else {
      const initialClient = defaultClientId || (clients.length > 0 ? clients[0].id : '');
      setClientId(initialClient);

      const availProjects = projects.filter((p) => p.client_id === initialClient);
      const initialProj = defaultProjectId || (availProjects.length > 0 ? availProjects[0].id : '');
      setProjectId(initialProj);

      if (initialProj) {
        const found = projects.find((p) => p.id === initialProj);
        if (found) setAmount(String(found.expected_amount));
      } else {
        setAmount('');
      }

      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('bank_transfer');
      setReferenceId('');
      setStatus('received');
      setNotes('');
    }
  }, [editingPayment, isOpen, clients, projects, defaultClientId, defaultProjectId]);

  // When client changes, auto select first project for that client
  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    const available = projects.filter((p) => p.client_id === newClientId);
    if (available.length > 0) {
      setProjectId(available[0].id);
      setAmount(String(available[0].expected_amount));
    } else {
      setProjectId('');
      setAmount('');
    }
  };

  // When project changes, auto select expected amount
  const handleProjectChange = (newProjectId: string) => {
    setProjectId(newProjectId);
    const found = projects.find((p) => p.id === newProjectId);
    if (found) {
      setAmount(String(found.expected_amount));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !projectId || !amount) return;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          client_id: clientId,
          project_id: projectId,
          amount: parseFloat(amount) || 0,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          reference_id: referenceId.trim() || undefined,
          status,
          notes: notes.trim(),
        },
        editingPayment?.id
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 relative">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">
              {editingPayment ? 'Edit Payment Record' : 'Record Received Payment'}
            </h3>
            <p className="text-xs text-neutral-500">
              Link income directly to a client and project for precise payment history.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center hover:bg-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Client *
            </label>
            <select
              required
              value={clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 bg-white"
            >
              <option value="" disabled>
                -- Select Client --
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Associated Project or Service *
            </label>
            <select
              required
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 bg-white"
              disabled={clientProjects.length === 0}
            >
              <option value="" disabled>
                {clientProjects.length === 0
                  ? 'No projects available for this client'
                  : '-- Select Project --'}
              </option>
              {clientProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} (${p.expected_amount} - {p.type === 'monthly_recurring' ? 'Recurring' : 'One-time'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Payment Amount ($) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1500"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Payment Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 bg-white"
              >
                <option value="bank_transfer">Bank Transfer (ACH / Wire)</option>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="check">Check</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Reference / Tx ID
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. ACH-982103"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Payment Status
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('received')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1 ${
                  status === 'received'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                    : 'bg-white border-neutral-200 text-neutral-600'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Received</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1 ${
                  status === 'pending'
                    ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                    : 'bg-white border-neutral-200 text-neutral-600'
                }`}
              >
                <span>Pending</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('overdue')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1 ${
                  status === 'overdue'
                    ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                    : 'bg-white border-neutral-200 text-neutral-600'
                }`}
              >
                <span>Overdue</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. August retainer payment received via Direct Deposit..."
              className="w-full p-3 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-medium bg-emerald-900 text-white hover:bg-emerald-950 transition-colors shadow-xs"
            >
              {isSubmitting ? 'Recording...' : editingPayment ? 'Update Payment' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
