'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { 
  Home, 
  MapPin, 
  ChevronRight, 
  Loader2,
  Building2,
  Users
} from 'lucide-react';
import { api } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const fetcher = (url: string) => api.get<any>(url).then(res => res.data);

export default function FrontDeskPage() {
  const { data: projects, isLoading } = useSWR('/projects', fetcher);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">Front Desk</h1>
        <p className="text-slate-400 mt-2">Monitor occupancy and manage check-ins across all villas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects?.map((item: any) => {
          const totalUnits = (item.counts.ready || 0) + (item.counts.occupied || 0) + (item.counts.maintenance || 0);
          const occupancyRate = totalUnits > 0 ? Math.round((item.counts.occupied / totalUnits) * 100) : 0;

          return (
            <div 
              key={item.id} 
              className="bg-slate-900/50 border border-slate-800 rounded-[32px] overflow-hidden group hover:border-amber-500/50 hover:bg-slate-900 transition-all duration-500 flex flex-col"
            >
              {/* Image Header */}
              <div className="h-48 relative overflow-hidden">
                <img 
                  src={item.photoUrl || '/villa-bg.png'} 
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    item.status === 'ready' ? "bg-emerald-500" : "bg-blue-500"
                  )} />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{item.status}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 flex flex-col flex-1">
                <div className="mb-6 flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{item.name}</h2>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{item.address || 'Location information not provided'}</span>
                  </div>
                </div>

                {/* Counters */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-center">
                    <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider mb-1">Ready</p>
                    <p className="text-white text-lg font-bold">{item.counts.ready || 0}</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-center">
                    <p className="text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-1">Busy</p>
                    <p className="text-white text-lg font-bold">{item.counts.occupied || 0}</p>
                  </div>
                  <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl text-center">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Maint</p>
                    <p className="text-white text-lg font-bold">{item.counts.maintenance || 0}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 mb-8">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span>Occupancy Rate</span>
                    <span className="text-amber-500">{occupancyRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                </div>

                {/* Action */}
                <Link 
                  href={`/front-desk/${item.id}`}
                  className="w-full bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group/btn"
                >
                  Unit Check-In / Out
                  <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
