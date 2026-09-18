'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TopNavbar } from './TopNavbar';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // If on /login or unauthenticated on /, render full-screen without sidebar/navbar
  const isAuthPage = pathname === '/login' || (!isAuthenticated && pathname === '/');

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-screen bg-white font-sans text-[#17201B] antialiased">
        {children}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#F4F8F5] flex overflow-hidden font-sans text-[#17201B] antialiased">
      {/* Left Sidebar (Full Viewport Height) */}
      <Sidebar />

      {/* Right Content Column: Compact TopNavbar + Scrollable Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopNavbar />

        <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 lg:py-6">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
