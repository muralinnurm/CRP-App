import React, { useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Filter,
  Edit2,
  Trash2,
  Download
} from 'lucide-react';
import { Payment, Client, Project } from '../types';

interface PaymentsViewProps {
  payments: Payment[];
  clients: Client[];
  projects: Project[];
  onOpenAddPayment: () => void;
  onEditPayment: (payment: Payment) => void;
  onDeletePayment: (paymentId: string) => Promise<void>;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  clients,
  projects,
  onOpenAddPayment,
  onEditPayment,
  onDeletePayment,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.client_name && p.client_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.project_title && p.project_title.toLowerCase().includes(search.toLowerCase())) ||
      (p.reference_id && p.reference_id.toLowerCase().includes(search.toLowerCase())) ||
      p.amount.toString().includes(search);

    const matchesStatus = statusFilter === 'all' ? true : p.status === statusFilter;
    const matchesClient = clientFilter === 'all' ? true : p.client_id === clientFilter;
    const matchesMethod = methodFilter === 'all' ? true : p.payment_method === methodFilter;

    return matchesSearch && matchesStatus && matchesClient && matchesMethod;
  });

  const totalFilteredAmount = filteredPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client, project, amount or reference ID..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Status Pills */}
            <div className="flex bg-neutral-100 p-1 rounded-xl">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('received')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === 'received'
                    ? 'bg-white text-emerald-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Received
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-white text-amber-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Pending
              </button>
            </div>

            <button
              onClick={onOpenAddPayment}
              className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex items-center gap-3 pt-2 border-t border-neutral-100 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-500 font-semibold">
            <Filter className="w-3.5 h-3.5 text-emerald-800" />
            <span>Filter by:</span>
          </div>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-700 focus:outline-hidden"
          >
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-700 focus:outline-hidden"
          >
            <option value="all">All Payment Methods</option>
            <option value="bank_transfer">Bank Transfer (ACH / Wire)</option>
            <option value="stripe">Stripe</option>
            <option value="paypal">PayPal</option>
            <option value="check">Check</option>
            <option value="cash">Cash</option>
          </select>

          <div className="ml-auto text-xs font-bold text-neutral-900">
            Total Filtered Revenue:{' '}
            <span className="text-emerald-800 font-black">
              ${totalFilteredAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 rounded-tl-xl">Payment Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Project / Service</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method & Ref ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-neutral-800">
                    {payment.payment_date}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-neutral-900">
                    {payment.client_name}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 font-medium">
                    {payment.project_title}
                  </td>
                  <td className="py-3.5 px-4 font-black text-sm text-neutral-900">
                    ${payment.amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-500">
                    <span className="capitalize font-semibold text-neutral-700">
                      {payment.payment_method.replace('_', ' ')}
                    </span>
                    {payment.reference_id && (
                      <span className="block text-[10px] font-mono text-neutral-400">
                        {payment.reference_id}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        payment.status === 'received'
                          ? 'bg-emerald-100 text-emerald-800'
                          : payment.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {payment.status === 'received' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span className="capitalize">{payment.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEditPayment(payment)}
                        className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                        title="Edit Payment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete payment record of $${payment.amount}?`)) {
                            onDeletePayment(payment.id);
                          }
                        }}
                        className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="py-12 text-center p-8">
            <CreditCard className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-700">No payment records found</h3>
            <p className="text-xs text-neutral-400 mt-1 mb-4">
              Manually record received income payments to maintain a complete history.
            </p>
            <button
              onClick={onOpenAddPayment}
              className="px-4 py-2 bg-emerald-900 text-white rounded-xl text-xs font-medium inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Payment</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
