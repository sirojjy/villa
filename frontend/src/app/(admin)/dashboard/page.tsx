'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
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
  BarChart,
  Bar,
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
  const [mounted, setMounted] = useState(false);
  const { data: res, error: swrError, isLoading } = useSWR('/dashboard/summary', fetcher);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  if (swrError || !res?.success) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[32px] text-red-500 flex flex-col items-center gap-4 max-w-md">
          <AlertCircle className="w-12 h-12" />
          <div>
            <p className="font-bold text-lg">Dashboard Error</p>
            <p className="text-sm opacity-80 mt-1">{res?.message || swrError?.message || 'Failed to load dashboard metrics. Please check your connection.'}</p>
          </div>
        </div>
        <button onClick={() => window.location.reload()} className="text-amber-500 hover:underline text-sm font-bold bg-amber-500/10 px-6 py-2 rounded-full transition-all">Retry Connection</button>
      </div>
    );
  }

  const { metrics, charts, recentActivity } = res.data;

  const revenueGrowth = metrics.prevRevenue > 0 
    ? ((metrics.currentRevenue - metrics.prevRevenue) / metrics.prevRevenue) * 100 
    : 0;

  const occupancyRate = (metrics.occupancy.occupied / (metrics.occupancy.ready + metrics.occupancy.occupied + metrics.occupancy.maintenance || 1)) * 100;

  const pieData = [
    { name: 'Ready', value: metrics.occupancy.ready, color: '#10b981' },
    { name: 'Occupied', value: metrics.occupancy.occupied, color: '#f59e0b' },
    { name: 'Maintenance', value: metrics.occupancy.maintenance, color: '#64748b' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Executive Dashboard</h1>
        <p className="text-slate-400 mt-2">Welcome back. Here is what is happening across your villas today.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Monthly Revenue"
          value={`Rp ${Number(metrics.currentRevenue).toLocaleString('id-ID')}`}
          icon={DollarSign}
          color="amber"
          trend={revenueGrowth >= 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(revenueGrowth).toFixed(1)}%`}
        />
        <MetricCard 
          title="Total Bookings"
          value={metrics.totalBookings.toString()}
          icon={Calendar}
          color="blue"
        />
        <MetricCard 
          title="Live Occupancy"
          value={`${Math.round(occupancyRate)}%`}
          icon={Home}
          color="emerald"
        />
        <MetricCard 
          title="Active Users"
          value="4"
          icon={Users}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-8 rounded-[40px] shadow-2xl overflow-hidden relative group">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-white">Revenue Trend</h3>
                <p className="text-slate-500 text-xs">Daily financial performance (last 14 days)</p>
              </div>
              <div className="p-2 bg-slate-800 rounded-xl text-slate-400"><TrendingUp className="w-5 h-5" /></div>
           </div>
           
           <div className="h-[300px] w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.daily}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      stroke="#475569" 
                      fontSize={10} 
                      tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    />
                    <YAxis stroke="#475569" fontSize={10} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '16px' }}
                      itemStyle={{ color: '#fff', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#f59e0b" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorIncome)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
           </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[40px] shadow-2xl flex flex-col items-center">
            <h3 className="text-xl font-bold text-white mb-8 self-start">Unit Breakdown</h3>
            <div className="h-[200px] w-full">
               {mounted && (
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      />
                    </PieChart>
                 </ResponsiveContainer>
               )}
            </div>
            <div className="grid grid-cols-1 gap-4 w-full mt-4">
               {pieData.map(item => (
                 <div key={item.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                       <span className="text-slate-400">{item.name}</span>
                    </div>
                    <span className="text-white font-bold">{item.value} Units</span>
                 </div>
               ))}
            </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-[40px] overflow-hidden">
         <div className="p-8 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Recent Activities</h3>
            <button className="text-amber-500 text-[10px] font-bold uppercase tracking-widest hover:underline">View All</button>
         </div>
         <div className="divide-y divide-slate-800">
            {recentActivity.map((activity: any) => (
              <div key={activity.id} className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
                        <Users className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-lg">{activity.guestName}</p>
                        <div className="flex items-center gap-3 text-slate-500 text-xs mt-1">
                           <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {activity.unit?.project?.name} - {activity.unit?.name}</span>
                           <span className="w-1 h-1 bg-slate-700 rounded-full" />
                           <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Checked in {new Date(activity.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-emerald-400 font-mono font-bold">Rp {parseFloat(activity.total).toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-1 font-bold">{activity.method}</p>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, trend, trendValue }: any) {
  const colors: any = {
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[40px] group hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className={cn("p-4 rounded-3xl", `${colors[color]}/10`, `text-${color}-500`)}>
           <Icon className="w-6 h-6" />
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
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
    </div>
  );
}
