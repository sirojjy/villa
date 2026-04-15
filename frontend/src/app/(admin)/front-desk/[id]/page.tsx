'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { 
  ArrowLeft, 
  Loader2,
  CheckCircle2,
  DoorOpen,
  User,
  Phone,
  Wallet,
  Building2,
  MapPin,
  Info,
  ChevronRight,
  Tag,
  Clock,
  Edit,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { api } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const fetcher = (url: string) => api.get<any>(url).then(res => res.data);

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.id;

  const [formData, setFormData] = useState({
    guestName: '',
    contact: '',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    total: 0,
    method: 'booking.com'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [unitEditForm, setUnitEditForm] = useState({
    name: '',
    type: '',
    pricePerNight: 0,
    status: ''
  });
  const [error, setError] = useState('');

  const { data: unit, isLoading, mutate: mutateUnit } = useSWR(`/units/${unitId}`, fetcher);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (unit?.status === 'ready') {
        const body = new FormData();
        body.append('unitId', unitId as string);
        body.append('guestName', formData.guestName);
        body.append('contact', formData.contact);
        body.append('checkIn', formData.checkIn);
        body.append('checkOut', formData.checkOut);
        body.append('total', formData.total.toString());
        body.append('method', formData.method);

        const fileInput = document.getElementById('guest-id-upload') as HTMLInputElement;
        if (fileInput?.files?.[0]) {
          body.append('attachment', fileInput.files[0]);
        }

        const res = await api.post('/bookings/checkin', body);
        if (res.success) {
          mutateUnit();
          router.push('/front-desk');
        } else {
          setError(res.error || 'Check-in failed');
        }
      } else {
        const res = await api.put(`/bookings/${unit?.activeBooking?.id}/checkout`, {});
        if (res.success) {
          mutateUnit();
          router.push('/front-desk');
        } else {
          setError(res.error || 'Check-out failed');
        }
      }
    } catch (err: any) {
      setError('Operation failed. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = () => {
    if (!data) return;
    setUnitEditForm({
      name: data.name,
      type: data.type,
      pricePerNight: parseFloat(data.pricePerNight),
      status: data.status
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/units/${unitId}`, unitEditForm);
      mutateUnit();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (confirm('Are you sure you want to delete this unit? Historical records will be preserved.')) {
        try {
            await api.delete(`/units/${unitId}`);
            router.push('/front-desk');
        } catch (err: any) {
            alert(err.message || 'Failed to delete unit');
        }
    }
  };

  if (isLoading) return (
    <div className="h-[70vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
    </div>
  );

  const data = unit;
  const isOccupied = data?.status === 'occupied';

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link 
            href={(data?.projectId || data?.project?.id) ? `/front-desk?view=units&projectId=${data.projectId || data.project.id}` : "/front-desk"} 
            className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 hover:text-amber-500 hover:border-amber-500/30 transition-all shadow-sm group"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{data?.name}</h1>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={handleOpenEdit}
                        title="Edit Unit"
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-500 transition-all"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    {!isOccupied && (
                        <button 
                            onClick={handleDeleteUnit}
                            title="Delete Unit"
                            className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-2">
               <Building2 className="w-4 h-4" /> {data?.project?.name}
            </p>
          </div>
        </div>
        <div className={cn(
          "px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest border shadow-sm",
          data?.status === 'ready' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20' : 
          data?.status === 'occupied' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20' :
          'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20'
        )}>
          {data?.status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left: Unit Details */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-8 shadow-sm dark:shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Property Overview</h3>
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                       <MapPin className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                       <p className="text-slate-500 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">Location</p>
                       <p className="text-slate-900 dark:text-slate-100 font-bold">{data?.project?.location || 'Sanur, Bali'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                       <Info className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                       <p className="text-slate-500 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">Unit Class</p>
                       <p className="text-slate-900 dark:text-slate-100 font-bold capitalize">{data?.type || 'Standard'}</p>
                    </div>
                 </div>
              </div>
           </div>

           {isOccupied && data.activeBooking && (
             <div className="bg-emerald-500/5  border border-emerald-500/10 rounded-2xl p-8 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Active Guest</h3>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-white dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Name</span>
                      <span className="text-slate-900 dark:text-white font-bold">{data.activeBooking.guestName}</span>
                   </div>
                   <div className="flex justify-between items-center bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-white dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Contact</span>
                      <span className="text-slate-900 dark:text-white font-bold">{data.activeBooking.contact}</span>
                   </div>
                   <div className="flex justify-between items-center border-t border-emerald-500/10 pt-4 px-2">
                       <div className="text-center">
                          <p className="text-slate-400 text-[9px] uppercase font-bold mb-1">Check-In</p>
                          <p className="text-slate-700 dark:text-slate-300 font-bold text-sm tracking-tighter">{new Date(data.activeBooking.checkIn).toLocaleDateString()}</p>
                       </div>
                       <div className="text-center">
                          <p className="text-slate-400 text-[9px] uppercase font-bold mb-1">Check-Out</p>
                          <p className="text-slate-700 dark:text-slate-300 font-bold text-sm tracking-tighter">{new Date(data.activeBooking.checkOut).toLocaleDateString()}</p>
                       </div>
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Right: Actions */}
        <div className="lg:col-span-3">
           <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-10 shadow-sm dark:shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-700",
                  !isOccupied ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                )}>
                  {!isOccupied ? <CheckCircle2 className="w-8 h-8" /> : <DoorOpen className="w-8 h-8" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {!isOccupied ? 'Guest Check-In' : 'Guest Check-Out'}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-500 text-xs tracking-widest font-bold uppercase mt-1">
                    {!isOccupied ? 'Process New Reservation' : 'Finalize Stay & Settlement'}
                  </p>
                </div>
              </div>

              {!isOccupied ? (
                <form onSubmit={handleAction} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Guest Name</label>
                       <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-700 group-focus-within:text-amber-500 transition-colors" />
                          <input 
                            required
                            type="text" 
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold"
                            placeholder="John Doe"
                            value={formData.guestName}
                            onChange={e => setFormData({...formData, guestName: e.target.value})}
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Contact</label>
                       <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-700 group-focus-within:text-amber-500 transition-colors" />
                          <input 
                            required
                            type="text" 
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold"
                            placeholder="+62..."
                            value={formData.contact}
                            onChange={e => setFormData({...formData, contact: e.target.value})}
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Check-in Date</label>
                       <input 
                        required
                        type="date" 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-all font-bold"
                        value={formData.checkIn}
                        onChange={e => setFormData({...formData, checkIn: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Check-out Date</label>
                       <input 
                        required
                        type="date" 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-all font-bold"
                        value={formData.checkOut}
                        onChange={e => setFormData({...formData, checkOut: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Payment Method</label>
                       <select 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-amber-500 transition-all appearance-none"
                        value={formData.method}
                        onChange={e => setFormData({...formData, method: e.target.value})}
                       >
                         {['booking.com', 'agoda', 'traveloka', 'tiket.com', 'direct payment', 'whatsapp', 'sosial media', 'others'].map(m => (
                           <option key={m} value={m} className="dark:bg-slate-900 capitalize">{m}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Total Stay (IDR)</label>
                       <div className="relative group">
                          <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-700 group-focus-within:text-amber-500 transition-colors" />
                          <input 
                            required
                            type="number" 
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold"
                            placeholder="0"
                            value={formData.total}
                            onChange={e => setFormData({...formData, total: parseInt(e.target.value) || 0})}
                          />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 block">Guest Identity (Photo/PDF)</label>
                    <div className="relative group">
                       <input 
                         id="guest-id-upload"
                         type="file" 
                         accept="image/*,application/pdf"
                         className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-400 text-xs focus:outline-none focus:border-amber-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[9px] file:font-extrabold file:bg-slate-200 dark:file:bg-slate-800 file:text-slate-600 dark:file:text-slate-400 hover:file:opacity-80 transition-all"
                       />
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-[10px] font-bold text-center bg-red-500/10 py-3 rounded-2xl">{error}</p>}

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> Complete Check-In</>}
                  </button>
                </form>
              ) : (
                <div className="space-y-10">
                   <div className="p-10 bg-amber-500/5 dark:bg-amber-500/5 border-2 border-dashed border-amber-500/20 rounded-3xl text-center space-y-4">
                      <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
                         <Wallet className="w-10 h-10" />
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">Outstanding Bill</p>
                        <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Rp {parseFloat(data.activeBooking.total).toLocaleString('id-ID')}</p>
                        <p className="text-amber-500 text-xs font-bold mt-2 flex items-center justify-center gap-1">
                          <Tag className="w-3.5 h-3.5" /> Settled via {data.activeBooking.method.toUpperCase()}
                        </p>
                      </div>
                   </div>

                   {error && <p className="text-red-500 text-[10px] font-bold text-center bg-red-500/10 py-3 rounded-2xl">{error}</p>}

                   <button 
                    onClick={handleAction}
                    disabled={isSubmitting}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-5 rounded-2xl shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><DoorOpen className="w-6 h-6" /> Process Guest Check-Out</>}
                  </button>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Edit Unit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Unit</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400"><X className="w-6 h-6" /></button>
             </div>
             <form onSubmit={handleUpdateUnit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unit Name</label>
                  <input required type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 uppercase"
                    value={unitEditForm.name} onChange={e => setUnitEditForm({...unitEditForm, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                    value={unitEditForm.type} onChange={e => setUnitEditForm({...unitEditForm, type: e.target.value})}>
                    <option value="luxury">Luxury</option>
                    <option value="middle">Middle</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price per Night (Rp)</label>
                  <input type="number" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                    value={unitEditForm.pricePerNight} onChange={e => setUnitEditForm({...unitEditForm, pricePerNight: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                    value={unitEditForm.status} onChange={e => setUnitEditForm({...unitEditForm, status: e.target.value})}>
                    <option value="ready">Ready</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="occupied" disabled>Occupied (Set via Check-in)</option>
                  </select>
                </div>
                <div className="pt-6">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-bold py-4 rounded-2xl transition-all">
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
