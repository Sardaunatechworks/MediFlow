'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Activity,
  Users,
  Stethoscope,
  Pill,
  Search,
  Building2,
  BarChart3,
  ShieldAlert,
  ClipboardList,
  PlusCircle,
  FileText,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const { role, user } = useAuth();

  // Role-specific Navigation mapped into Figma's clean navigation language
  const getNavItems = (): NavItem[] => {
    switch (role) {
      case 'TRIAGE_OFFICER':
        return [
          { label: 'Triage Desk', href: '/triage' },
          { label: 'Register Patient', href: '/patient/check-in' },
          { label: 'Live Queue', href: '/clinician/queue' },
          { label: 'Medicine Search', href: '/patient/search' },
        ];

      case 'CLINICIAN':
        return [
          { label: 'Live Queue', href: '/clinician/queue' },
          { label: 'Triage Desk', href: '/triage' },
          { label: 'Prescriptions', href: '/patient/prescriptions' },
          { label: 'Medicine Search', href: '/patient/search' },
        ];

      case 'PATIENT':
        return [
          { label: 'Live Queue', href: '/patient/queue' },
          { label: 'Register / Check-in', href: '/patient/check-in' },
          { label: 'My Prescriptions', href: '/patient/prescriptions' },
          { label: 'Medicine Search', href: '/patient/search' },
        ];

      case 'PHARMACY_STAFF':
      case 'PHARMACY_ADMIN':
        return [
          { label: 'Reservations Queue', href: '/pharmacy/reservations' },
          { label: 'Inventory Stock', href: '/pharmacy/inventory' },
          { label: 'Medicine Search', href: '/patient/search' },
          { label: 'Prescriptions Hub', href: '/patient/prescriptions' },
        ];

      case 'HOSPITAL_ADMIN':
        return [
          { label: 'Overview', href: '/admin/hospital' },
          { label: 'Triage Desk', href: '/triage' },
          { label: 'Live Queue', href: '/clinician/queue' },
          { label: 'Pharmacy', href: '/pharmacy/reservations' },
          { label: 'Operations & Throughput', href: '/admin/hospital' },
        ];

      case 'PLATFORM_ADMIN':
        return [
          { label: 'Overview', href: '/admin/platform' },
          { label: 'Facility Verifications', href: '/admin/platform' },
          { label: 'Hospital Operations', href: '/admin/hospital' },
          { label: 'Triage Desk', href: '/triage' },
          { label: 'Live Queue', href: '/clinician/queue' },
        ];

      default:
        return [
          { label: 'Triage Desk', href: '/triage' },
          { label: 'Live Queue', href: '/clinician/queue' },
          { label: 'Prescriptions', href: '/patient/prescriptions' },
          { label: 'Medicine Search', href: '/patient/search' },
          { label: 'Pharmacy', href: '/pharmacy/reservations' },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-[210px] bg-[#003D20] text-[#CFDFD6] flex flex-col shrink-0 h-full select-none">
      {/* Figma Top Brand Section */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/" className="block group">
          <h1 className="text-[19px] font-bold text-white tracking-tight leading-none">
            MediFlow
          </h1>
          <p className="text-[11px] text-[#8CA696] font-medium mt-1 tracking-normal">
            Healthcare Coordination
          </p>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-[#006B35] text-white font-semibold shadow-xs'
                  : 'text-[#CFDFD6] hover:bg-white/8 hover:text-white'
              )}
            >
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Authenticated User Identity Footer */}
      <div className="p-4 border-t border-[#004D27]/80 text-[11px] text-[#8CA696]">
        <span className="uppercase text-[9px] tracking-wider font-semibold block text-[#698873]">
          Authenticated Workspace
        </span>
        <p className="font-semibold text-white truncate mt-0.5">
          {user?.name || 'Medical Staff'}
        </p>
        <p className="text-[10px] text-[#8CA696] truncate">
          {user?.title || role.replace('_', ' ')}
        </p>
      </div>
    </aside>
  );
}
