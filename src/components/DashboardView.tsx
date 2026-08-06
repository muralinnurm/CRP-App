import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  TrendingUp, 
  CreditCard, 
  Users, 
  Briefcase, 
  DollarSign, 
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  MoreVertical,
  Check,
  Pencil
} from 'lucide-react';
import { DashboardMetrics, Client, Project, Payment } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ClientAvatar } from './ClientAvatar';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  clients: Client[];
  projects: Project[];
  payments: Payment[];
  onOpenAddPayment: () => void;
  onOpenAddProject: () => void;
  onOpenAddClient: () => void;
  onSelectClient: (client: Client) => void;
  onSelectTab: (tab: string) => void;
}

const getOrdinalSuffix = (day: number) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:  return 'st';
    case 2:  return 'nd';
    case 3:  return 'rd';
    default: return 'th';
  }
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  clients,
  projects,
  payments,
  onOpenAddPayment,
  onOpenAddProject,
  onOpenAddClient,
  onSelectClient,
  onSelectTab,
}) => {
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });

  // Monthly income goal state with persistence
  const [monthlyGoal, setMonthlyGoal] = useState<number | null>(() => {
    const saved = localStorage.getItem('income_goal');
    if (saved === 'none') return null;
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 15000;
  });

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  const handleOpenGoalModal = () => {
    setGoalInput(monthlyGoal ? monthlyGoal.toString() : '');
    setIsEditingGoal(true);
  };

  // Recurring vs One-time project count
  const activeRecurringProjects = projects.filter((p) => p.type === 'monthly_recurring' && p.status === 'active');
  const recurringCount = activeRecurringProjects.length;
  const oneTimeCount = projects.filter((p) => p.type === 'one_time' && p.status === 'active').length;
  const totalActiveProj = recurringCount + oneTimeCount;
  const recurringPercent = totalActiveProj > 0 ? Math.round((recurringCount / totalActiveProj) * 100) : 0;

  // Custom colors for bars matching the inspiration image (Forest green gradient shades & striped pattern effect)
  const barColors = ['#e2e8f0', '#10b981', '#34d399', '#064e3b', '#6ee7b7', '#d1fae5'];

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      {/* 1. TOP METRICS CARDS ROW (Exact match to top 4 cards in design inspiration) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total MRR */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs relative group hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-neutral-500 tracking-wide uppercase">
              Total Monthly Recurring
            </span>
            <button
              onClick={() => onSelectTab('projects')}
              className="w-8 h-8 rounded-full bg-neutral-100 group-hover:bg-emerald-900 group-hover:text-white text-neutral-600 flex items-center justify-center transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-[45px] font-normal text-neutral-900 tracking-tight leading-[45px]" style={{ fontSize: '45px', lineHeight: '45px', fontWeight: 'normal' }}>
              ${metrics.totalMRR.toLocaleString()}
            </span>
            <span className="text-xs text-neutral-400 font-medium">/mo</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-800">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span>Active MRR Contract Revenue</span>
          </div>
        </div>

        {/* Card 2: Payments Received This Month */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs relative group hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-neutral-500 tracking-wide uppercase">
              Received This Month
            </span>
            <button
              onClick={() => onSelectTab('payments')}
              className="w-8 h-8 rounded-full bg-neutral-100 group-hover:bg-emerald-900 group-hover:text-white text-neutral-600 flex items-center justify-center transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[45px] font-normal text-neutral-900 tracking-tight mb-3 leading-[45px]" style={{ fontSize: '45px', lineHeight: '45px', fontWeight: 'normal' }}>
            ${metrics.paymentsReceivedThisMonth.toLocaleString()}
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Collected in {currentMonthName}</span>
          </div>
        </div>

        {/* Card 3: Outstanding Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs relative group hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-neutral-500 tracking-wide uppercase">
              Outstanding Revenue
            </span>
            <button
              onClick={() => onSelectTab('payments')}
              className="w-8 h-8 rounded-full bg-neutral-100 group-hover:bg-emerald-900 group-hover:text-white text-neutral-600 flex items-center justify-center transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[45px] font-normal text-neutral-900 tracking-tight mb-3 leading-[45px]" style={{ fontSize: '45px', lineHeight: '45px', fontWeight: 'normal' }}>
            ${metrics.outstandingRevenue.toLocaleString()}
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-[11px] font-semibold text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Expected / Pending</span>
          </div>
        </div>

        {/* Card 4: Active Clients & Projects */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs relative group hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-neutral-500 tracking-wide uppercase">
              Active Client Portfolio
            </span>
            <button
              onClick={() => onSelectTab('clients')}
              className="w-8 h-8 rounded-full bg-neutral-100 group-hover:bg-emerald-900 group-hover:text-white text-neutral-600 flex items-center justify-center transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[45px] font-normal text-neutral-900 tracking-tight mb-3 leading-[45px] flex items-baseline gap-2" style={{ fontSize: '45px', lineHeight: '45px', fontWeight: 'normal' }}>
            <span>{metrics.activeClientsCount}</span>
            <span className="text-sm font-semibold text-neutral-400">Clients</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-700">
            <span>{metrics.activeProjectsCount} Active Projects/Services</span>
          </div>
        </div>
      </div>

      {/* 2. SECOND ROW: Revenue Analytics Bar Chart + Reminders + Projects Quick Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Project Analytics Bar Chart (7 Cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Revenue Analytics
              </h3>
              <p className="text-xs text-neutral-400">
                Monthly income collection comparison
              </p>
            </div>
            <button
              onClick={() => onSelectTab('analytics')}
              className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyChartData} barCategoryGap="25%">
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Income']}
                  contentStyle={{
                    backgroundColor: '#064e3b',
                    borderColor: '#064e3b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="received" radius={[8, 8, 0, 0]}>
                  {metrics.monthlyChartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === metrics.monthlyChartData.length - 1 ? '#064e3b' : '#34d399'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Middle Card: Retainer / Billing Reminders (3 Cols) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-800 tracking-tight">
                Billing Cycle Reminders
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                Upcoming
              </span>
            </div>

            {activeRecurringProjects.length > 0 ? (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {activeRecurringProjects.slice(0, 3).map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                    <h4 className="font-bold text-xs text-neutral-900 leading-snug mb-1 truncate">
                      {p.client_name || 'Client'} — {p.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Billing Day: {p.billing_cycle_day ? `${p.billing_cycle_day}${getOrdinalSuffix(p.billing_cycle_day)}` : '1st'} of month (${(p.expected_amount || 0).toLocaleString()}/mo)
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-neutral-50 border border-dashed border-neutral-200 text-center py-6">
                <Clock className="w-6 h-6 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-neutral-600">No active billing cycles</p>
                <p className="text-[11px] text-neutral-400 mt-1 mb-2">Add a recurring project to track billing days</p>
                <button
                  onClick={onOpenAddProject}
                  className="text-xs text-emerald-800 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Recurring Project</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onOpenAddPayment}
            className="w-full mt-4 py-2.5 px-3 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-300" />
            <span>Record Payment Now</span>
          </button>
        </div>

        {/* Right Card: Quick Active Projects (3 Cols) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-800 tracking-tight">
                Active Services
              </span>
              <button
                onClick={onOpenAddProject}
                className="text-xs text-emerald-800 hover:underline font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {projects.length > 0 ? (
                projects.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs font-semibold text-neutral-900 truncate">
                        {p.title}
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate">
                        {p.client_name || 'Client'}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 shrink-0">
                      ${(p.expected_amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center py-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                  <Briefcase className="w-6 h-6 mx-auto mb-1 text-neutral-300" />
                  <p className="text-xs font-medium text-neutral-600">No active services</p>
                  <button
                    onClick={onOpenAddProject}
                    className="mt-2 text-xs font-bold text-emerald-800 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create service</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onSelectTab('projects')}
            className="w-full mt-3 py-2 text-center text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            View All Services →
          </button>
        </div>
      </div>

      {/* 3. THIRD ROW: Highest Paying Clients + Recurring Gauge + Timer/Tracker Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Highest-Paying Clients (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Highest-Paying Clients
              </h3>
              <p className="text-xs text-neutral-400">
                Top revenue contributors to your business
              </p>
            </div>
            <button
              onClick={onOpenAddClient}
              className="px-2.5 py-1 rounded-full border border-neutral-200 text-xs text-neutral-700 hover:bg-neutral-50 font-medium flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Member</span>
            </button>
          </div>

          <div className="space-y-3">
            {metrics.highestPayingClients.length > 0 ? (
              metrics.highestPayingClients.slice(0, 4).map(({ client, totalRevenue, mrr, projectCount }) => (
                <div
                  key={client.id}
                  onClick={() => onSelectClient(client)}
                  className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <ClientAvatar name={client.name} avatarUrl={client.avatar_url} className="w-9 h-9 text-xs" />
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 group-hover:text-emerald-900">
                        {client.name}
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        {client.company || 'Private Client'} • {projectCount} {projectCount === 1 ? 'service' : 'services'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-neutral-900">
                      ${totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      MRR: ${mrr.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-xl bg-neutral-50 border border-dashed border-neutral-200 text-center py-8">
                <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-neutral-600">No client data yet</p>
                <p className="text-[11px] text-neutral-400 mt-1 mb-3">Add your first client to start tracking revenue</p>
                <button
                  onClick={onOpenAddClient}
                  className="px-3 py-1.5 bg-emerald-900 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-emerald-950 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Add First Client</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Project Type Breakdown Donut Gauge (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 mb-1">
              Recurring vs One-Time Split
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Predictability ratio of your revenue stream
            </p>

            {/* Gauge Graphic */}
            <div className="flex flex-col items-center justify-center py-2 relative">
              <div className="w-32 h-32 rounded-full border-8 border-emerald-100 border-t-emerald-900 border-r-emerald-700 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-2xl font-black text-neutral-900">
                    {recurringPercent}%
                  </span>
                  <p className="text-[10px] text-neutral-400 font-semibold uppercase">
                    MRR Share
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-center">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-xs font-bold text-emerald-900 block">
                  {recurringCount} Services
                </span>
                <span className="text-[10px] text-emerald-700">
                  Monthly Recurring
                </span>
              </div>

              <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-100">
                <span className="text-xs font-bold text-neutral-800 block">
                  {oneTimeCount} Projects
                </span>
                <span className="text-[10px] text-neutral-500">
                  One-time Projects
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Quick Income Tracker */}
        <div className="lg:col-span-3 bg-white border border-neutral-200/80 p-5 rounded-2xl shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-500 tracking-wider uppercase">
                Income Goal Tracker
              </span>
              {monthlyGoal !== null ? (
                <button
                  onClick={handleOpenGoalModal}
                  style={{ backgroundColor: '#ffffff', width: '92.1875px', padding: 0, textAlign: 'center', fontSize: '12px' }}
                  className="h-7 font-semibold text-neutral-700 hover:text-emerald-800 bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Pencil className="w-3 h-3 text-neutral-600" />
                  <span>Edit Goal</span>
                </button>
              ) : (
                <button
                  onClick={handleOpenGoalModal}
                  style={{ backgroundColor: '#ffffff', width: '92.1875px', padding: 0, textAlign: 'center', fontSize: '12px' }}
                  className="h-7 font-semibold text-neutral-700 hover:text-emerald-800 bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-neutral-600" />
                  <span>Add Goal</span>
                </button>
              )}
            </div>

            {isEditingGoal ? (
              <div className="my-2 p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl space-y-2 animate-fadeIn">
                <label className="text-[11px] font-semibold text-neutral-700 block">
                  {monthlyGoal !== null ? 'Edit Monthly Goal ($)' : 'Set Monthly Goal ($)'}
                </label>
                <input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg font-medium text-neutral-900 focus:outline-none focus:border-emerald-600"
                  autoFocus
                />
                <div className="flex items-center justify-between pt-1">
                  {monthlyGoal !== null ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMonthlyGoal(null);
                        localStorage.setItem('income_goal', 'none');
                        setIsEditingGoal(false);
                      }}
                      className="text-[11px] font-medium text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  ) : <div />}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingGoal(false)}
                      className="px-2.5 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-200/80 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseFloat(goalInput);
                        if (!isNaN(val) && val > 0) {
                          setMonthlyGoal(val);
                          localStorage.setItem('income_goal', val.toString());
                        }
                        setIsEditingGoal(false);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : monthlyGoal !== null ? (
              <>
                <div className="text-[45px] font-normal tracking-tight text-neutral-900 mb-2 leading-none">
                  ${metrics.paymentsReceivedThisMonth.toLocaleString()}
                  <span className="text-xs text-neutral-400 font-normal"> / ${monthlyGoal.toLocaleString()}</span>
                </div>

                <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                  Target for {currentMonthName}: {Math.min(100, Math.round((metrics.paymentsReceivedThisMonth / monthlyGoal) * 100))}% achieved!
                </p>

                <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden mb-4">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((metrics.paymentsReceivedThisMonth / monthlyGoal) * 100))}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="text-[45px] font-normal tracking-tight text-neutral-900 mb-2 leading-none">
                  ${metrics.paymentsReceivedThisMonth.toLocaleString()}
                </div>

                <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                  No income goal set for {currentMonthName}. Click 'Add Goal' above to track your target.
                </p>

                <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden mb-4" />
              </>
            )}
          </div>


        </div>
      </div>
    </div>
  );
};
