'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES } from '@/lib/constants';
import LoginPage from './login/page';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const roleConfig = USER_ROLES.find((r) => r.id === role);
      const defaultPath = roleConfig?.defaultPath || '/triage';
      router.replace(defaultPath);
    }
  }, [isAuthenticated, role, router]);

  // If not authenticated, render the Figma login page directly on "/" as well
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Loading transition placeholder while redirecting to role workspace
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-[#66736C] text-xs">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full border-2 border-[#006B35] border-t-transparent animate-spin" />
        <span>Navigating to your workspace...</span>
      </div>
    </div>
  );
}
