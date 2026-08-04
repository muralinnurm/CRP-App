import React, { useState } from 'react';
import { 
  Briefcase, 
  Search, 
  Plus, 
  RefreshCw, 
  Clock, 
  CreditCard, 
  Edit2, 
  Trash2, 
  Calendar, 
  DollarSign,
  Filter,
  Building
} from 'lucide-react';
import { Project, Client, ProjectType, ProjectStatus } from '../types';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  onOpenAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
  onOpenAddPaymentForProject: (clientId: string, projectId: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  clients,
  onOpenAddProject,
  onEditProject,
  onDeleteProject,
  onOpenAddPaymentForProject,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'monthly_recurring' | 'one_time'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.client_name && p.client_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.company_name && p.company_name.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'all' ? true : p.type === typeFilter;
    const matchesStatus = statusFilter === 'all' ? true : p.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project title, client, or company..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
          />
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Type Filter Pills */}
          <div className="flex bg-neutral-100 p-1 rounded-xl">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                typeFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              All ({projects.length})
            </button>
            <button
              onClick={() => setTypeFilter('monthly_recurring')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                typeFilter === 'monthly_recurring'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <RefreshCw className="w-3 h-3 text-emerald-700" />
              <span>Monthly Retainers</span>
            </button>
            <button
              onClick={() => setTypeFilter('one_time')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                typeFilter === 'one_time'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Clock className="w-3 h-3 text-emerald-700" />
              <span>One-Time</span>
            </button>
          </div>

          <button
            onClick={onOpenAddProject}
            className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project / Service</span>
          </button>
        </div>
      </div>

      {/* Projects List / Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Service / Project Title</th>
                <th className="py-3 px-4">Client & Linked Company</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Expected Income</th>
                <th className="py-3 px-4">Billing / Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-neutral-900">
                    <div>
                      <span>{project.title}</span>
                      {project.notes && (
                        <p className="text-[10px] text-neutral-400 font-normal truncate max-w-xs mt-0.5">
                          {project.notes}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-neutral-700 font-medium">
                    <div>
                      <p className="text-xs font-bold text-neutral-900">{project.client_name}</p>
                      {project.company_name && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold mt-0.5 border border-emerald-200/60">
                          <Building className="w-2.5 h-2.5 text-emerald-700" />
                          <span>{project.company_name}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        project.type === 'monthly_recurring'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-blue-50 text-blue-800'
                      }`}
                    >
                      {project.type === 'monthly_recurring' ? (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          <span>Monthly Recurring</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>One-Time</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-neutral-900 text-sm">
                    ${project.expected_amount.toLocaleString()}
                    {project.type === 'monthly_recurring' && (
                      <span className="text-[10px] font-normal text-neutral-400">/mo</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-500">
                    {project.type === 'monthly_recurring' ? (
                      <span>Day {project.billing_cycle_day || 1} of month</span>
                    ) : (
                      <span>{project.due_date || 'No due date'}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        project.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : project.status === 'completed'
                          ? 'bg-neutral-100 text-neutral-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onOpenAddPaymentForProject(project.client_id, project.id)}
                        className="px-2.5 py-1 bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                      >
                        <CreditCard className="w-3 h-3 text-emerald-300" />
                        <span>Record Payment</span>
                      </button>
                      <button
                        onClick={() => onEditProject(project)}
                        className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete project "${project.title}"?`)) {
                            onDeleteProject(project.id);
                          }
                        }}
                        className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Project"
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

        {filteredProjects.length === 0 && (
          <div className="py-12 text-center p-8">
            <Briefcase className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-700">No projects or services found</h3>
            <p className="text-xs text-neutral-400 mt-1 mb-4">
              Create a new monthly recurring retainer or one-time project.
            </p>
            <button
              onClick={onOpenAddProject}
              className="px-4 py-2 bg-emerald-900 text-white rounded-xl text-xs font-medium inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project / Service</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
