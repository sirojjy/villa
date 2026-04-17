'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Key, 
  ShieldCheck,
  Building2,
  X,
  Loader2,
  Check,
  RefreshCcw
} from 'lucide-react';
import { api } from '@/lib/api';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const fetcher = (url: string) => api.get<any>(url).then(res => res.data);

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [resettingUser, setResettingUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [selectedProjectIdForUnits, setSelectedProjectIdForUnits] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'admin_villa',
    projectIds: [] as number[],
    unitIds: [] as number[]
  });

  const { data: userData, error, isLoading } = useSWR('/users', fetcher);
  const { data: projectData } = useSWR('/projects', fetcher);
  const { data: unitData } = useSWR('/units', fetcher);

  const handleOpenModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: '', // Reset on edit
        role: user.role,
        projectIds: user.userProjects?.map((up: any) => up.projectId) || [],
        unitIds: user.userUnits?.map((uu: any) => uu.unitId) || []
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'admin_villa',
        projectIds: [],
        unitIds: []
      });
    }
    setSelectedProjectIdForUnits(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          name: formData.name,
          role: formData.role,
          projectIds: formData.role === 'admin_villa' ? formData.projectIds : [],
          unitIds: formData.role === 'investor' ? formData.unitIds : []
        });
      } else {
        await api.post('/users', formData);
      }
      mutate('/users');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/users/${deleteId}`);
      mutate('/users');
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPassword) return;
    setIsSubmitting(true);
    try {
      await api.put(`/users/${resettingUser.id}/reset-password`, { password: newPassword });
      setResettingUser(null);
      setNewPassword('');
      alert('Password reset successfully');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">User Management</h1>
          <p className="text-slate-400 mt-2">Create and manage access for admins and investors.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New User
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name or username..."
            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Responsive Container */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Staff Profile</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Access Level</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Last Activity</th>
                <th className="px-8 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px] text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                   <td colSpan={4} className="px-6 py-24 text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
                      <p className="text-slate-500 font-bold text-sm">Loading user database...</p>
                   </td>
                </tr>
              ) : userData?.map((user: any) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[1.25rem] bg-slate-800 flex items-center justify-center border border-slate-700 shadow-inner">
                        <Users className="w-6 h-6 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-white font-black text-lg tracking-tight leading-none mb-1">{user.name}</p>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-500" /> @{user.username}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      user.role === 'super_admin' ? "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]" :
                      user.role === 'admin_villa' ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                    )}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-tighter">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'First Login Pending'}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                        onClick={() => setResettingUser(user)} 
                        title="Reset Password"
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 hover:text-amber-500 transition-all border border-slate-700 shadow-sm"
                      >
                        <RefreshCcw className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(user)} 
                        title="Edit User"
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 hover:text-white transition-all border border-slate-700 shadow-sm"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.username !== 'admin' && (
                        <button 
                          onClick={() => setDeleteId(user.id)} 
                          title="Delete User"
                          className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-red-500 transition-all border border-red-500/10 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden divide-y divide-slate-800/50">
           {isLoading ? (
             <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></div>
           ) : userData?.map((user: any) => (
             <div key={user.id} className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                        <Users className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-black">{user.name}</p>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">@{user.username}</p>
                      </div>
                   </div>
                   <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      user.role === 'super_admin' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                      user.role === 'admin_villa' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                      {user.role.replace('_', ' ')}
                    </span>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setResettingUser(user)} className="flex-1 bg-slate-800 h-10 rounded-xl text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                     <RefreshCcw className="w-3.5 h-3.5" /> Key
                   </button>
                   <button onClick={() => handleOpenModal(user)} className="flex-1 bg-slate-800 h-10 rounded-xl text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                     <Edit className="w-3.5 h-3.5" /> Edit
                   </button>
                   {user.username !== 'admin' && (
                     <button onClick={() => setDeleteId(user.id)} className="w-10 h-10 bg-red-500/10 rounded-xl text-red-500 flex items-center justify-center">
                       <Trash2 className="w-3.5 h-3.5" />
                     </button>
                   )}
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
                  <input 
                    required 
                    readOnly={!!editingUser}
                    type="text" 
                    className={cn(
                      "w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all",
                      editingUser && "opacity-50 cursor-not-allowed"
                    )}
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                  <input 
                    required 
                    type="password" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Role</label>
                <div className="grid grid-cols-3 gap-3">
                  {['super_admin', 'admin_villa', 'investor'].map((role) => (
                    <button 
                      key={role}
                      type="button"
                      onClick={() => setFormData({...formData, role})}
                      className={cn(
                        "py-3 rounded-2xl border transition-all text-[10px] font-bold uppercase tracking-widest",
                        formData.role === role ? "bg-amber-500 border-amber-500 text-slate-950" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                      )}
                    >
                      {role.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {formData.role === 'admin_villa' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Assign Villas</label>
                  <p className="text-[10px] text-slate-600 mb-2 italic">Select one or more villas this user can manage.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {projectData?.map((p: any) => (
                      <label key={p.id} className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        formData.projectIds.includes(p.id) ? "bg-amber-500/10 border-amber-500/50 text-amber-500" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                      )}>
                        <div className={cn(
                          "w-5 h-5 rounded flex items-center justify-center border transition-all",
                          formData.projectIds.includes(p.id) ? "bg-amber-500 border-amber-500" : "bg-slate-800 border-slate-700"
                        )}>
                          {formData.projectIds.includes(p.id) && <Check className="w-3.5 h-3.5 text-slate-950" />}
                        </div>
                        <input 
                          type="checkbox" 
                          hidden 
                          checked={formData.projectIds.includes(p.id)}
                          onChange={() => {
                            const newIds = formData.projectIds.includes(p.id)
                              ? formData.projectIds.filter(id => id !== p.id)
                              : [...formData.projectIds, p.id];
                            setFormData({...formData, projectIds: newIds});
                          }}
                        />
                        <span className="text-xs font-bold truncate">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.role === 'investor' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">1. Select Villa</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {projectData?.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedProjectIdForUnits(p.id)}
                          className={cn(
                            "py-2.5 px-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all truncate",
                            selectedProjectIdForUnits === p.id 
                              ? "bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/20" 
                              : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                          )}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedProjectIdForUnits && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">2. Assign Units</label>
                      <p className="text-[10px] text-slate-600 mb-2 italic px-1">Select units owned by investor in this villa.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar border border-slate-800/50 rounded-2xl p-2 bg-slate-950/30">
                        {unitData?.filter((u: any) => u.projectId === selectedProjectIdForUnits).map((u: any) => (
                          <label key={u.id} className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                            formData.unitIds.includes(u.id) ? "bg-amber-500/10 border-amber-500/50 text-amber-500" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                          )}>
                            <div className={cn(
                              "w-5 h-5 rounded flex items-center justify-center border transition-all",
                              formData.unitIds.includes(u.id) ? "bg-amber-500 border-amber-500" : "bg-slate-800 border-slate-700"
                            )}>
                              {formData.unitIds.includes(u.id) && <Check className="w-3.5 h-3.5 text-slate-950" />}
                            </div>
                            <input 
                              type="checkbox" 
                              hidden 
                              checked={formData.unitIds.includes(u.id)}
                              onChange={() => {
                                const newIds = formData.unitIds.includes(u.id)
                                  ? formData.unitIds.filter(id => id !== u.id)
                                  : [...formData.unitIds, u.id];
                                setFormData({...formData, unitIds: newIds});
                              }}
                            />
                            <span className="text-xs font-bold truncate">{u.name}</span>
                          </label>
                        ))}
                        {unitData?.filter((u: any) => u.projectId === selectedProjectIdForUnits).length === 0 && (
                          <div className="col-span-2 py-8 text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">
                            No units found in this villa
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Summary of currently selected units across all villas */}
                  {formData.unitIds.length > 0 && (
                    <div className="pt-2 px-1">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2">Selected: {formData.unitIds.length} Units Total</p>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.unitIds.map(id => {
                          const unit = unitData?.find((u: any) => u.id === id);
                          if (!unit) return null;
                          return (
                            <div key={id} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-2 group transition-all">
                              <span className="text-[10px] text-slate-400 font-medium">{unit.name}</span>
                              <button 
                                type="button"
                                onClick={() => setFormData({...formData, unitIds: formData.unitIds.filter(uid => uid !== id)})}
                                className="text-slate-600 hover:text-red-500 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-800 mt-8">
                <button 
                  type="button" 
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
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setResettingUser(null)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Reset Password</h2>
              <button onClick={() => setResettingUser(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleResetPassword} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">New Password for @{resettingUser.username}</label>
                <input 
                  required 
                  autoFocus
                  type="password" 
                  placeholder="Enter new password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setResettingUser(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirmed}
        isDeleting={isDeleting}
        title="Remove Access?"
        message="Are you sure you want to delete this user? They will lose all access to the system immediately."
      />
    </div>
  );
}
