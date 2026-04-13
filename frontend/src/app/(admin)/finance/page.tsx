'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Wallet, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Loader2,
  X,
  CreditCard,
  Building2,
  FileText,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const fetcher = (url: string) => api.get<any>(url).then(res => res.data);

export default function FinancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State for Expense
  const [formData, setFormData] = useState({
    projectId: 0,
    category: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const { data: financeResponse, isLoading } = useSWR(
    `/finances?project_id=${selectedProjectId}&type=${selectedType}`, 
    (url) => api.get<any>(url)
  );
  
  const { data: projects } = useSWR('/projects', fetcher);

  const transactions = financeResponse?.data || [];
  const summary = financeResponse?.summary || { total_income: 0, total_expense: 0 };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.projectId === 0) {
      setError('Please select a villa project');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.post('/finances', {
        ...formData,
        type: 'expense'
      });

      if (res.success) {
        mutate((key) => typeof key === 'string' && key.startsWith('/finances'));
        setIsModalOpen(false);
        setFormData({
          projectId: 0,
          category: '',
          description: '',
          amount: 0,
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        setError(res.error || 'Failed to record expense');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Financial Administration</h1>
          <p className="text-slate-400 mt-2">Track income from bookings and manage operational expenses.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 group self-start md:self-center"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Record Expense
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[32px] overflow-hidden relative group">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl" />
           <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Monthly Revenue (In)</p>
           <p className="text-3xl font-bold text-emerald-400">Rp {Number(summary.total_income || 0).toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[32px] overflow-hidden relative group">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-3xl" />
           <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Monthly Expenses (Out)</p>
           <p className="text-3xl font-bold text-red-400">Rp {Number(summary.total_expense || 0).toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] shadow-2xl relative group bg-gradient-to-br from-slate-900 to-slate-950">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-3xl" />
           <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-2">Net Balance</p>
           <p className="text-3xl font-bold text-white">Rp {Number((summary.total_income || 0) - (summary.total_expense || 0)).toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-[28px] flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
           <input 
            type="text" 
            placeholder="Search by description or category..."
            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="flex gap-4">
          <select 
            className="bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select 
            className="bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expense Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Date & Project</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Description</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Category</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px] text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center text-slate-600">No transactions recorded.</td></tr>
              ) : transactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div>
                      <p className="text-white font-medium">{new Date(t.date).toLocaleDateString()}</p>
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">{t.project?.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <p className="text-slate-300 text-sm">{t.description || 'No description'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-bold text-slate-400 tracking-wider inline-block">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right font-mono font-bold">
                    <div className={cn(
                      "flex items-center justify-end gap-2",
                      t.type === 'income' ? "text-emerald-400" : "text-red-400"
                    )}>
                      {t.type === 'income' ? '+' : '-'} Rp {parseFloat(t.amount).toLocaleString('id-ID')}
                      {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Record Expense</h2>
                <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">New Operational Outflow</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-8 space-y-6">
              {error && (
                 <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                 </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Villa Project</label>
                <div className="relative group">
                   <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                   <select 
                    required 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500 appearance-none"
                    value={formData.projectId}
                    onChange={e => setFormData({...formData, projectId: parseInt(e.target.value)})}
                   >
                     <option value={0}>Select Villa...</option>
                     {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Category</label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                    <select 
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500 appearance-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">Select Category...</option>
                      <option value="Utilities">Utilities (Listrik/Air)</option>
                      <option value="Maintenance">Maintenance Unit</option>
                      <option value="Salary">Salary (Gaji Staf)</option>
                      <option value="Marketing">Marketing/Sales</option>
                      <option value="Taxes">Taxes/Pajak</option>
                      <option value="Other">Other Expenses</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Date</label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input 
                      type="date" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Amount (IDR)</label>
                <div className="relative group">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input 
                    required 
                    type="number" 
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500 text-xl font-bold font-mono"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  rows={2} 
                  placeholder="Additional notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500 resize-none text-sm"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-4">
                 <button 
                  type="button" 
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all"
                 >
                  Cancel
                 </button>
                 <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                 >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Payment'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
