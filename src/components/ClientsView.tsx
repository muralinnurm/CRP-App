import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Building, 
  DollarSign, 
  CreditCard, 
  Briefcase, 
  Trash2, 
  Edit2, 
  X,
  ChevronRight,
  User
} from 'lucide-react';
import { Client, Project, Payment } from '../types';
import { ClientAvatar } from './ClientAvatar';

interface ClientsViewProps {
  clients: Client[];
  projects: Project[];
  payments: Payment[];
  onOpenAddClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => Promise<void>;
  onOpenAddProjectForClient: (clientId: string) => void;
  onOpenAddPaymentForClient: (clientId: string) => void;
  selectedClientForDrawer?: Client | null;
  onCloseDrawer: () => void;
  onSelectClientForDrawer: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  projects,
  payments,
  onOpenAddClient,
  onEditClient,
  onDeleteClient,
  onOpenAddProjectForClient,
  onOpenAddPaymentForClient,
  selectedClientForDrawer,
  onCloseDrawer,
  onSelectClientForDrawer,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const companiesStr = c.companies ? c.companies.join(' ') : c.company || '';
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      companiesStr.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ? true : c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      {/* Top Filter & Action Header */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client name, company, email..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
          />
        </div>

        {/* Status Filter & Add Button */}
        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              All ({clients.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'active'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Active ({clients.filter((c) => c.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Inactive ({clients.filter((c) => c.status === 'inactive').length})
            </button>
          </div>

          <button
            onClick={onOpenAddClient}
            className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          // Client metrics
          const clientProjects = projects.filter((p) => p.client_id === client.id);
          const clientPayments = payments.filter(
            (p) => p.client_id === client.id && p.status === 'received'
          );

          const totalRevenue = clientPayments.reduce(
            (sum, p) => sum + Number(p.amount || 0),
            0
          );

          const clientMRR = clientProjects
            .filter((p) => p.status === 'active' && p.type === 'monthly_recurring')
            .reduce((sum, p) => sum + Number(p.expected_amount || 0), 0);

          const companyList = client.companies && client.companies.length > 0
            ? client.companies
            : client.company ? [client.company] : [];

          return (
            <div
              key={client.id}
              className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <ClientAvatar name={client.name} avatarUrl={client.avatar_url} className="w-11 h-11 text-sm" />
                    <div>
                      <h3
                        onClick={() => onSelectClientForDrawer(client)}
                        className="font-bold text-neutral-900 text-sm group-hover:text-emerald-900 cursor-pointer hover:underline"
                      >
                        {client.name}
                      </h3>
                      {companyList.length > 0 ? (
                        <p className="text-xs text-neutral-500 font-medium">
                          {companyList[0]} {companyList.length > 1 ? `(+${companyList.length - 1} more)` : ''}
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-400 font-medium">Individual Client</p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      client.status === 'active'
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {client.status}
                  </span>
                </div>

                {/* Multiple Company Badges */}
                {companyList.length > 0 && (
                  <div className="flex flex-wrap gap-1 my-2">
                    {companyList.map((comp, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-md text-[10px] font-semibold"
                      >
                        <Building className="w-2.5 h-2.5 text-neutral-500" />
                        <span>{comp}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Contact info */}
                <div className="space-y-1 my-3 text-xs text-neutral-500">
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-neutral-50 border border-neutral-100 my-4">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase block">
                      Total Collected
                    </span>
                    <span className="text-sm font-extrabold text-neutral-900">
                      ${totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase block">
                      Active MRR
                    </span>
                    <span className="text-sm font-extrabold text-emerald-800">
                      ${clientMRR.toLocaleString()}
                      <span className="text-[10px] font-normal">/mo</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <button
                  onClick={() => onSelectClientForDrawer(client)}
                  className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
                >
                  <span>Payment History ({clientPayments.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditClient(client)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                    title="Edit Client"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete client "${client.name}" and all their projects/payments?`)) {
                        onDeleteClient(client.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Client"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="py-12 text-center bg-white rounded-2xl border border-neutral-200/80 p-8">
          <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-700">No clients found</h3>
          <p className="text-xs text-neutral-400 mt-1 mb-4">
            Get started by adding your first client.
          </p>
          <button
            onClick={onOpenAddClient}
            className="px-4 py-2 bg-emerald-900 text-white rounded-xl text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Client</span>
          </button>
        </div>
      )}

      {/* CLIENT DETAIL DRAWER / MODAL showing complete history & projects */}
      {selectedClientForDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-neutral-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <ClientAvatar name={selectedClientForDrawer.name} avatarUrl={selectedClientForDrawer.avatar_url} className="w-12 h-12 text-base" />
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">
                      {selectedClientForDrawer.name}
                    </h2>
                    <p className="text-xs text-neutral-400">
                      {selectedClientForDrawer.companies && selectedClientForDrawer.companies.length > 0
                        ? selectedClientForDrawer.companies.join(' • ')
                        : selectedClientForDrawer.company || 'Client Profile & Payment Ledger'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onCloseDrawer}
                  className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center hover:bg-neutral-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons Bar */}
              <div className="flex gap-2 my-4">
                <button
                  onClick={() => onOpenAddPaymentForClient(selectedClientForDrawer.id)}
                  className="flex-1 py-2 px-3 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Record Payment</span>
                </button>
                <button
                  onClick={() => onOpenAddProjectForClient(selectedClientForDrawer.id)}
                  className="flex-1 py-2 px-3 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Add Project</span>
                </button>
              </div>

              {/* Client Summary Stats */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-neutral-50 border border-neutral-100 mb-6">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Total Revenue Collected
                  </span>
                  <span className="text-lg font-black text-neutral-900">
                    $
                    {payments
                      .filter((p) => p.client_id === selectedClientForDrawer.id && p.status === 'received')
                      .reduce((sum, p) => sum + Number(p.amount), 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Active Monthly Retainer
                  </span>
                  <span className="text-lg font-black text-emerald-800">
                    $
                    {projects
                      .filter((p) => p.client_id === selectedClientForDrawer.id && p.status === 'active' && p.type === 'monthly_recurring')
                      .reduce((sum, p) => sum + Number(p.expected_amount), 0)
                      .toLocaleString()}
                    <span className="text-xs font-normal">/mo</span>
                  </span>
                </div>
              </div>

              {/* Client Projects */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
                  Projects & Services ({projects.filter((p) => p.client_id === selectedClientForDrawer.id).length})
                </h4>
                <div className="space-y-2">
                  {projects
                    .filter((p) => p.client_id === selectedClientForDrawer.id)
                    .map((proj) => (
                      <div
                        key={proj.id}
                        className="p-3 rounded-xl border border-neutral-200/80 bg-white flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-neutral-900">{proj.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                              {proj.type === 'monthly_recurring' ? 'Monthly Recurring' : 'One-Time Project'}
                            </span>
                            {proj.company_name && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-800 rounded font-bold">
                                {proj.company_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-800">
                          ${proj.expected_amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Client Payment History Ledger */}
              <div>
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
                  Complete Payment History ({payments.filter((p) => p.client_id === selectedClientForDrawer.id).length})
                </h4>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {payments
                    .filter((p) => p.client_id === selectedClientForDrawer.id)
                    .map((pay) => (
                      <div
                        key={pay.id}
                        className="p-3 rounded-xl border border-neutral-100 bg-neutral-50/50 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-neutral-900">
                            ${pay.amount.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            {pay.payment_date} • {pay.payment_method} {pay.reference_id ? `(${pay.reference_id})` : ''}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pay.status === 'received'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pay.status}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 text-right">
              <button
                onClick={onCloseDrawer}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
