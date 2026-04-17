'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Sidebar from '@/components/layout/Sidebar';
import { Loader2 } from 'lucide-react';

// Route access control mapping
const routeRoles: Record<string, string[]> = {
  '/dashboard': ['super_admin', 'admin_villa', 'investor'],
  '/front-desk': ['super_admin', 'admin_villa'],
  '/bookings': ['super_admin', 'admin_villa', 'investor'],
  '/finance': ['super_admin', 'admin_villa'],
  '/projects': ['super_admin', 'admin_villa'],
  '/users': ['super_admin'],
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    useAuthStore.persist.onFinishHydration(() => setHasHydrated(true));
    setHasHydrated(useAuthStore.persist.hasHydrated());
  }, []);

  useEffect(() => {
    if (hasHydrated && !user) {
      router.replace('/login');
    }
  }, [hasHydrated, user, router]);

  // Route-level protection: redirect to /dashboard if user doesn't have access
  useEffect(() => {
    if (hasHydrated && user) {
      const matchedRoute = Object.keys(routeRoles).find(route => pathname.startsWith(route));
      if (matchedRoute) {
        const allowedRoles = routeRoles[matchedRoute];
        if (!allowedRoles.includes(user.role)) {
          router.replace('/dashboard');
        }
      }
    }
  }, [hasHydrated, user, pathname, router]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) return null;


  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col lg:flex-row transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 lg:ml-72 min-h-screen relative pt-16 lg:pt-0">
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
