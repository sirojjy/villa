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
  Check
} from 'lucide-react';
import { api } from '@/lib/api';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'admin_villa',
    projectIds: [] as number[]
  });

  const { data: userData, error, isLoading } = useSWR('/users', fetcher);
  const { data: projectData } = useSWR('/projects', fetcher);

  const handleOpenModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: '', // Reset on edit
        role: user.role,
        projectIds: user.userProjects?.map((up: any) => up.projectId) || []
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'admin_villa',
        projectIds: []
      });
    }
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
          projectIds: formData.projectIds
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

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await api.delete(`/users/${id}`);
      mutate('/users');
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

      {/* Users Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="px-6 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">User</th>
                <th className="px-6 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Role</th>
                <th className="px-6 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Last Login</th>
                <th className="px-6 py-6 text-slate-500 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                   <td colSpan={4} className="px-6 py-20 text-center">
                      <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-4" />
                      <p className="text-slate-500">Loading users...</p>
                   </td>
                </tr>
              ) : userData?.map((user: any) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <Users className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold">{user.name}</p>
                        <p className="text-slate-500 text-xs">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      user.role === 'super_admin' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                      user.role === 'admin_villa' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-slate-500 text-sm">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(user)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.username !== 'admin' && (
                        <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-all">
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

              {formData.role !== 'super_admin' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Assign Villas</label>
                  <p className="text-[10px] text-slate-600 mb-2 italic">Select one or more villas this user can manage/see.</p>
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
    </div>
  );
}
