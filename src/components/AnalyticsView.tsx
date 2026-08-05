import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  DollarSign, 
  Users, 
  Briefcase, 
  CreditCard,
  Calendar,
  Filter,
  Check
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
  Cell
} from 'recharts';

interface AnalyticsViewProps {
  metrics: DashboardMetrics;
  clients: Client[];
  projects: Project[];
  payments: Payment[];
}

export type TimeframeOption = 'this_week' | 'this_month' | 'last_6_months' | 'last_year' | 'all';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  metrics,
  clients,
  projects,
  payments,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('this_month');

  // Helper to get date boundaries for timeframes
  const isPaymentInTimeframe = (pDateStr: string, tf: TimeframeOption) => {
    if (tf === 'all') return true;
    const pDate = new Date(pDateStr);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (tf === 'this_week') {
      const day = now.getDay();
      const mondayDiff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(currentYear, currentMonth, mondayDiff, 0, 0, 0, 0);
      const endOfWeek = new Date(currentYear, currentMonth, mondayDiff + 6, 23, 59, 59, 999);
      return pDate >= startOfWeek && pDate <= endOfWeek;
    }

    if (tf === 'this_month') {
      return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth;
    }

    if (tf === 'last_6_months') {
      const start6m = new Date(currentYear, currentMonth - 5, 1, 0, 0, 0, 0);
      return pDate >= start6m;
    }

    if (tf === 'last_year') {
      const start1y = new Date(currentYear - 1, currentMonth, 1, 0, 0, 0, 0);
      return pDate >= start1y;
    }

    return true;
  };

  // Filtered payments based on selected timeframe
  const validPayments = payments.filter(
    (p) => p.status === 'received' && isPaymentInTimeframe(p.payment_date, timeframe)
  );

  // Total Revenue collected in timeframe
  const totalRevenueInPeriod = validPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Average payment value in timeframe
  const avgPaymentValue =
    validPayments.length > 0 ? Math.round(totalRevenueInPeriod / validPayments.length) : 0;

  // Top Paying Client in timeframe
  const clientRevenueMapInPeriod = new Map<string, number>();
  validPayments.forEach((p) => {
    const curr = clientRevenueMapInPeriod.get(p.client_id) || 0;
    clientRevenueMapInPeriod.set(p.client_id, curr + Number(p.amount));
  });

  const clientMap = new Map<string, string>(clients.map((c) => [c.id, c.name]));
  let topClientName = 'N/A';
  let topClientRevenue = 0;

  clientRevenueMapInPeriod.forEach((revenue, clientId) => {
    if (revenue > topClientRevenue) {
      topClientRevenue = revenue;
      topClientName = clientMap.get(clientId) || 'Client';
    }
  });

  // Client Revenue breakdown for Pie chart (filtered to timeframe)
  const clientRevenueData = Array.from(clientRevenueMapInPeriod.entries())
    .map(([clientId, value]) => ({
      name: clientMap.get(clientId) || 'Unknown Client',
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const COLORS = ['#064e3b', '#047857', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

  // Payment method usage in timeframe
  const methodMap = new Map<string, number>();
  validPayments.forEach((p) => {
    const method = (p.payment_method || 'Bank Transfer').replace('_', ' ');
    const curr = methodMap.get(method) || 0;
    methodMap.set(method, curr + Number(p.amount));
  });

  const methodData = Array.from(methodMap.entries()).map(([method, amount]) => ({
    method,
    amount,
  }));

  // Chart data generation dynamic by timeframe
  const getChartData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (timeframe === 'this_week') {
      const day = now.getDay();
      const mondayDiff = now.getDate() - day + (day === 0 ? -6 : 1);
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      return dayNames.map((name, i) => {
        const d = new Date(currentYear, currentMonth, mondayDiff + i);
        const y = d.getFullYear();
        const m = d.getMonth();
        const dateNum = d.getDate();

        const received = payments
          .filter((p) => {
            if (p.status !== 'received') return false;
            const pD = new Date(p.payment_date);
            return pD.getFullYear() === y && pD.getMonth() === m && pD.getDate() === dateNum;
          })
          .reduce((sum, p) => sum + Number(p.amount), 0);

        return {
          label: `${name} ${d.getDate()}`,
          received,
          expected: Math.round(metrics.totalMRR / 30),
        };
      });
    }

    if (timeframe === 'this_month') {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const weeks = [
        { label: 'Week 1 (1-7)', startDay: 1, endDay: 7 },
        { label: 'Week 2 (8-14)', startDay: 8, endDay: 14 },
        { label: 'Week 3 (15-21)', startDay: 15, endDay: 21 },
        { label: 'Week 4 (22+)', startDay: 22, endDay: daysInMonth },
      ];

      return weeks.map((w) => {
        const received = payments
          .filter((p) => {
            if (p.status !== 'received') return false;
            const pD = new Date(p.payment_date);
            return (
              pD.getFullYear() === currentYear &&
              pD.getMonth() === currentMonth &&
              pD.getDate() >= w.startDay &&
              pD.getDate() <= w.endDay
            );
          })
          .reduce((sum, p) => sum + Number(p.amount), 0);

        return {
          label: w.label,
          received,
          expected: Math.round(metrics.totalMRR / 4),
        };
      });
    }

    const numMonths = timeframe === 'last_year' ? 12 : timeframe === 'all' ? 12 : 6;
    return Array.from({ length: numMonths }).map((_, idx) => {
      const monthOffset = numMonths - 1 - idx;
      const targetDate = new Date(currentYear, currentMonth - monthOffset, 1);
      const tYear = targetDate.getFullYear();
      const tMonth = targetDate.getMonth();
      const monthLabel =
        targetDate.toLocaleString('en-US', { month: 'short' }) +
        (numMonths > 6 ? ` '${targetDate.getFullYear().toString().slice(2)}` : '');

      const receivedInMonth = payments
        .filter((p) => {
          if (p.status !== 'received') return false;
          const d = new Date(p.payment_date);
          return d.getFullYear() === tYear && d.getMonth() === tMonth;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        label: monthLabel,
        received: receivedInMonth,
        expected: metrics.totalMRR,
      };
    });
  };

  const chartData = getChartData();

  const getTimeframeTitle = () => {
    switch (timeframe) {
      case 'this_week':
        return 'This Week';
      case 'this_month':
        return 'This Month';
      case 'last_6_months':
        return 'Last 6 Months';
      case 'last_year':
        return 'Last Year';
      case 'all':
        return 'All Time';
    }
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      {/* Timeframe Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Analytics Timeframe</h2>
            <p className="text-xs text-neutral-400">Filter metrics, charts, and revenue insights</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setTimeframe('this_week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              timeframe === 'this_week'
                ? 'bg-emerald-950 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeframe('this_month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              timeframe === 'this_month'
                ? 'bg-emerald-950 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeframe('last_6_months')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              timeframe === 'last_6_months'
                ? 'bg-emerald-950 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            Last 6 Months
          </button>
          <button
            onClick={() => setTimeframe('last_year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              timeframe === 'last_year'
                ? 'bg-emerald-950 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            Last Year
          </button>
          <button
            onClick={() => setTimeframe('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              timeframe === 'all'
                ? 'bg-emerald-950 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
            Collected Revenue ({getTimeframeTitle()})
          </div>
          <div className="text-[45px] font-normal text-emerald-900 leading-none my-2">
            ${totalRevenueInPeriod.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-2">
            Received in {getTimeframeTitle().toLowerCase()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
            Average Payment Value
          </div>
          <div className="text-[45px] font-normal text-neutral-900 leading-none my-2">
            ${avgPaymentValue.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-500 font-medium mt-2">
            Across {validPayments.length} transactions
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
            Top Client ({getTimeframeTitle()})
          </div>
          <div className="text-lg font-bold text-neutral-900 truncate">
            {topClientName}
          </div>
          <p className="text-[11px] text-emerald-700 font-bold mt-2">
            ${topClientRevenue.toLocaleString()} Total
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
            Total Monthly Recurring
          </div>
          <div className="text-[45px] font-normal text-neutral-900 leading-none my-2">
            ${metrics.totalMRR.toLocaleString()}
            <span className="text-xs text-neutral-400 font-normal">/mo</span>
          </div>
          <p className="text-[11px] text-neutral-500 font-medium mt-2">
            Contracted active retainers
          </p>
        </div>
      </div>

      {/* Main Revenue Growth Chart */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Income Collection & Target ({getTimeframeTitle()})
            </h3>
            <p className="text-xs text-neutral-400">
              Comparing actual collected payments against target revenue for {getTimeframeTitle().toLowerCase()}
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
            <BarChart data={chartData} barCategoryGap="20%">
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
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
            Client Revenue Distribution ({getTimeframeTitle()})
          </h3>
          <p className="text-xs text-neutral-400 mb-4">
            Percentage share of collected income by client
          </p>

          <div className="h-56 w-full flex items-center justify-center">
            {clientRevenueData.length > 0 ? (
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
            ) : (
              <div className="text-center py-8 text-neutral-400 text-xs font-medium">
                No payment transactions recorded for {getTimeframeTitle().toLowerCase()}.
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <h3 className="text-sm font-bold text-neutral-900 mb-1">
            Income by Payment Method ({getTimeframeTitle()})
          </h3>
          <p className="text-xs text-neutral-400 mb-4">
            Total revenue collected across transfer methods
          </p>

          <div className="space-y-4 pt-2">
            {methodData.length > 0 ? (
              methodData.map(({ method, amount }) => {
                const pct = totalRevenueInPeriod > 0 ? Math.round((amount / totalRevenueInPeriod) * 100) : 0;

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
              })
            ) : (
              <div className="text-center py-8 text-neutral-400 text-xs font-medium">
                No payment methods data for {getTimeframeTitle().toLowerCase()}.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
