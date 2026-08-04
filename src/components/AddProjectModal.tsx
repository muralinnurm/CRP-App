import React, { useState, useEffect } from 'react';
import { X, Briefcase, DollarSign, Calendar, RefreshCw, Clock, Building } from 'lucide-react';
import { Client, Project, ProjectType, ProjectStatus } from '../types';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSave: (projectData: Omit<Project, 'id' | 'created_at'>, editingId?: string) => Promise<void>;
  editingProject?: Project | null;
  defaultClientId?: string;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  clients,
  onSave,
  editingProject,
  defaultClientId,
}) => {
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ProjectType>('monthly_recurring');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [billingCycleDay, setBillingCycleDay] = useState('1');
  const [dueDate, setDueDate] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active selected client
  const selectedClient = clients.find((c) => c.id === clientId);

  // Derive companies list for selected client
  const clientCompanies = selectedClient
    ? selectedClient.companies && selectedClient.companies.length > 0
      ? selectedClient.companies
      : selectedClient.company ? [selectedClient.company] : []
    : [];

  useEffect(() => {
    if (editingProject) {
      setClientId(editingProject.client_id);
      setTitle(editingProject.title);
      setType(editingProject.type);
      setExpectedAmount(String(editingProject.expected_amount));
      setStatus(editingProject.status);
      setBillingCycleDay(String(editingProject.billing_cycle_day || 1));
      setDueDate(editingProject.due_date || '');
      setCompanyName(editingProject.company_name || '');
      setNotes(editingProject.notes || '');
    } else {
      const initialClientId = defaultClientId || (clients.length > 0 ? clients[0].id : '');
      setClientId(initialClientId);
      setTitle('');
      setType('monthly_recurring');
      setExpectedAmount('');
      setStatus('active');
      setBillingCycleDay('1');
      setDueDate('');
      
      const initClient = clients.find((c) => c.id === initialClientId);
      const initComp = initClient?.companies?.[0] || initClient?.company || '';
      setCompanyName(initComp);

      setNotes('');
    }
  }, [editingProject, isOpen, clients, defaultClientId]);

  // When selected client changes, auto-default company if not editing
  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    const target = clients.find((c) => c.id === newClientId);
    if (target) {
      const firstComp = target.companies?.[0] || target.company || '';
      setCompanyName(firstComp);
    } else {
      setCompanyName('');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientId || !expectedAmount) return;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          client_id: clientId,
          title: title.trim(),
          type,
          expected_amount: parseFloat(expectedAmount) || 0,
          status,
          billing_cycle_day: type === 'monthly_recurring' ? parseInt(billingCycleDay) || 1 : undefined,
          due_date: type === 'one_time' ? dueDate || undefined : undefined,
          company_name: companyName.trim() || undefined,
          notes: notes.trim(),
        },
        editingProject?.id
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
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">
              {editingProject ? 'Edit Project / Service' : 'Add Project or Service'}
            </h3>
            <p className="text-xs text-neutral-500">
              Link project to client and select the associated client company.
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
          {/* Select Client */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Select Client *
            </label>
            <select
              required
              value={clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 focus:border-emerald-800 bg-white"
            >
              <option value="" disabled>
                -- Select a Client --
              </option>
              {clients.map((c) => {
                const compsStr = c.companies && c.companies.length > 0 
                  ? c.companies.join(', ') 
                  : c.company || '';
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} {compsStr ? `(${compsStr})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Linked Client Company Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Linked Client Company
            </label>
            {clientCompanies.length > 0 ? (
              <div className="relative">
                <Building className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <select
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 bg-white font-medium"
                >
                  <option value="">-- Select Client Company --</option>
                  {clientCompanies.map((comp, idx) => (
                    <option key={idx} value={comp}>
                      {comp}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="relative">
                <Building className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Digital Corp"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
                />
              </div>
            )}
            <p className="text-[10px] text-neutral-400 mt-1">
              Choose which of the client&apos;s companies this project belongs to.
            </p>
          </div>

          {/* Project Title */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Project / Service Title *
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Monthly Website Retainer & Hosting"
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 focus:border-emerald-800"
              />
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Payment Model / Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('monthly_recurring')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 ${
                  type === 'monthly_recurring'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                    : 'bg-white border-neutral-200 text-neutral-600'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Monthly Recurring</span>
              </button>
              <button
                type="button"
                onClick={() => setType('one_time')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 ${
                  type === 'one_time'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                    : 'bg-white border-neutral-200 text-neutral-600'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>One-Time Project</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Expected Amount ($) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value)}
                  placeholder="2500"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 focus:border-emerald-800"
                />
              </div>
            </div>

            {type === 'monthly_recurring' ? (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Billing Day of Month
                </label>
                <select
                  value={billingCycleDay}
                  onChange={(e) => setBillingCycleDay(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 bg-white"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      Day {day} of month
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Target Due Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Project Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 bg-white"
            >
              <option value="active">Active (Ongoing)</option>
              <option value="pending">Pending Kickoff</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed / Ended</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Notes / Deliverable Details
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Scope includes 20 hours/mo development & AWS server maintenance..."
              className="w-full p-3 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 focus:border-emerald-800"
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
              {isSubmitting ? 'Saving...' : editingProject ? 'Update Project' : 'Save Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
