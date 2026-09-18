'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, PRESET_ACCOUNTS } from '@/context/AuthContext';
import { UserRole } from '@/types/domain';
import { useToast } from '@/context/ToastContext';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoleForDemo, setSelectedRoleForDemo] = useState<UserRole | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Validation Error', 'Please enter your work email.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password, selectedRoleForDemo || undefined);
      toast.success('Signed in successfully', `Welcome, ${res.user.name} (${res.user.roleLabel})`);
      router.push(res.defaultPath);
    } catch (err: any) {
      toast.error('Sign-in Failed', err?.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (roleKey: UserRole) => {
    const preset = PRESET_ACCOUNTS[roleKey];
    setEmail(preset.email);
    setPassword('••••••••••••');
    setSelectedRoleForDemo(roleKey);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col md:flex-row bg-white font-sans antialiased overflow-x-hidden">
      {/* LEFT COLUMN: Figma Deep Green Branding Panel */}
      <div className="w-full md:w-1/2 bg-[#003D20] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-20 relative select-none shrink-0 min-h-[360px] md:min-h-screen">
        {/* Brand Logo Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white leading-none">
            MediFlow
          </h1>
        </div>

        {/* Centered Value Proposition */}
        <div className="my-auto py-12 max-w-lg">
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-white tracking-tight leading-[1.15]">
            Smarter coordination from urgency to medicine access.
          </h2>
          <p className="text-white/80 text-sm sm:text-[15px] font-normal mt-6 max-w-md leading-relaxed">
            Prioritize patients by clinical urgency, coordinate care teams, and connect prescriptions with verified medicine availability.
          </p>
        </div>

        {/* Empty bottom spacer for perfect vertical balance */}
        <div className="hidden md:block text-[11px] text-white/40">
          Emergency Severity Index (ESI) Acuity & Verified Pharmacy Mesh
        </div>
      </div>

      {/* RIGHT COLUMN: Figma Clean White Sign-in Form */}
      <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20 min-h-[500px] md:min-h-screen">
        <div className="w-full max-w-[380px] mx-auto">
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-[28px] font-bold text-[#17201B] tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-[#66736C] mt-1 font-normal">
              Sign in to your healthcare workspace.
            </p>
          </div>

          {/* Form Controls */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="work-email"
                className="block text-xs font-medium text-[#17201B] mb-1.5"
              >
                Work email
              </label>
              <input
                id="work-email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@hospital.org"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedRoleForDemo(null);
                }}
                className="w-full h-10 px-3.5 rounded-[8px] border border-[#E2E8E4] bg-white text-sm text-[#17201B] placeholder:text-[#66736C]/60 focus:outline-none focus:border-[#006B35] focus:ring-1 focus:ring-[#006B35] transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[#17201B] mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3.5 rounded-[8px] border border-[#E2E8E4] bg-white text-sm text-[#17201B] placeholder:text-[#66736C]/60 focus:outline-none focus:border-[#006B35] focus:ring-1 focus:ring-[#006B35] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-10 rounded-[8px] bg-[#006B35] hover:bg-[#004D27] text-white font-medium text-sm transition-colors flex items-center justify-center shadow-xs disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in securely'}
            </button>

            <p className="text-center text-[11px] text-[#66736C] pt-3">
              Authorized hospital and pharmacy personnel only.
            </p>
          </form>

          {/* ISOLATED DEVELOPMENT / EVALUATION HELPER (Strictly labeled for testing/hackathon reviewers) */}
          <div className="mt-10 pt-6 border-t border-[#E2E8E4]/80">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#66736C] uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#006B35]" />
              <span>Evaluation Demo Accounts (1-Click Fill)</span>
            </div>
            <p className="text-[11px] text-[#66736C] mb-3 leading-relaxed">
              Select an official role persona to populate credentials and test their specialized workflow:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { role: 'TRIAGE_OFFICER' as UserRole, label: 'Nurse Ibrahim', badge: 'Triage' },
                { role: 'CLINICIAN' as UserRole, label: 'Dr. Auwal', badge: 'Clinician' },
                { role: 'PATIENT' as UserRole, label: 'Musa Danladi', badge: 'Patient' },
                { role: 'PHARMACY_STAFF' as UserRole, label: 'Pharm. Zainab', badge: 'Pharmacy' },
                { role: 'HOSPITAL_ADMIN' as UserRole, label: 'Director Bello', badge: 'Hosp. Admin' },
                { role: 'PLATFORM_ADMIN' as UserRole, label: 'Super Admin', badge: 'Super Admin' },
              ].map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleQuickFill(item.role)}
                  className={`px-2 py-1.5 rounded-[6px] border text-left transition-colors flex flex-col justify-between ${
                    selectedRoleForDemo === item.role
                      ? 'border-[#006B35] bg-[#EAF7EE] text-[#006B35] font-semibold'
                      : 'border-[#E2E8E4] bg-[#F4F8F5] text-[#17201B] hover:bg-[#EBF1ED]'
                  }`}
                >
                  <span className="text-[11px] font-medium leading-tight truncate">{item.label}</span>
                  <span className="text-[9px] text-[#66736C] font-mono mt-0.5">{item.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
