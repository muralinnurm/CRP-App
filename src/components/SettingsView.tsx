import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Download, 
  RefreshCw, 
  Check, 
  FileCode,
  FileSpreadsheet,
  User,
  Edit3,
  Trash2,
  Lock,
  Building,
  Mail,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { Client, Project, Payment, UserProfile } from '../types';
import { dataService } from '../lib/dataService';

interface SettingsViewProps {
  clients: Client[];
  projects: Project[];
  payments: Payment[];
  profile: UserProfile;
  onOpenEditProfile: () => void;
  onOpenAuth: () => void;
  onResetDemoData: () => Promise<void>;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  clients,
  projects,
  payments,
  profile,
  onOpenEditProfile,
  onOpenAuth,
  onResetDemoData,
  onRefreshData,
}) => {
  const [successMsg, setSuccessMsg] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Export JSON
  const handleExportJSON = () => {
    const data = {
      profile,
      clients,
      projects,
      payments,
      exported_at: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client_portal_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMsg('JSON data exported successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Export Payments CSV
  const handleExportPaymentsCSV = () => {
    const headers = ['ID', 'Date', 'Client', 'Project', 'Amount', 'Method', 'Ref ID', 'Status', 'Notes'];
    const rows = payments.map((p) => [
      p.id,
      p.payment_date,
      `"${p.client_name || ''}"`,
      `"${p.project_title || ''}"`,
      p.amount,
      p.payment_method,
      `"${p.reference_id || ''}"`,
      p.status,
      `"${p.notes || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'application/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMsg('Payments CSV exported successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleClearAllData = async () => {
    if (confirm('Are you sure you want to clear all clients, projects, and payment records? This cannot be undone.')) {
      setIsClearing(true);
      await dataService.clearAllData();
      setIsClearing(false);
      onRefreshData();
      setSuccessMsg('All database records cleared successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleSeedSampleData = async () => {
    if (confirm('Do you want to seed sample clients and projects into your database?')) {
      setIsSeeding(true);
      await dataService.seedSampleData();
      setIsSeeding(false);
      onRefreshData();
      setSuccessMsg('Sample test data populated!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-white font-bold text-lg flex items-center justify-center overflow-hidden shadow-xs border border-emerald-800">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                {profile.fullName || 'User Profile'}
              </h3>
              <p className="text-xs text-neutral-500">
                {profile.email || 'No email set'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAuth}
              className="px-3 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-800 rounded-xl text-xs font-semibold transition-colors"
            >
              Sign In / Switch
            </button>
            <button
              onClick={onOpenEditProfile}
              className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Own Profile</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-bold uppercase mb-1">
              <Building className="w-3 h-3 text-emerald-800" />
              <span>Agency</span>
            </div>
            <p className="text-xs font-bold text-neutral-900 truncate">
              {profile.companyName || 'Not specified'}
            </p>
          </div>

          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-bold uppercase mb-1">
              <Briefcase className="w-3 h-3 text-emerald-800" />
              <span>Job Title</span>
            </div>
            <p className="text-xs font-bold text-neutral-900 truncate">
              {profile.jobTitle || 'Freelancer'}
            </p>
          </div>

          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-bold uppercase mb-1">
              <DollarSign className="w-3 h-3 text-emerald-800" />
              <span>Currency</span>
            </div>
            <p className="text-xs font-bold text-neutral-900 truncate">
              {profile.currencySymbol || '$'} (USD)
            </p>
          </div>

          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-bold uppercase mb-1">
              <Mail className="w-3 h-3 text-emerald-800" />
              <span>Account</span>
            </div>
            <p className="text-xs font-bold text-neutral-900 truncate">
              {profile.id ? 'Authenticated' : 'Local Session'}
            </p>
          </div>
        </div>
      </div>

      {/* Database Engine Status Banner */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-white flex items-center justify-center shrink-0">
            <Database className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-900">
                Storage Engine (SoloClientPortal)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                Local Storage Active
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              All client, project, and payment data is saved securely in local browser storage.
            </p>
          </div>
        </div>
      </div>

      {/* Data Export & Backup */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">
            Data Export & Backup
          </h3>
          <p className="text-xs text-neutral-400">
            Export your complete client income records for reporting or backup
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileSpreadsheet className="w-4 h-4 text-emerald-800" />
                <h4 className="text-xs font-bold text-neutral-900">
                  Export Payments Ledger (CSV)
                </h4>
              </div>
              <p className="text-[11px] text-neutral-500 mb-3">
                Download payment history table formatted for Excel, Google Sheets, or tax reporting.
              </p>
            </div>
            <button
              onClick={handleExportPaymentsCSV}
              className="py-2 px-3 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileCode className="w-4 h-4 text-emerald-800" />
                <h4 className="text-xs font-bold text-neutral-900">
                  Export Full Database Backup (JSON)
                </h4>
              </div>
              <p className="text-[11px] text-neutral-500 mb-3">
                Download complete backup including profile, clients, projects, and payments.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="py-2 px-3 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Database Reset / Clear Options */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-neutral-900">
          Database Management
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
          <div>
            <h4 className="text-xs font-bold text-neutral-900">Clear All Records</h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              Wipe all client, project, and payment entries for a completely clean database.
            </p>
          </div>
          <button
            onClick={handleClearAllData}
            disabled={isClearing}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>{isClearing ? 'Clearing...' : 'Clear All Data'}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
          <div>
            <h4 className="text-xs font-bold text-neutral-900">Seed Sample Test Data</h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              Optionally populate sample clients and projects to test dashboard calculations.
            </p>
          </div>
          <button
            onClick={handleSeedSampleData}
            disabled={isSeeding}
            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isSeeding ? 'Seeding...' : 'Seed Sample Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
