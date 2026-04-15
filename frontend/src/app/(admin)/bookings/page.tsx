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
  Clock,
  ExternalLink,
  FileText,
  Edit,
  Trash2,
  Check
} from 'lucide-react';
import { api } from '@/lib/api';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import FilePreviewModal from '@/components/ui/FilePreviewModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const fetcher = (url: string) => api.get<any>(url).then(res => res.data);

export default function BookingsHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string, name: string } | null>(null);
  
  const [editFormData, setEditFormData] = useState({
    guestName: '',
    contact: '',
    checkIn: '',
    checkOut: '',
    method: '',
    total: 0
  });

  const { data: bookings, isLoading, mutate: mutateBookings } = useSWR(
    `/bookings?search=${searchTerm}&project_id=${selectedProjectId}&status=${selectedStatus}`, 
    fetcher
  );
  const { data: projects } = useSWR('/projects', fetcher);

  const handleOpenEditModal = (booking: any) => {
    setEditingBooking(booking);
    setEditFormData({
        guestName: booking.guestName,
        contact: booking.contact,
        checkIn: new Date(booking.checkIn).toISOString().split('T')[0],
        checkOut: new Date(booking.checkOut).toISOString().split('T')[0],
        method: booking.method,
        total: parseFloat(booking.total)
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    setIsSubmitting(true);
    try {
        const body = new FormData();
        body.append('guestName', editFormData.guestName);
        body.append('contact', editFormData.contact);
        body.append('checkIn', editFormData.checkIn);
        body.append('checkOut', editFormData.checkOut);
        body.append('method', editFormData.method);
        body.append('total', editFormData.total.toString());

        const fileInput = document.getElementById('edit-booking-attachment') as HTMLInputElement;
        if (fileInput?.files?.[0]) {
            body.append('attachment', fileInput.files[0]);
        }

        await api.put(`/bookings/${editingBooking.id}`, body);
        mutateBookings();
        setEditingBooking(null);
        if (selectedBooking?.id === editingBooking.id) {
            setSelectedBooking(null); // Close detail modal if open
        }
    } catch (err) {
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
        await api.delete(`/bookings/${deleteId}`);
        mutateBookings();
        setDeleteId(null);
    } catch (err) {
        console.error(err);
    } finally {
        setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20';
      case 'checked_out': return 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20';
      case 'upcoming': return 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Booking History</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">View and filter all previous and current guest bookings.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search guest name or unit..."
            className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-4 w-full lg:w-auto">
          <select 
            className="flex-1 lg:w-48 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-all text-sm appearance-none"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="" className="dark:bg-slate-900">All Villas</option>
            {projects?.map((p: any) => (
              <option key={p.id} value={p.id} className="dark:bg-slate-900">{p.name}</option>
            ))}
          </select>

          <select 
            className="flex-1 lg:w-48 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-all text-sm appearance-none"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="" className="dark:bg-slate-900">All Status</option>
            <option value="upcoming" className="dark:bg-slate-900">Upcoming</option>
            <option value="checked_in" className="dark:bg-slate-900">Checked-In</option>
            <option value="checked_out" className="dark:bg-slate-900">Checked-Out</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl transition-all">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/50">
                <th className="px-8 py-7 text-slate-400 font-extrabold uppercase tracking-widest text-[10px]">Guest Information</th>
                <th className="px-8 py-7 text-slate-400 font-extrabold uppercase tracking-widest text-[10px]">Stay Period</th>
                <th className="px-8 py-7 text-slate-400 font-extrabold uppercase tracking-widest text-[10px]">Status</th>
                <th className="px-8 py-7 text-slate-400 font-extrabold uppercase tracking-widest text-[10px]">Total Bill</th>
                <th className="px-8 py-7 text-slate-400 font-extrabold uppercase tracking-widest text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-900 dark:text-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="py-24 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-amber-500 opacity-50" /></td></tr>
              ) : bookings?.length === 0 ? (
                <tr><td colSpan={5} className="py-24 text-center text-slate-400 font-medium">No booking history recorded.</td></tr>
              ) : (
                bookings?.map((booking: any) => (
                  <tr key={booking.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          <User className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white font-black text-lg tracking-tight leading-none mb-1">{booking.guestName}</p>
                          <p className="text-slate-500 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                             <Building2 className="w-3.5 h-3.5" /> {booking.unit?.project?.name} — {booking.unit?.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <p className="text-slate-900 dark:text-white font-bold text-sm tracking-tight">{new Date(booking.checkIn).toLocaleDateString()} — {new Date(booking.checkOut).toLocaleDateString()}</p>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" /> {Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000)} Nights
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border whitespace-nowrap flex items-center gap-1.5 w-fit",
                        getStatusColor(booking.status)
                      )}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-slate-900 dark:text-white font-black text-lg tracking-tighter leading-none mb-1">
                        Rp {parseFloat(booking.total).toLocaleString('id-ID')}
                      </p>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">via {booking.method}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEditModal(booking)} 
                          title="Edit Booking"
                          className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-amber-500 transition-all border border-slate-100 dark:border-slate-700 hover:border-amber-500/30 shadow-sm"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteId(booking.id)} 
                          title="Delete Booking"
                          className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-500 transition-all border border-slate-100 dark:border-slate-700 hover:border-red-500/20 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setSelectedBooking(booking)}
                          title="View Details"
                          className="p-2.5 bg-slate-900 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl text-white dark:text-slate-950 transition-all shadow-lg shadow-slate-900/10"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
           {isLoading ? (
             <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></div>
           ) : bookings?.length === 0 ? (
             <div className="py-20 text-center text-slate-500">No booking history recorded.</div>
           ) : bookings?.map((booking: any) => (
             <div key={booking.id} className="p-6 space-y-4">
               <div className="flex justify-between items-start">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white leading-tight">{booking.guestName}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{booking.unit?.name} — {booking.unit?.project?.name}</p>
                    </div>
                 </div>
                 <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border whitespace-nowrap flex items-center gap-1.5",
                    getStatusColor(booking.status)
                  )}>
                    {booking.status.replace('_', ' ')}
                  </span>
               </div>

               <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <div>
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Stay Duration</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {new Date(booking.checkIn).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })} — {new Date(booking.checkOut).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                    </p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Total Bill</p>
                    <p className="text-sm font-black text-emerald-500">Rp {parseFloat(booking.total).toLocaleString('id-ID')}</p>
                 </div>
               </div>

               <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEditModal(booking)}
                      className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteId(booking.id)}
                      className="p-3 bg-red-500/10 text-red-500 rounded-2xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => setSelectedBooking(booking)}
                    className="flex items-center gap-2 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 px-6 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest"
                  >
                    Details <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
             </div>
           ))}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-md" onClick={() => setSelectedBooking(null)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Booking Details</h2>
                <p className="text-slate-500 text-xs mt-1 tracking-widest uppercase font-bold">Invoice #{selectedBooking.id.toString().padStart(5, '0')}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest block mb-2">Guest Information</label>
                    <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-amber-500" />
                          <span className="text-slate-900 dark:text-white font-bold truncate">{selectedBooking.guestName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                           <span className="text-slate-500 dark:text-slate-400 text-xs truncate">{selectedBooking.contact}</span>
                        </div>
                      </div>
                      {selectedBooking.attachmentUrl && (
                        <button 
                          onClick={() => setPreviewFile({ url: selectedBooking.attachmentUrl, name: `${selectedBooking.guestName} Identity` })}
                          className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-500 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all gap-1 text-[9px] font-bold uppercase tracking-widest shadow-sm"
                        >
                           <FileText className="w-5 h-5" />
                           Preview
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest block mb-2">Stay Details</label>
                    <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                       <div className="text-center flex-1">
                          <p className="text-slate-500 dark:text-slate-500 text-[9px] uppercase font-bold mb-1">Check-In</p>
                          <p className="text-slate-900 dark:text-white font-bold text-sm leading-none">{new Date(selectedBooking.checkIn).toLocaleDateString()}</p>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-200 dark:text-slate-800" />
                       <div className="text-center flex-1">
                          <p className="text-slate-500 dark:text-slate-500 text-[9px] uppercase font-bold mb-1">Check-Out</p>
                          <p className="text-slate-900 dark:text-white font-bold text-sm leading-none">{new Date(selectedBooking.checkOut).toLocaleDateString()}</p>
                       </div>
                    </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest block mb-2">Payment Info</label>
                    <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl space-y-4">
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                             <CreditCard className="w-4 h-4 text-amber-500" />
                             <span className="text-slate-600 dark:text-slate-400 text-xs font-bold capitalize">{selectedBooking.method}</span>
                          </div>
                          <span className={cn(
                             "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border",
                             getStatusColor(selectedBooking.status)
                          )}>
                             {selectedBooking.status.replace('_', ' ')}
                          </span>
                       </div>
                       <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                          <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase">Total Paid</span>
                          <span className="text-2xl font-bold text-emerald-500">Rp {parseFloat(selectedBooking.total).toLocaleString('id-ID')}</span>
                       </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest block mb-2">Project Label</label>
                    <div className="bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex items-start gap-3">
                       <Tag className="w-4 h-4 text-amber-500 mt-0.5" />
                       <p className="text-slate-600 dark:text-slate-400 text-xs italic font-medium">Booking handled by {selectedBooking.unit?.project?.name} team.</p>
                    </div>
                  </div>
               </div>
            </div>
            
            <div className="p-8 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
               <button 
                onClick={() => { setSelectedBooking(null); handleOpenEditModal(selectedBooking); }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-3 rounded-2xl transition-all shadow-sm flex items-center gap-2"
               >
                 <Edit className="w-4 h-4" />
                 Edit Booking
               </button>
               <button 
                onClick={() => setSelectedBooking(null)}
                className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-sm"
               >
                Close Details
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-md" onClick={() => setEditingBooking(null)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Booking</h2>
                <p className="text-slate-500 text-xs mt-1 tracking-widest uppercase font-bold">Update stay information</p>
              </div>
              <button onClick={() => setEditingBooking(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Guest Name</label>
                  <input required type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all shadow-inner"
                    value={editFormData.guestName} onChange={e => setEditFormData({...editFormData, guestName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Contact</label>
                  <input required type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all shadow-inner"
                    value={editFormData.contact} onChange={e => setEditFormData({...editFormData, contact: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Check-In</label>
                  <input required type="date" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all shadow-inner"
                    value={editFormData.checkIn} onChange={e => setEditFormData({...editFormData, checkIn: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Check-Out</label>
                  <input required type="date" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all shadow-inner"
                    value={editFormData.checkOut} onChange={e => setEditFormData({...editFormData, checkOut: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Payment Method</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all appearance-none shadow-inner"
                    value={editFormData.method} onChange={e => setEditFormData({...editFormData, method: e.target.value})}>
                    {['booking.com', 'agoda', 'traveloka', 'tiket.com', 'direct payment', 'whatsapp', 'sosial media', 'others'].map(m => (
                        <option key={m} value={m} className="dark:bg-slate-900 capitalize">{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Total (IDR)</label>
                  <input required type="number" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all shadow-inner font-mono font-bold"
                    value={editFormData.total} onChange={e => setEditFormData({...editFormData, total: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Update Identity/Attachment (Optional)</label>
                <input id="edit-booking-attachment" type="file" accept="image/*,application/pdf"
                   className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-slate-400 text-[10px] focus:outline-none focus:border-amber-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-amber-100 file:text-amber-700"
                />
              </div>

              <div className="pt-6 flex gap-4">
                 <button type="button" onClick={() => setEditingBooking(null)} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-4 rounded-2xl transition-all">Cancel</button>
                 <button type="submit" disabled={isSubmitting} className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50">
                   {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Final Modal Overlays */}
      <DeleteConfirmationModal 
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteBooking}
        isDeleting={isDeleting}
        title="Delete Booking Record?"
        message="Are you sure you want to remove this booking history? This cannot be undone and may affect financial accuracy."
      />

      {/* File Preview Overlay */}
      <FilePreviewModal 
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || ''}
        fileName={previewFile?.name}
      />
    </div>
  );
}
