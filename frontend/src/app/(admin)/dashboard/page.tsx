'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useAuthStore } from '@/store/auth';
import { 
  TrendingUp, 
  Users, 
  Home, 
  DollarSign, 
  Loader2, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Building2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { api } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const fetcher = (url: string) => api.get<any>(url);

export default function DashboardPage() {
  // All hooks at the top — always called in the same order
  const [mounted, setMounted] = useState(false);
  const { user: authUser } = useAuthStore();
  const { data: res, error: swrError, isLoading } = useSWR('/dashboard/summary', fetcher);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loader until client-side hydration is complete
  // This prevents server/client mismatch for auth-state-dependent UI
  if (!mounted || isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  if (swrError || !res?.success) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 flex flex-col items-center gap-4 max-w-md">
          <AlertCircle className="w-12 h-12" />
          <div>
            <p className="font-bold text-lg">Dashboard Error</p>
            <p className="text-sm opacity-80 mt-1">{res?.message || swrError?.message || 'Failed to load dashboard metrics.'}</p>
          </div>
        </div>
        <button onClick={() => window.location.reload()} className="text-amber-500 hover:underline text-sm font-bold bg-amber-500/10 px-6 py-2 rounded-full transition-all">Retry Connection</button>
      </div>
    );
  }

  const { metrics, charts, recentActivity } = res.data;
  const isInvestor = authUser?.role === 'investor';

  const revenueGrowth = metrics.prevRevenue > 0 
    ? ((metrics.currentRevenue - metrics.prevRevenue) / metrics.prevRevenue) * 100 
    : 0;

  const occupancyRate = (metrics.occupancy.occupied / (metrics.occupancy.ready + metrics.occupancy.occupied + metrics.occupancy.maintenance || 1)) * 100;

  const pieData = [
    { name: 'Ready', value: metrics.occupancy.ready, color: '#10b981' },
    { name: 'Occupied', value: metrics.occupancy.occupied, color: '#f59e0b' },
    { name: 'Maintenance', value: metrics.occupancy.maintenance, color: '#ef4444' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Executive Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Welcome back. Monitoring real-time performance across your villas.</p>
      </div>

      {/* Metric Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isInvestor ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-6`}>
        {!isInvestor && (
          <MetricCard 
            title="Monthly Revenue"
            value={`Rp ${Number(metrics.currentRevenue).toLocaleString('id-ID')}`}
            icon={DollarSign}
            color="amber"
            trend={revenueGrowth >= 0 ? 'up' : 'down'}
            trendValue={`${Math.abs(revenueGrowth).toFixed(1)}%`}
          />
        )}
        <MetricCard 
          title="Total Bookings"
          value={metrics.totalBookings.toLocaleString('id-ID')}
          icon={Calendar}
          color="blue"
        />
        <MetricCard 
          title="Live Occupancy"
          value={`${Math.round(occupancyRate)}%`}
          icon={Home}
          color="emerald"
        />
        {!isInvestor && (
          <MetricCard 
            title="Active Users"
            value="4"
            icon={Users}
            color="purple"
          />
        )}
      </div>

      <div className={`grid grid-cols-1 ${isInvestor ? '' : 'lg:grid-cols-3'} gap-8`}>
        {/* Revenue Chart — hidden for Investor */}
        {!isInvestor && (
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-2xl shadow-sm dark:shadow-2xl overflow-hidden relative group transition-colors">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Revenue Trend</h3>
                <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Laporan Harian (14 Hari Terakhir)</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400"><TrendingUp className="w-5 h-5 text-amber-500" /></div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.daily}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:stroke-slate-800" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `Rp ${val >= 1000000 ? (val/1000000).toFixed(1)+'jt' : val.toLocaleString('id-ID')}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderColor: '#e2e8f0', 
                      borderRadius: '20px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Income']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#f59e0b" 
                    strokeWidth={5} 
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Unit Status Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-2xl shadow-sm dark:shadow-2xl flex flex-col items-center transition-colors">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 self-start">Unit Status</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '16px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-4 w-full mt-6">
            {pieData.map(item => (
              <div key={item.name} className="flex justify-between items-center text-sm p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{item.name}</span>
                </div>
                <span className="text-slate-900 dark:text-white font-bold">{item.value} Units</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity — hidden for Investor */}
      {!isInvestor && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl transition-colors">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
            <button className="text-amber-500 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500/10 px-4 py-2 rounded-full transition-all">View All</button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentActivity.map((activity: any) => (
              <div key={activity.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors gap-4">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    <Users className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-bold text-lg leading-tight">{activity.guestName}</p>
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 text-xs mt-1">
                      <span className="flex items-center gap-1 font-medium"><Building2 className="w-3.5 h-3.5" /> {activity.unit?.project?.name} — {activity.unit?.name}</span>
                      <span className="hidden md:inline w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(activity.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left md:text-right bg-emerald-500/5 md:bg-transparent p-3 md:p-0 rounded-2xl md:rounded-none">
                  <p className="text-emerald-500 font-mono font-bold text-lg">Rp {parseFloat(activity.total).toLocaleString('id-ID')}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-1 font-extrabold">{activity.method}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, trend, trendValue }: any) {
  const bgStyles: any = {
    amber: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/10 dark:text-amber-500",
    blue: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/10 dark:text-blue-500",
    emerald: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-500",
    purple: "bg-purple-500/10 text-purple-500 dark:bg-purple-500/10 dark:text-purple-500",
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-2xl group hover:border-slate-200 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className={cn("p-4 rounded-xl transition-colors", bgStyles[color])}>
          <Icon className="w-6 h-6 border-none" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold",
            trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-slate-500 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
    </div>
  );
}
