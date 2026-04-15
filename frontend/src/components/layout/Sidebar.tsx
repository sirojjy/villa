'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  Calendar, 
  History, 
  Wallet, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  UserCircle,
  Sun,
  Moon
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useTheme } from 'next-themes';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState, useEffect } from 'react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['super_admin', 'admin_villa', 'investor'] },
  { name: 'Front Desk', icon: Home, path: '/front-desk', roles: ['super_admin', 'admin_villa'] },
  { name: 'Riwayat Booking', icon: History, path: '/bookings', roles: ['super_admin', 'admin_villa', 'investor'] },
  { name: 'Keuangan', icon: Wallet, path: '/finance', roles: ['super_admin', 'admin_villa'] },
  { name: 'Project & Unit', icon: Calendar, path: '/projects', roles: ['super_admin'] },
  { name: 'User Management', icon: Users, path: '/users', roles: ['super_admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg text-slate-600 dark:text-slate-300 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/20 dark:bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={cn(
        "fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/50 flex flex-col transition-all duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header/Logo */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-slate-950 font-bold text-xl">SV</span>
            </div>
            <div>
              <h1 className="text-slate-900 dark:text-white font-bold leading-none">SV Villa</h1>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-xl bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-amber-500 transition-all"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center justify-between group px-4 py-3.5 rounded-2xl transition-all duration-200",
                  isActive 
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-500" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-amber-600 dark:text-amber-500" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  )} />
                  <span className="font-medium">{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </Link>
            );
          })}
        </nav>

        {/* Profile Section */}
        <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-800/50">
          <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 mb-4 transition-colors">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <UserCircle className="w-7 h-7 text-slate-400 dark:text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 dark:text-white font-medium truncate">{user?.name}</p>
              <p className="text-slate-500 text-xs truncate capitalize">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
