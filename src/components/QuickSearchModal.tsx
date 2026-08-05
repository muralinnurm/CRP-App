import React, { useState, useEffect } from 'react';
import { Search, X, Users, Briefcase, CreditCard, ArrowRight } from 'lucide-react';
import { Client, Project, Payment } from '../types';
import { ClientAvatar } from './ClientAvatar';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  projects: Project[];
  payments: Payment[];
  onSelectClient: (client: Client) => void;
  onSelectProject: (project: Project) => void;
  onSelectPayment: (payment: Payment) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  clients,
  projects,
  payments,
  onSelectClient,
  onSelectProject,
  onSelectPayment,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        // Trigger modal toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredClients = q
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.company && c.company.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      )
    : clients.slice(0, 3);

  const filteredProjects = q
    ? projects.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.client_name && p.client_name.toLowerCase().includes(q)) ||
          (p.notes && p.notes.toLowerCase().includes(q))
      )
    : projects.slice(0, 3);

  const filteredPayments = q
    ? payments.filter(
        (pay) =>
          pay.amount.toString().includes(q) ||
          (pay.client_name && pay.client_name.toLowerCase().includes(q)) ||
          (pay.project_title && pay.project_title.toLowerCase().includes(q)) ||
          (pay.reference_id && pay.reference_id.toLowerCase().includes(q))
      )
    : payments.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-neutral-900/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-neutral-100 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-800 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by client name, project, payment amount or ref ID..."
            className="w-full text-sm text-neutral-900 placeholder-neutral-400 focus:outline-hidden"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-5 divide-y divide-neutral-100">
          {/* CLIENTS */}
          {filteredClients.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-emerald-700" />
                <span>Clients ({filteredClients.length})</span>
              </p>
              <div className="space-y-1">
                {filteredClients.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectClient(c);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <ClientAvatar name={c.name} avatarUrl={c.avatar_url} className="w-8 h-8 text-xs" />
                      <div>
                        <p className="text-xs font-semibold text-neutral-900 group-hover:text-emerald-900">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {c.company || c.email || 'Client'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-emerald-800 transition-transform group-hover:translate-x-0.5" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROJECTS */}
          {filteredProjects.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3 h-3 text-emerald-700" />
                <span>Projects & Services ({filteredProjects.length})</span>
              </p>
              <div className="space-y-1">
                {filteredProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-neutral-900 group-hover:text-emerald-900">
                        {p.title}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {p.client_name} • ${p.expected_amount} ({p.type === 'monthly_recurring' ? 'Recurring' : 'One-time'})
                      </p>
                    </div>
                    <span className="text-xs font-bold text-neutral-900">
                      ${p.expected_amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAYMENTS */}
          {filteredPayments.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3 h-3 text-emerald-700" />
                <span>Payment Records ({filteredPayments.length})</span>
              </p>
              <div className="space-y-1">
                {filteredPayments.map((pay) => (
                  <div
                    key={pay.id}
                    onClick={() => {
                      onSelectPayment(pay);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-neutral-900 group-hover:text-emerald-900">
                        ${pay.amount.toLocaleString()} — {pay.client_name}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {pay.project_title} • {pay.payment_date} ({pay.payment_method})
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                      ${pay.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredClients.length === 0 &&
            filteredProjects.length === 0 &&
            filteredPayments.length === 0 && (
              <div className="py-8 text-center text-xs text-neutral-400">
                No matching clients, projects, or payments found for "{query}".
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
