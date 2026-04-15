'use client';

import { useState, useEffect, Suspense } from 'react';
import useSWR from 'swr';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  MapPin, 
  ChevronRight, 
  Loader2,
  Building2,
  Search,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const fetcher = (url: string) => api.get<any>(url).then(res => res.data);

function FrontDeskContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'projects' | 'units'>(
    (searchParams.get('view') as 'projects' | 'units') || 'projects'
  );
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(searchParams.get('projectId') || '');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const { data: units, isLoading: unitsLoading } = useSWR(
    viewMode === 'units' ? `/units?search=${searchTerm}&project_id=${selectedProjectId}&status=${selectedStatus}` : null, 
    fetcher
  );
  const { data: projects, isLoading: projectsLoading } = useSWR('/projects', fetcher);

  // Sync state with URL parameters
  useEffect(() => {
    const viewParam = searchParams.get('view');
    const projectParam = searchParams.get('projectId');
    
    if (viewParam === 'units' || viewParam === 'projects') {
      setViewMode(viewParam as 'projects' | 'units');
    } else if (user && !viewParam) {
      // Default behavior based on role if no URL override
      setViewMode(user.role === 'super_admin' ? 'projects' : 'units');
    }
    
    if (projectParam) {
      setSelectedProjectId(projectParam);
    }
  }, [user, searchParams]);

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setViewMode('units');
  };

  const handleBackToProjects = () => {
    setSelectedProjectId('');
    setViewMode('projects');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20';
      case 'occupied': return 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20';
      case 'maintenance': return 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-center gap-4">
        {viewMode === 'units' && user.role === 'super_admin' && (
          <button 
            onClick={handleBackToProjects}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 hover:text-amber-500 hover:border-amber-500/30 transition-all shadow-sm group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
        )}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Front Desk</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Oversee all villa units and handle guest check-ins with precision.</p>
        </div>
      </div>

      {viewMode === 'projects' ? (
        // PROJECTS GRID VIEW (Super Admin)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projectsLoading ? (
            <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>
          ) : projects?.map((item: any) => {
            const totalUnits = (item.counts?.ready || 0) + (item.counts?.occupied || 0) + (item.counts?.maintenance || 0);
            const occupancyRate = totalUnits > 0 ? Math.round(((item.counts?.occupied || 0) / totalUnits) * 100) : 0;

            return (
              <div 
                key={item.id} 
                onClick={() => handleProjectClick(item.id.toString())}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl cursor-pointer group transition-all duration-300 hover:shadow-xl hover:border-amber-500/50 flex flex-col"
              >
                {/* Image Header */}
                <div className="h-48 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img 
                    src={item.photoUrl || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'} 
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e: any) => {
                       e.target.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                  <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full animate-pulse",
                      item.status === 'ready' ? "bg-emerald-500" : "bg-blue-500"
                    )} />
                    <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">{item.status.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col flex-1">
                  <div className="mb-6 flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{item.name}</h2>
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <MapPin className="w-4 h-4 text-amber-500" />
                      <span className="truncate">{item.address || 'Location not specified'}</span>
                    </div>
                  </div>

                  {/* Counters */}
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-center">
                      <p className="text-emerald-600 dark:text-emerald-500 text-[10px] font-bold uppercase tracking-wider mb-1">Ready</p>
                      <p className="text-slate-900 dark:text-white text-lg font-bold">{item.counts?.ready || 0}</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-center">
                      <p className="text-amber-600 dark:text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-1">Occupied</p>
                      <p className="text-slate-900 dark:text-white text-lg font-bold">{item.counts?.occupied || 0}</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center">
                      <p className="text-red-600 dark:text-red-500 text-[10px] font-bold uppercase tracking-wider mb-1">Maint</p>
                      <p className="text-slate-900 dark:text-white text-lg font-bold">{item.counts?.maintenance || 0}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <span>Occupancy</span>
                      <span className="text-amber-500">{occupancyRate}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${occupancyRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // UNITS TABLE VIEW
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          {/* Filters Overlay */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col lg:flex-row gap-4 items-center shadow-sm">
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search unit name..."
                className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-14 pr-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-bold text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap md:flex-nowrap gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-56">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select 
                    className={cn(
                      "w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-all text-xs font-bold appearance-none",
                      user.role === 'admin_villa' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    )}
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    disabled={user.role === 'admin_villa'}
                  >
                    <option value="" className="dark:bg-slate-900">All Villa Projects</option>
                    {projects?.map((p: any) => (
                      <option key={p.id} value={p.id} className="dark:bg-slate-900">{p.name}</option>
                    ))}
                  </select>
              </div>

              <div className="relative flex-1 lg:w-56">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select 
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-all text-xs font-bold appearance-none cursor-pointer"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="" className="dark:bg-slate-900">Any Operational Status</option>
                    <option value="ready" className="dark:bg-slate-900">Ready for Guest</option>
                    <option value="occupied" className="dark:bg-slate-900">Currently Occupied</option>
                    <option value="maintenance" className="dark:bg-slate-900">Under Maintenance</option>
                  </select>
              </div>
            </div>
          </div>

          {/* Units Table Wrapper */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl transition-all">
            {/* Desktop Units Table */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/50">
                    <th className="px-10 py-7 text-slate-400 font-extrabold uppercase tracking-widest text-[10px]">Unit Information</th>
                    <th className="px-10 py-7 text-slate-400 font-extrabold uppercase tracking-widest text-[10px]">Villa Project</th>
                    <th className="px-10 py-7 text-slate-400 font-extrabold uppercase tracking-widest text-[10px]">Operational Status</th>
                    <th className="px-10 py-7 text-slate-400 font-extrabold uppercase tracking-widest text-[10px] text-right">Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-900 dark:text-slate-100">
                  {unitsLoading ? (
                    <tr><td colSpan={4} className="py-24 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-amber-500 opacity-50" /></td></tr>
                  ) : units?.length === 0 ? (
                    <tr><td colSpan={4} className="py-24 text-center text-slate-400 font-medium">No units found matching your search criteria.</td></tr>
                  ) : (
                    units?.map((unit: any) => (
                      <tr key={unit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-5">
                            <div className={cn(
                              "w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors",
                              unit.status === 'ready' ? 'text-emerald-500' : unit.status === 'occupied' ? 'text-amber-500' : 'text-red-500'
                            )}>
                              <Home className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-slate-900 dark:text-white font-black text-xl tracking-tight leading-none mb-1">{unit.name}</p>
                              <p className="text-slate-500 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">{unit.type || 'Standard'} Class</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-tighter">
                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                              <Building2 className="w-4 h-4 text-slate-400" />
                            </div>
                            {unit.project?.name}
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          <span className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            getStatusColor(unit.status)
                          )}>
                            {unit.status}
                          </span>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <Link 
                            href={`/front-desk/${unit.id}`}
                            className="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-950 dark:hover:bg-amber-500 hover:text-white dark:hover:text-slate-950 text-white dark:text-slate-200 font-black px-8 py-3 rounded-2xl transition-all text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10 dark:shadow-none"
                          >
                            Manage
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Units Card View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/50">
               {unitsLoading ? (
                 <div className="py-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-amber-500" /></div>
               ) : units?.length === 0 ? (
                 <div className="py-20 text-center text-slate-500">No units found match criteria.</div>
               ) : units?.map((unit: any) => (
                 <div key={unit.id} className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700",
                            unit.status === 'ready' ? 'text-emerald-500' : unit.status === 'occupied' ? 'text-amber-500' : 'text-red-500'
                          )}>
                            <Home className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-slate-900 dark:text-white font-black text-lg">{unit.name}</p>
                            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">{unit.project?.name}</p>
                          </div>
                       </div>
                       <span className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                          getStatusColor(unit.status)
                        )}>
                          {unit.status}
                        </span>
                    </div>
                    <div className="pt-2">
                       <Link 
                          href={`/front-desk/${unit.id}`}
                          className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/10"
                        >
                          Manage Detailed Entry
                          <ChevronRight className="w-4 h-4" />
                       </Link>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FrontDeskPage() {
  return (
    <Suspense fallback={
      <div className="h-[70vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    }>
      <FrontDeskContent />
    </Suspense>
  );
}
