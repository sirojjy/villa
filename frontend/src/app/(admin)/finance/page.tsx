'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar,
  Wallet,
  Building2,
  Tag,
  Loader2,
  X,
  FileText,
  Edit,
  Trash2
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

export default function FinancePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<string>('');
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState('');
  
  // File Preview State
  const [previewFile, setPreviewFile] = useState<{ url: string, name: string } | null>(null);

  const [formData, setFormData] = useState({
    projectId: 0,
    type: 'income',
    category: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    attachment: null as File | null
  });

  const handleOpenModal = (t?: any) => {
    if (t) {
      setEditingTransaction(t);
      setFormData({
        projectId: t.projectId,
        type: t.type,
        category: t.category,
        description: t.description || '',
        amount: parseFloat(t.amount),
        date: new Date(t.date).toISOString().split('T')[0],
        attachment: null
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        projectId: selectedProjectId !== 0 ? selectedProjectId : 0,
        type: 'income',
        category: '',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        attachment: null
      });
    }
    setIsModalOpen(true);
  };

  const { data: finances, isLoading } = useSWR(
    `/finances?search=${searchTerm}&project_id=${selectedProjectId}&type=${selectedType}`, 
    fetcher
  );
  
  const { data: projects } = useSWR('/projects', fetcher);
  const { data: summary } = useSWR(
    `/finances/summary?search=${searchTerm}&project_id=${selectedProjectId}&type=${selectedType}`, 
    fetcher
  );

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.projectId === 0) {
      setError('Please select a villa project');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const body = new FormData();
      body.append('projectId', formData.projectId.toString());
      body.append('type', formData.type);
      body.append('category', formData.category);
      body.append('description', formData.description);
      body.append('amount', formData.amount.toString());
      body.append('date', formData.date);

      const fileInput = document.getElementById('transaction-attachment') as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        body.append('attachment', fileInput.files[0]);
      }

      let res;
      if (editingTransaction) {
        res = await api.put(`/finances/${editingTransaction.id}`, body);
      } else {
        res = await api.post('/finances', body);
      }

      if (res.success) {
        mutate((key) => typeof key === 'string' && key.startsWith('/finances'));
        setIsModalOpen(false);
      } else {
        setError(res.error || 'Failed to save transaction');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/finances/${deleteId}`);
      mutate((key) => typeof key === 'string' && key.startsWith('/finances'));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Keuangan</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage all villa income and expenses in one ledger.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Record Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-2xl shadow-sm dark:shadow-2xl transition-colors">
          <p className="text-3xl font-bold text-emerald-500">Rp {Number(summary?.totalIncome || summary?.total_income || 0).toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-2xl shadow-sm dark:shadow-2xl transition-colors">
          <p className="text-slate-500 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Expense</p>
          <p className="text-3xl font-bold text-red-500">Rp {Number(summary?.totalExpense || summary?.total_expense || 0).toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-2xl shadow-sm dark:shadow-2xl transition-colors">
          <p className="text-slate-500 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Current Balance</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">Rp {Number((Number(summary?.totalIncome || summary?.total_income || 0)) - (Number(summary?.totalExpense || summary?.total_expense || 0))).toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search description..."
            className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-4 w-full lg:w-auto">
          <select 
            className="flex-1 lg:w-48 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-all text-sm appearance-none"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
          >
            <option value={0} className="dark:bg-slate-900">All Projects</option>
            {projects?.map((p: any) => (
              <option key={p.id} value={p.id} className="dark:bg-slate-900">{p.name}</option>
            ))}
          </select>

          <select 
            className="flex-1 lg:w-48 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-all text-sm appearance-none"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="" className="dark:bg-slate-900">All Types</option>
            <option value="income" className="dark:bg-slate-900">Income</option>
            <option value="expense" className="dark:bg-slate-900">Expense</option>
          </select>
        </div>
      </div>

      {/* Responsive Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-2xl transition-all">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/50">
                <th className="px-8 py-6 text-slate-400 font-bold uppercase tracking-wider text-[10px]">Date</th>
                <th className="px-8 py-6 text-slate-400 font-bold uppercase tracking-wider text-[10px]">Villa & Category</th>
                <th className="px-8 py-6 text-slate-400 font-bold uppercase tracking-wider text-[10px]">Description</th>
                <th className="px-8 py-6 text-slate-400 font-bold uppercase tracking-wider text-[10px] text-right">Amount</th>
                <th className="px-8 py-6 text-slate-400 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-900 dark:text-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></td></tr>
              ) : finances?.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-500">No transactions recorded.</td></tr>
              ) : finances?.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <Calendar className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-bold text-sm tracking-tight">{new Date(t.date).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <p className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">{t.project?.name}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {t.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">{t.description || '-'}</p>
                  </td>
                  <td className="px-8 py-6 text-right whitespace-nowrap">
                    <div className={cn(
                      "font-mono font-bold text-lg mb-1",
                      t.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {t.type === 'income' ? '+' : '-'} Rp {parseFloat(t.amount).toLocaleString('id-ID')}
                    </div>
                    {t.attachmentUrl && (
                      <button 
                        onClick={() => setPreviewFile({ url: t.attachmentUrl, name: `Receipt-${t.id}` })}
                        className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-600 transition-colors flex items-center gap-1 justify-end ml-auto group/btn"
                      >
                        <FileText className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                        View Attachment
                      </button>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(t)} 
                        title="Edit Transaction"
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-amber-500 transition-all border border-slate-100 dark:border-slate-700 hover:border-amber-500/30 shadow-sm"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteId(t.id)} 
                        title="Delete Transaction"
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-500 transition-all border border-slate-100 dark:border-slate-700 hover:border-red-500/20 shadow-sm"
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

        {/* Mobile Card Layout */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></div>
          ) : finances?.length === 0 ? (
            <div className="py-20 text-center text-slate-500">No transactions recorded.</div>
          ) : finances?.map((t: any) => (
            <div key={t.id} className="p-6 space-y-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                    <Calendar className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{new Date(t.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{t.project?.name}</p>
                  </div>
                </div>
                <div className={cn(
                  "font-mono font-bold text-base",
                  t.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                )}>
                  {t.type === 'income' ? '+' : '-'} {parseFloat(t.amount).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">
                  {t.category}
                </span>
                <p className="text-xs text-slate-500 flex-1 truncate">{t.description || 'No description'}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenModal(t)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest rounded-xl"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button 
                    onClick={() => setDeleteId(t.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 font-bold text-[10px] uppercase tracking-widest rounded-xl"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
                {t.attachmentUrl && (
                  <button 
                    onClick={() => setPreviewFile({ url: t.attachmentUrl, name: `Receipt-${t.id}` })}
                    className="p-2 bg-amber-500/10 text-amber-500 rounded-xl"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .recharts-tooltip-wrapper {
          --tooltip-bg: ${typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff'};
        }
      `}</style>
      
      <FilePreviewModal 
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || ''}
        fileName={previewFile?.name}
      />

      {/* Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteTransaction}
        isDeleting={isDeleting}
        title="Delete Transaction?"
        message="Are you sure you want to remove this financial record? This action cannot be undone."
      />

      {/* Create Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</h2>
                <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">{editingTransaction ? 'Modify ledger entry' : 'Record ledger entry'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleCreateTransaction} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Type</label>
                  <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, type: 'income'})}
                      className={cn(
                        "flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all",
                        formData.type === 'income' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >Income</button>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, type: 'expense'})}
                      className={cn(
                        "flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all",
                        formData.type === 'expense' ? "bg-red-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >Expense</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Date</label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    <input 
                      type="date" 
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Villa Project</label>
                <div className="relative group text-slate-900 dark:text-white">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                  <select 
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-xs focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                    value={formData.projectId}
                    onChange={e => setFormData({...formData, projectId: Number(e.target.value)})}
                  >
                    <option value={0} className="dark:bg-slate-900">Select Project</option>
                    {projects?.map((p: any) => (
                      <option key={p.id} value={p.id} className="dark:bg-slate-900">{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Category</label>
                  <div className="relative group">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="e.g. Booking, Maintenance"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Amount (IDR)</label>
                  <div className="relative group">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    <input 
                      type="number" 
                      placeholder="0"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500 transition-colors font-mono font-bold"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  rows={2}
                  placeholder="Additional notes..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Receipt/Invoice (Optional)</label>
                <div className="relative group">
                  <input 
                    id="transaction-attachment"
                    type="file" 
                    accept="image/*,application/pdf"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-slate-500 dark:text-slate-400 text-[10px] focus:outline-none focus:border-amber-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[9px] file:font-extrabold file:bg-amber-100 dark:file:bg-slate-800 file:text-amber-700 dark:file:text-slate-300 hover:file:opacity-80 transition-all"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-[10px] font-bold text-center px-4 animate-in fade-in">{error}</p>}

              <div className="pt-4 flex gap-4">
                 <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-4 rounded-2xl transition-all"
                 >Cancel</button>
                 <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50"
                 >
                   {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingTransaction ? 'Save Changes' : 'Record Transaction'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
