import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  DollarSign, 
  Users, 
  Briefcase, 
  CreditCard 
} from 'lucide-react';
import { DashboardMetrics, Client, Project, Payment } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface AnalyticsViewProps {
  metrics: DashboardMetrics;
  clients: Client[];
  projects: Project[];
  payments: Payment[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  metrics,
  clients,
  projects,
  payments,
}) => {
  // Client Revenue breakdown for Pie chart
  const clientRevenueData = metrics.highestPayingClients
    .filter((c) => c.totalRevenue > 0)
    .map((c) => ({
      name: c.client.name,
      value: c.totalRevenue,
    }));

  const COLORS = ['#064e3b', '#047857', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

  // Average payment value
  const validPayments = payments.filter((p) => p.status === 'received');
  const avgPaymentValue =
    validPayments.length > 0
      ? Math.round(
          validPayments.reduce((sum, p) => sum + Number(p.amount), 0) / validPayments.length
        )
      : 0;

  // Payment method usage
  const methodMap = new Map<string, number>();
  validPayments.forEach((p) => {
    const method = p.payment_method.replace('_', ' ');
    const curr = methodMap.get(method) || 0;
    methodMap.set(method, curr + Number(p.amount));
  });

  const methodData = Array.from(methodMap.entries()).map(([method, amount]) => ({
    method,
    amount,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
            Total Monthly Recurring
          </div>
          <div className="text-2xl font-black text-emerald-900">
            ${metrics.totalMRR.toLocaleString()}
            <span className="text-xs text-neutral-400 font-normal">/mo</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-2">
            Contracted Retainer Value
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
            Average Payment Value
          </div>
          <div className="text-2xl font-black text-neutral-900">
            ${avgPaymentValue.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-500 font-medium mt-2">
            Across {validPayments.length} transactions
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
            Top Paying Client
          </div>
          <div className="text-lg font-black text-neutral-900 truncate">
            {metrics.highestPayingClients[0]?.client.name || 'N/A'}
          </div>
          <p className="text-[11px] text-emerald-700 font-bold mt-2">
            ${metrics.highestPayingClients[0]?.totalRevenue.toLocaleString() || 0} Total
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
            Active Retainers
          </div>
          <div className="text-2xl font-black text-neutral-900">
            {projects.filter((p) => p.type === 'monthly_recurring' && p.status === 'active').length}
          </div>
          <p className="text-[11px] text-neutral-500 font-medium mt-2">
            Recurring client subscriptions
          </p>
        </div>
      </div>

      {/* Main Revenue Growth Chart (Area + Bar) */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              6-Month Income Collection & Projection
            </h3>
            <p className="text-xs text-neutral-400">
              Comparing actual collected payments against MRR expectations
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-900" />
              <span>Collected Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-300" />
              <span>Expected Target</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.monthlyChartData} barCategoryGap="20%">
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${v / 1000}k`}
              />
              <Tooltip
                formatter={(val: any) => [`$${val.toLocaleString()}`, 'Amount']}
                contentStyle={{
                  backgroundColor: '#064e3b',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="received" name="Collected Revenue" fill="#064e3b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expected" name="Expected Target" fill="#6ee7b7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Client Revenue Distribution + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Share Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <h3 className="text-sm font-bold text-neutral-900 mb-1">
            Client Revenue Distribution
          </h3>
          <p className="text-xs text-neutral-400 mb-4">
            Percentage share of total income by client
          </p>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clientRevenueData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {clientRevenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <h3 className="text-sm font-bold text-neutral-900 mb-1">
            Income by Payment Method
          </h3>
          <p className="text-xs text-neutral-400 mb-4">
            Total revenue collected across transfer methods
          </p>

          <div className="space-y-4 pt-2">
            {methodData.map(({ method, amount }) => {
              const totalAll = validPayments.reduce((sum, p) => sum + Number(p.amount), 0);
              const pct = totalAll > 0 ? Math.round((amount / totalAll) * 100) : 0;

              return (
                <div key={method} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-neutral-800">
                    <span className="capitalize">{method}</span>
                    <span>
                      ${amount.toLocaleString()}{' '}
                      <span className="text-neutral-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-800 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
