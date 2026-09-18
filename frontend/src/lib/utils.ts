import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UrgencyLevel, EncounterStatus, InventoryStatus, ReservationStatus } from '@/types/domain';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'Just now';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return `${Math.max(0, diffSeconds)}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function formatWaitTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return 'N/A';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(num);
}

export function getUrgencyConfig(urgency: UrgencyLevel | null | undefined) {
  switch (urgency) {
    case 'RED':
      return {
        label: 'RED • IMMEDIATE',
        shortLabel: 'RED',
        bg: 'bg-[#FCE8E6] text-[#C5221F] border-[#F8B4B4]',
        badgeBg: 'bg-[#DC2626] text-white',
        border: 'border-[#F8B4B4]',
        dotColor: 'bg-[#DC2626]',
        text: 'text-[#C5221F]',
        description: 'Critical indicators detected requiring immediate clinical review',
      };
    case 'YELLOW':
      return {
        label: 'YELLOW • URGENT',
        shortLabel: 'YELLOW',
        bg: 'bg-[#FEFCE8] text-[#B45309] border-[#FDE047]',
        badgeBg: 'bg-[#EAB308] text-white',
        border: 'border-[#FDE047]',
        dotColor: 'bg-[#EAB308]',
        text: 'text-[#B45309]',
        description: 'Urgent priority requiring rapid clinical assessment',
      };
    case 'GREEN':
      return {
        label: 'GREEN • STABLE',
        shortLabel: 'GREEN',
        bg: 'bg-[#EAF7EE] text-[#0F6932] border-[#A3D9B1]',
        badgeBg: 'bg-[#006B35] text-white',
        border: 'border-[#A3D9B1]',
        dotColor: 'bg-[#006B35]',
        text: 'text-[#0F6932]',
        description: 'Stable condition; standard clinical queue priority',
      };
    default:
      return {
        label: 'Unassigned',
        shortLabel: 'PENDING',
        bg: 'bg-[#EBF1ED] text-[#66736C] border-[#E2E8E4]',
        badgeBg: 'bg-[#66736C] text-white',
        border: 'border-[#E2E8E4]',
        dotColor: 'bg-[#A3AEA7]',
        text: 'text-[#66736C]',
        description: 'Pending triage assessment',
      };
  }
}

export function getEncounterStatusConfig(status: EncounterStatus | undefined) {
  switch (status) {
    case 'WAITING':
      return { label: 'Waiting', color: 'bg-[#EBF1ED] text-[#17201B] border-[#E2E8E4]' };
    case 'IN_CONSULTATION':
      return { label: 'In Consultation', color: 'bg-[#EAF7EE] text-[#006B35] border-[#C4D4C9]' };
    case 'ESCALATED':
      return { label: 'Escalated', color: 'bg-[#FCE8E6] text-[#C5221F] border-[#F8B4B4]' };
    case 'COMPLETED':
      return { label: 'Completed', color: 'bg-[#EAF7EE] text-[#006B35] border-[#A3D9B1]' };
    case 'CANCELLED':
      return { label: 'Cancelled', color: 'bg-[#EBF1ED] text-[#66736C] border-[#E2E8E4]' };
    default:
      return { label: status ?? 'Unknown', color: 'bg-[#EBF1ED] text-[#66736C] border-[#E2E8E4]' };
  }
}

export function getInventoryStatusConfig(status: InventoryStatus | undefined) {
  switch (status) {
    case 'AVAILABLE':
      return { label: 'Available', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'LOW_STOCK':
      return { label: 'Low Stock', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'OUT_OF_STOCK':
      return { label: 'Out of Stock', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: 'Unknown', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
}

export function getReservationStatusConfig(status: ReservationStatus | undefined) {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending Confirmation', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'CONFIRMED':
      return { label: 'Confirmed / Ready for Pickup', color: 'bg-sky-50 text-sky-700 border-sky-200' };
    case 'FULFILLED':
      return { label: 'Dispensed / Collected', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'REJECTED':
      return { label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'EXPIRED':
      return { label: 'Expired', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    case 'CANCELLED':
      return { label: 'Cancelled', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    default:
      return { label: status ?? 'Unknown', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
}
