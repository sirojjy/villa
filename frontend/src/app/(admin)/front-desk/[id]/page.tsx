'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { 
  Home, 
  ArrowLeft, 
  UserPlus, 
  UserMinus, 
  Search, 
  Loader2,
  X,
  CreditCard,
  User,
  Phone,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const fetcher = (url: string) => api.get<any>(url).then(res => res.data);

export default function UnitDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    guestName: '',
    contact: '',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: '',
    method: 'tiket.com',
    total: 0
  });

  const { data: project } = useSWR(`/projects/${id}`, fetcher);
  const { data: units, isLoading: unitsLoading } = useSWR(`/projects/${id}/units`, fetcher);

  const handleOpenCheckIn = (unit: any) => {
    setSelectedUnit(unit);
    setFormData({
      ...formData,
      total: parseFloat(unit.pricePerNight || '0')
    });
    setIsCheckInModalOpen(true);
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.post('/bookings/checkin', {
        unitId: selectedUnit.id,
        ...formData
      });

      if (res.success) {
        mutate(`/projects/${id}/units`);
        mutate('/projects');
        setIsCheckInModalOpen(false);
      } else {
        setError(res.error || 'Check-in failed');
      }
    } catch (err) {
      setError('An error occurred during check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCheckOut = async (unit: any) => {
    setSelectedUnit(unit);
    setIsSubmitting(true);
    try {
      const res = await api.get<any>(`/bookings/active?unit_id=${unit.id}`);
      if (res.success && res.data) {
        setActiveBooking(res.data);
        setIsCheckOutModalOpen(true);
      } else {
        alert('Could not find an active booking for this unit.');
      }
    } catch (err) {
      alert('Error fetching booking data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeBooking) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.put(`/bookings/${activeBooking.id}/checkout`, {});
      if (res.success) {
        mutate(`/projects/${id}/units`);
        mutate('/projects');
        setIsCheckOutModalOpen(false);
        setActiveBooking(null);
      } else {
        setError(res.error || 'Check-out failed');
      }
    } catch (err) {
      setError('An error occurred during check-out');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUnits = units?.filter((u: any) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/front-desk')}
            className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">{project?.name}</h1>
            <p className="text-slate-400 mt-1 uppercase tracking-widest text-[10px] font-bold">Manage Unit Inventory</p>
          </div>
        </div>
        
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search unit number..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-3xl">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Total Units</p>
              <p className="text-3xl font-bold text-white">{units?.length || 0}</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl">
              <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider mb-2">Ready</p>
              <p className="text-3xl font-bold text-emerald-400">{units?.filter((u:any) => u.status === 'ready').length || 0}</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-3xl">
              <p className="text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-2">Occupied</p>
              <p className="text-3xl font-bold text-amber-400">{units?.filter((u:any) => u.status === 'occupied').length || 0}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-3xl">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Maintenance</p>
              <p className="text-3xl font-bold text-slate-300">{units?.filter((u:any) => u.status === 'maintenance').length || 0}</p>
          </div>
      </div>

      {/* Units Grid/Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">No Unit</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Type & Pricing</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Operational Status</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {unitsLoading ? (
                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></td></tr>
              ) : filteredUnits?.map((unit: any) => (
                <tr key={unit.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-white">
                          {unit.name}
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <span className="text-xs font-bold text-slate-300 capitalize">{unit.type} Class</span>
                      <p className="text-emerald-500 font-mono text-sm font-bold mt-1">
                        Rp {(parseFloat(unit.pricePerNight) || 0).toLocaleString('id-ID')}/night
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                      unit.status === 'ready' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      unit.status === 'occupied' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-slate-800 text-slate-500 border-slate-700"
                    )}>
                      {unit.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {unit.status === 'ready' ? (
                      <button 
                        onClick={() => handleOpenCheckIn(unit)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2 ml-auto text-xs"
                      >
                        <UserPlus className="w-4 h-4" />
                        Check-In
                      </button>
                    ) : unit.status === 'occupied' ? (
                      <button 
                        onClick={() => handleOpenCheckOut(unit)}
                        disabled={isSubmitting}
                        className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-bold px-5 py-2.5 rounded-2xl transition-all shadow-lg shadow-amber-500/10 flex items-center gap-2 ml-auto text-xs"
                      >
                        {isSubmitting && selectedUnit?.id === unit.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                        Check-Out
                      </button>
                    ) : (
                      <span className="text-slate-600 text-xs italic">Maintenance Mode</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check-In Modal */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsCheckInModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
             <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Unit Check-In</h2>
                  <p className="text-slate-500 text-xs mt-1">Assigning <span className="text-amber-500 font-bold">{selectedUnit?.name}</span> for new guest</p>
                </div>
                <button onClick={() => setIsCheckInModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"><X className="w-6 h-6" /></button>
             </div>

             <form onSubmit={handleCheckIn} className="p-8 space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Guest Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                      <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500 transition-all"
                        placeholder="Full name" value={formData.guestName} onChange={e => setFormData({...formData, guestName: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Contact No.</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                      <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500 transition-all"
                        placeholder="WhatsApp/Phone" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Check-in Date</label>
                    <input required type="date" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500"
                      value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Check-out Date</label>
                    <input required type="date" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500"
                      value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Booking Method</label>
                    <div className="relative group">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                      <select required className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500 appearance-none"
                        value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})}>
                        <option value="tiket.com">Tiket.com</option>
                        <option value="traveloka">Traveloka</option>
                        <option value="agoda">Agoda</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="on the spot">On the Spot</option>
                        <option value="criips">Criips</option>
                        <option value="others">Others</option>
                      </select>
                    </div>
                  </div>
                   <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Total Payment (Rp)</label>
                    <div className="relative group">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 transition-colors" />
                      <input required type="number" className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500"
                        value={formData.total} onChange={e => setFormData({...formData, total: parseFloat(e.target.value)})} />
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsCheckInModalOpen(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-slate-950 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Check-In'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Check-Out Confirmation Modal */}
      {isCheckOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsCheckOutModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
             <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Check-Out Guest</h2>
                  <p className="text-slate-500 text-xs mt-1">Finalizing stay for <span className="text-amber-500 font-bold">{selectedUnit?.name}</span></p>
                </div>
                <button onClick={() => setIsCheckOutModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"><X className="w-6 h-6" /></button>
             </div>

             <div className="p-8 space-y-6">
                <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-amber-500">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Guest Name</p>
                      <p className="text-xl font-bold text-white leading-none">{activeBooking?.guestName}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                    <div>
                      <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Phone</p>
                      <p className="text-sm text-slate-300 font-medium">{activeBooking?.contact}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Total Paid</p>
                      <p className="text-sm text-emerald-500 font-bold">Rp {(parseFloat(activeBooking?.total) || 0).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsCheckOutModalOpen(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all"
                  >
                    Keep Occupied
                  </button>
                  <button 
                    onClick={handleCheckOut}
                    disabled={isSubmitting}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Check-Out'}
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
