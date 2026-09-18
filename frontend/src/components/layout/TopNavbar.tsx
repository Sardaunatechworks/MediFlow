'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DEMO_FACILITIES } from '@/lib/constants';
import { Building2, ChevronDown, ShieldCheck, Check, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TopNavbar() {
  const router = useRouter();
  const { user, role, facility, setFacility, logout } = useAuth();
  const [facilityDropdownOpen, setFacilityDropdownOpen] = useState(false);

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  // Compute initials for user avatar
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-12 bg-[#F4F8F5] border-b border-[#E2E8E4] flex items-center justify-between px-6 shrink-0 select-none">
      {/* Left: Facility Indicator & Branch Selector */}
      <div className="relative">
        <button
          onClick={() => setFacilityDropdownOpen(!facilityDropdownOpen)}
          className="flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-white border border-[#E2E8E4] text-[12px] font-medium text-[#17201B] hover:bg-[#EBF1ED] transition-colors shadow-2xs"
          title="Active Healthcare Facility"
        >
          <Building2 className="w-3.5 h-3.5 text-[#006B35]" />
          <span className="max-w-[220px] truncate">{facility.name}</span>
          {facility.verificationStatus === 'VERIFIED' && (
            <ShieldCheck className="w-3.5 h-3.5 text-[#006B35]" />
          )}
          <ChevronDown className="w-3 h-3 text-[#66736C]" />
        </button>

        {facilityDropdownOpen && (
          <div
            className="absolute left-0 mt-1.5 w-72 rounded-[10px] bg-white border border-[#E2E8E4] shadow-card py-1 z-40 animate-scale-in"
            onClick={() => setFacilityDropdownOpen(false)}
          >
            <div className="px-3 py-1.5 border-b border-[#E2E8E4]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#66736C]">
                Hospital / Branch Network
              </p>
            </div>
            {DEMO_FACILITIES.map((fac) => (
              <button
                key={fac.id}
                onClick={() => setFacility(fac)}
                className={cn(
                  'w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[#F4F8F5] transition-colors',
                  fac.id === facility.id && 'bg-[#F4F8F5] font-semibold text-[#006B35]'
                )}
              >
                <div className="truncate">
                  <p className="truncate text-[#17201B]">{fac.name}</p>
                  <p className="text-[10px] text-[#66736C] capitalize">{fac.type.toLowerCase()}</p>
                </div>
                {fac.id === facility.id && <Check className="w-3.5 h-3.5 text-[#006B35] shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Authenticated User Identity (Read-only) & Sign Out */}
      <div className="flex items-center gap-3">
        {/* Read-Only Identity Card */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E2E8E4] shadow-2xs">
          <div className="w-5 h-5 rounded-full bg-[#EAF7EE] text-[#006B35] flex items-center justify-center font-bold text-[10px]">
            {getInitials(user?.name)}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-[#17201B] max-w-[140px] truncate">
              {user?.name || 'Medical Staff'}
            </span>
            <span className="text-[#66736C]">•</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#006B35] bg-[#EAF7EE] px-1.5 py-0.5 rounded-full">
              {user?.roleLabel || role.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          title="Sign out of workspace"
          className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-medium text-[#66736C] hover:text-[#C5221F] hover:bg-[#FCE8E6]/40 border border-transparent hover:border-[#FCE8E6] transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
