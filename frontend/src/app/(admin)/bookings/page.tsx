'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { 
  History, 
  Search, 
  Filter, 
  ChevronRight, 
  Loader2,
  Calendar,
  User,
  Building2,
  Tag,
  CreditCard,
  X,
  MapPin,
  Clock
} from 'lucide-react';
import { api } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const fetcher = (url: string) => api.get<any>(url).then(res => res.data);

export default function BookingsHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const { data: bookings, isLoading } = useSWR(
    `/bookings?search=${searchTerm}&project_id=${selectedProjectId}&status=${selectedStatus}`, 
    fetcher
  );
  const { data: projects } = useSWR('/projects', fetcher);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'checked_out': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'upcoming': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">Booking History</h1>
          <p className="text-slate-400 mt-2">View and filter all previous and current guest bookings.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-[28px] flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search guest name or unit..."
            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-4 w-full lg:w-auto">
          <select 
            className="flex-1 lg:w-48 bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all text-sm"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">All Villas</option>
            {projects?.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select 
            className="flex-1 lg:w-48 bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all text-sm"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="checked_in">Checked-In</option>
            <option value="checked_out">Checked-Out</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Guest & Villa</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Stay Period</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Total Bayar</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></td></tr>
              ) : bookings?.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-500">No booking records found.</td></tr>
              ) : bookings?.map((booking: any) => (
                <tr key={booking.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-white font-bold">{booking.guestName}</p>
                        <p className="text-slate-500 text-[10px] flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" /> {booking.unit?.project?.name} — {booking.unit?.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-slate-300 text-sm">
                       <p className="font-medium">{new Date(booking.checkIn).toLocaleDateString()}</p>
                       <p className="text-slate-600 text-[10px]">to {new Date(booking.checkOut).toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                      getStatusColor(booking.status)
                    )}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-mono text-emerald-400 text-sm font-bold">
                    Rp {parseFloat(booking.total).toLocaleString('id-ID')}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedBooking(booking)}
                      className="p-2 hover:bg-slate-700 rounded-xl text-slate-500 hover:text-white transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setSelectedBooking(null)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Booking Details</h2>
                <p className="text-slate-500 text-xs mt-1 tracking-widest uppercase">Invoice #{selectedBooking.id.toString().padStart(5, '0')}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-2">Guest Information</label>
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-amber-500" />
                        <span className="text-white font-bold">{selectedBooking.guestName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <Clock className="w-4 h-4 text-slate-500" />
                         <span className="text-slate-400 text-xs">{selectedBooking.contact}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-2">Stay Details</label>
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                       <div className="text-center flex-1">
                          <p className="text-slate-500 text-[10px] uppercase mb-1">Check-In</p>
                          <p className="text-white font-bold text-sm">{new Date(selectedBooking.checkIn).toLocaleDateString()}</p>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-800" />
                       <div className="text-center flex-1">
                          <p className="text-slate-500 text-[10px] uppercase mb-1">Check-Out</p>
                          <p className="text-white font-bold text-sm">{new Date(selectedBooking.checkOut).toLocaleDateString()}</p>
                       </div>
                    </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-2">Payment Info</label>
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl space-y-4">
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                             <CreditCard className="w-4 h-4 text-slate-500" />
                             <span className="text-slate-400 text-xs capitalize">{selectedBooking.method}</span>
                          </div>
                          <span className={cn(
                             "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border",
                             getStatusColor(selectedBooking.status)
                          )}>
                             {selectedBooking.status}
                          </span>
                       </div>
                       <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                          <span className="text-slate-500 text-xs">Total Paid</span>
                          <span className="text-2xl font-bold text-emerald-400">Rp {parseFloat(selectedBooking.total).toLocaleString('id-ID')}</span>
                       </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-2">Internal Note</label>
                    <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex items-start gap-3">
                       <Tag className="w-4 h-4 text-amber-500 mt-0.5" />
                       <p className="text-slate-400 text-xs italic">Booking handled by {selectedBooking.unit?.project?.name} management team.</p>
                    </div>
                  </div>
               </div>
            </div>
            
            <div className="p-8 bg-slate-950/50 flex justify-end">
               <button 
                onClick={() => setSelectedBooking(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-8 py-3 rounded-2xl transition-all"
               >
                Close Details
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
