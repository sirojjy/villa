'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X,
  Loader2,
  Check,
  ChevronRight,
  Eye,
  MapPin,
  Tag,
  DollarSign,
  Info
} from 'lucide-react';
import { api } from '@/lib/api';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const fetcher = (url: string) => api.get<any>(url).then(res => res.data);

export default function ProjectsManagementPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteData, setDeleteData] = useState<{ id: number, type: 'project' | 'unit', name: string } | null>(null);

  // Form States
  const [projectForm, setProjectForm] = useState({
    name: '',
    address: '',
    status: 'ready',
    basePrice: 0,
    facilities: ''
  });

  const [unitForm, setUnitForm] = useState({
    name: '',
    type: 'middle',
    pricePerNight: 0,
    status: 'ready'
  });

  const [bulkPriceForm, setBulkPriceForm] = useState({
    type: 'luxury',
    price: 0
  });

  const { data: projects, isLoading: projectsLoading } = useSWR('/projects', fetcher);
  const { data: units, isLoading: unitsLoading } = useSWR(selectedProjectId ? `/projects/${selectedProjectId}/units` : null, fetcher);

  const handleOpenProjectModal = (proj?: any) => {
    if (proj) {
      setEditingProject(proj);
      setProjectForm({
        name: proj.name,
        address: proj.address || '',
        status: proj.status,
        basePrice: parseFloat(proj.basePrice || '0'),
        facilities: proj.facilities || ''
      });
    } else {
      setEditingProject(null);
      setProjectForm({ name: '', address: '', status: 'ready', basePrice: 0, facilities: '' });
    }
    setIsProjectModalOpen(true);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, projectForm);
      } else {
        await api.post('/projects', projectForm);
      }
      mutate('/projects');
      setIsProjectModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenUnitModal = (unit?: any) => {
    if (unit) {
      setEditingUnit(unit);
      setUnitForm({
        name: unit.name,
        type: unit.type,
        pricePerNight: parseFloat(unit.pricePerNight),
        status: unit.status
      });
    } else {
      setEditingUnit(null);
      setUnitForm({ name: '', type: 'middle', pricePerNight: 0, status: 'ready' });
    }
    setIsUnitModalOpen(true);
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setIsSubmitting(true);
    try {
      if (editingUnit) {
        await api.put(`/units/${editingUnit.id}`, unitForm);
      } else {
        await api.post(`/projects/${selectedProjectId}/units`, unitForm);
      }
      mutate(`/projects/${selectedProjectId}/units`);
      mutate('/projects'); // Update counts
      setIsUnitModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    try {
      if (deleteData.type === 'project') {
        await api.delete(`/projects/${deleteData.id}`);
        mutate('/projects');
        if (selectedProjectId === deleteData.id) setSelectedProjectId(null);
      } else {
        await api.delete(`/units/${deleteData.id}`);
        mutate(`/projects/${selectedProjectId}/units`);
        mutate('/projects');
      }
      setDeleteData(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkPriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setIsSubmitting(true);
    try {
      await api.put(`/projects/${selectedProjectId}/bulk-price`, bulkPriceForm);
      mutate(`/projects/${selectedProjectId}/units`);
      setIsBulkPriceModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">Project & Unit</h1>
          <p className="text-slate-400 mt-2">Manage your villa locations and room inventories.</p>
        </div>
        <button 
          onClick={() => handleOpenProjectModal()}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Project
        </button>
      </div>

      {/* Projects Table */}
      {/* Projects Container */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-slate-800/50 flex items-center justify-between">
           <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Villa Projects Ledger</h2>
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{projects?.length || 0} Total active</span>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Project Info</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Inventory</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px] text-right">Actions Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {projectsLoading ? (
                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" /></td></tr>
              ) : projects?.map((p: any) => (
                <tr 
                  key={p.id} 
                  className={cn(
                    "group transition-all cursor-pointer",
                    selectedProjectId === p.id ? "bg-amber-500/10" : "hover:bg-slate-800/30"
                  )}
                  onClick={() => setSelectedProjectId(p.id)}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-800 rounded-[1.25rem] flex items-center justify-center border border-slate-700 overflow-hidden shadow-inner">
                        {p.photoUrl ? <img src={p.photoUrl} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-7 h-7 text-slate-600" />}
                      </div>
                      <div>
                        <p className="text-white font-black text-lg tracking-tight">{p.name}</p>
                        <p className="text-slate-500 text-[10px] font-bold flex items-center gap-1 uppercase tracking-widest mt-0.5"><MapPin className="w-3.5 h-3.5" />{p.address || 'Location Hidden'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      p.status === 'ready' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex gap-3">
                       <span title="Ready" className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-lg border border-emerald-500/10">{p.counts?.ready} R</span>
                       <span title="Occupied" className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-lg border border-amber-500/10">{p.counts?.occupied} O</span>
                       <span title="Maintenance" className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-black rounded-lg border border-slate-700">{p.counts?.maintenance} M</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenProjectModal(p); }} 
                        title="Edit Project"
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 hover:text-amber-500 transition-all border border-slate-700 shadow-sm"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteData({ id: p.id, type: 'project', name: p.name }); }} 
                        title="Delete Project"
                        className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-red-500 transition-all border border-red-500/10 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedProjectId(p.id); }} className={cn(
                        "p-3 rounded-2xl transition-all shadow-lg",
                        selectedProjectId === p.id ? "bg-amber-500 text-slate-950" : "bg-slate-800 hover:bg-slate-700 text-amber-500 border border-slate-700"
                      )}>
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-800/50">
           {projectsLoading ? (
             <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" /></div>
           ) : projects?.map((p: any) => (
             <div key={p.id} onClick={() => setSelectedProjectId(p.id)} className={cn(
               "p-6 space-y-4 active:bg-slate-800/50 transition-colors",
               selectedProjectId === p.id && "bg-amber-500/5"
             )}>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 overflow-hidden shadow-inner">
                    {p.photoUrl ? <img src={p.photoUrl} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-7 h-7 text-slate-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-lg tracking-tight truncate">{p.name}</p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest truncate">{p.address || 'No location set'}</p>
                    <div className="mt-2 text-[10px] font-bold flex gap-2">
                       <span className="text-emerald-500">{p.counts?.ready} Ready</span>
                       <span className="text-amber-500">{p.counts?.occupied} Occupied</span>
                    </div>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                    p.status === 'ready' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  )}>
                    {p.status}
                  </span>
                </div>
                <div className="flex gap-2">
                   <button onClick={(e) => { e.stopPropagation(); handleOpenProjectModal(p); }} className="flex-1 bg-slate-800 h-10 rounded-xl text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                     <Edit className="w-3.5 h-3.5" /> Edit
                   </button>
                   <button onClick={(e) => { e.stopPropagation(); setDeleteData({ id: p.id, type: 'project', name: p.name }); }} className="flex-1 bg-red-500/10 h-10 rounded-xl text-red-500 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                     <Trash2 className="w-3.5 h-3.5" /> Delete
                   </button>
                   <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950">
                     <ChevronRight className="w-5 h-5" />
                   </div>
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* Units Management (Inline Selection) */}
      {selectedProjectId && (
        <section className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Units for <span className="text-amber-500">{projects?.find((p:any) => p.id === selectedProjectId)?.name}</span>
            </h2>
            <div className="flex gap-3">
               <button 
                onClick={() => setIsBulkPriceModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-3 rounded-2xl transition-all flex items-center gap-2 text-sm"
              >
                <Tag className="w-4 h-4" />
                Update Bulk Price
              </button>
              <button 
                onClick={() => handleOpenUnitModal()}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-3 rounded-2xl transition-all flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Unit
              </button>
            </div>
          </div>

          {/* Units Responsive Content */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Desktop Units Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800/50">
                    <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Unit Designation</th>
                    <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Class / Type</th>
                    <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Tariff Limit</th>
                    <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Op Status</th>
                    <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px] text-right">Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {unitsLoading ? (
                    <tr><td colSpan={5} className="py-14 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 opacity-50" /></td></tr>
                  ) : units?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-all group/unit">
                      <td className="px-8 py-5 font-black text-lg text-white tracking-widest uppercase">{u.name}</td>
                      <td className="px-8 py-5 capitalize text-slate-400 font-bold text-xs">{u.type}</td>
                      <td className="px-8 py-5 text-emerald-500 font-mono font-bold leading-none">
                        Rp {parseFloat(u.pricePerNight).toLocaleString('id-ID')}
                      </td>
                      <td className="px-8 py-5">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          u.status === 'ready' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" :
                          u.status === 'occupied' ? "bg-amber-500/10 text-amber-500 border-amber-500/10" :
                          "bg-slate-800 text-slate-500 border-slate-700"
                        )}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenUnitModal(u)} 
                            title="Edit Unit"
                            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-amber-500 transition-all border border-slate-700 shadow-sm"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteData({ id: u.id, type: 'unit', name: u.name })} 
                            title="Delete Unit"
                            className="p-2.5 bg-slate-800 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-500 transition-all border border-slate-700 shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Units Card View */}
            <div className="md:hidden divide-y divide-slate-800/50">
               {unitsLoading ? (
                 <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" /></div>
               ) : units?.map((u: any) => (
                 <div key={u.id} className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                       <div>
                          <p className="text-xl font-black text-white tracking-widest uppercase mb-1">{u.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{u.type} Class</p>
                       </div>
                       <span className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                          u.status === 'ready' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" :
                          u.status === 'occupied' ? "bg-amber-500/10 text-amber-500 border-amber-500/10" :
                          "bg-slate-800 text-slate-500 border-slate-700"
                        )}>
                          {u.status}
                        </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                       <p className="text-emerald-500 font-mono font-bold">Rp {parseFloat(u.pricePerNight).toLocaleString('id-ID')}</p>
                       <div className="flex gap-2">
                          <button onClick={() => handleOpenUnitModal(u)} className="p-3 bg-slate-800 rounded-xl text-slate-400"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteData({ id: u.id, type: 'unit', name: u.name })} className="p-3 bg-red-500/10 text-red-500 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </section>
      )}

      {/* Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsProjectModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl overflow-hidden animate-in zoom-in duration-300">
             <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{editingProject ? 'Edit Project' : 'New Project'}</h2>
                <button onClick={() => setIsProjectModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500"><X className="w-6 h-6" /></button>
             </div>
             <form onSubmit={handleProjectSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project Name</label>
                  <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" 
                    value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Address</label>
                  <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 h-20"
                    value={projectForm.address} onChange={e => setProjectForm({...projectForm, address: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base Price (Rp)</label>
                    <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                      value={projectForm.basePrice} onChange={e => setProjectForm({...projectForm, basePrice: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                      value={projectForm.status} onChange={e => setProjectForm({...projectForm, status: e.target.value})}>
                      <option value="ready">Ready</option>
                      <option value="coming_soon">Coming Soon</option>
                    </select>
                  </div>
                </div>
                <div className="pt-6">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-bold py-4 rounded-2xl transition-all">
                    {isSubmitting ? 'Processing...' : editingProject ? 'Save Changes' : 'Create Project'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Unit Modal */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsUnitModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl overflow-hidden animate-in zoom-in duration-300">
             <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{editingUnit ? 'Edit Unit' : 'Add New Unit'}</h2>
                <button onClick={() => setIsUnitModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500"><X className="w-6 h-6" /></button>
             </div>
             <form onSubmit={handleUnitSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unit Name (e.g. A1)</label>
                  <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 uppercase"
                    value={unitForm.name} onChange={e => setUnitForm({...unitForm, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                    value={unitForm.type} onChange={e => setUnitForm({...unitForm, type: e.target.value})}>
                    <option value="luxury">Luxury</option>
                    <option value="middle">Middle</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price per Night (Rp)</label>
                  <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                    value={unitForm.pricePerNight} onChange={e => setUnitForm({...unitForm, pricePerNight: parseFloat(e.target.value)})} />
                </div>
                <div className="pt-6">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-bold py-4 rounded-2xl transition-all">
                    {isSubmitting ? 'Processing...' : editingUnit ? 'Save Changes' : 'Add Unit'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Bulk Price Modal */}
      {isBulkPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsBulkPriceModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl overflow-hidden animate-in zoom-in duration-300">
             <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Bulk Update Price</h2>
                <button onClick={() => setIsBulkPriceModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500"><X className="w-6 h-6" /></button>
             </div>
             <form onSubmit={handleBulkPriceSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unit Type</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                    value={bulkPriceForm.type} onChange={e => setBulkPriceForm({...bulkPriceForm, type: e.target.value})}>
                    <option value="luxury">Luxury</option>
                    <option value="middle">Middle</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">New Price per Night (Rp)</label>
                  <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                    value={bulkPriceForm.price} onChange={e => setBulkPriceForm({...bulkPriceForm, price: parseFloat(e.target.value)})} />
                </div>
                <div className="pt-6">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-slate-950 font-bold py-4 rounded-2xl transition-all">
                    {isSubmitting ? 'Updating...' : 'Apply to All Units'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteData !== null}
        onClose={() => setDeleteData(null)}
        onConfirm={handleDeleteConfirmed}
        isDeleting={isDeleting}
        title={deleteData?.type === 'project' ? "Delete Project?" : "Delete Unit?"}
        message={deleteData?.type === 'project' 
          ? `Are you sure you want to delete project "${deleteData?.name}"? All associated units will also be hidden from management.`
          : `Are you sure you want to delete unit "${deleteData?.name}"? Historical booking and financial records will remain intact.`
        }
      />
    </div>
  );
}
