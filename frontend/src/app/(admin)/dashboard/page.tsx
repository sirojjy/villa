'use client';

import { useAuthStore } from '@/store/auth';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
          Welcome back, <span className="text-amber-500">{user?.name}</span> 👋
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Here's what's happening at SV Villa today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder Stat Cards */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:border-amber-500/50 hover:bg-slate-900 transition-all group">
            <div className="w-12 h-12 bg-slate-800 rounded-2xl mb-4 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
               <LayoutDashboard className="w-6 h-6" />
            </div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Module Placeholder</p>
            <h3 className="text-2xl font-bold text-white mt-1">Coming Soon</h3>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mb-6">
          <LayoutDashboard className="w-10 h-10 text-slate-700" />
        </div>
        <h2 className="text-2xl font-bold text-slate-300">Phase 3: Dashboard Analytics</h2>
        <p className="text-slate-500 max-w-md mt-2">
          The full dashboard with real-time analytics, charts, and financial reports will be implemented in Phase 3 of development.
        </p>
      </div>
    </div>
  );
}
