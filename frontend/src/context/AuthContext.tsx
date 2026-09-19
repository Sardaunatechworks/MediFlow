'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Facility } from '@/types/domain';
import { DEMO_FACILITIES, USER_ROLES } from '@/lib/constants';
import { authApi } from '@/lib/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  title?: string;
  facilityId: string;
}

// Preset Accounts for role demonstration (used for development evaluation & instant testing)
export const PRESET_ACCOUNTS: Record<UserRole, AuthUser> = {
  TRIAGE_OFFICER: {
    id: 'user-triage-001',
    name: 'Nurse Ibrahim',
    email: 'nurse.ibrahim@nationalhospital.gov.ng',
    role: 'TRIAGE_OFFICER',
    roleLabel: 'Triage Officer / Nurse',
    title: 'Lead Triage Nurse',
    facilityId: 'f1000000-0000-0000-0000-000000000001',
  },
  CLINICIAN: {
    id: 'user-doc-001',
    name: 'Dr. Auwal',
    email: 'dr.auwal@nationalhospital.gov.ng',
    role: 'CLINICIAN',
    roleLabel: 'Attending Clinician',
    title: 'Consultant Physician',
    facilityId: 'f1000000-0000-0000-0000-000000000001',
  },
  PATIENT: {
    id: 'user-pt-001',
    name: 'Musa Danladi',
    email: 'musa.danladi@example.com',
    role: 'PATIENT',
    roleLabel: 'Patient Portal',
    title: 'Verified Patient',
    facilityId: 'f1000000-0000-0000-0000-000000000001',
  },
  PHARMACY_STAFF: {
    id: 'user-pharm-001',
    name: 'Pharm. Zainab',
    email: 'zainab@medplus.ng',
    role: 'PHARMACY_STAFF',
    roleLabel: 'Pharmacy Staff',
    title: 'Dispensing Pharmacist',
    facilityId: 'f2000000-0000-0000-0000-000000000001',
  },
  PHARMACY_ADMIN: {
    id: 'user-pharm-admin-001',
    name: 'Pharm. Director Okon',
    email: 'okon@medplus.ng',
    role: 'PHARMACY_ADMIN',
    roleLabel: 'Pharmacy Admin',
    title: 'Superintendent Pharmacist',
    facilityId: 'f2000000-0000-0000-0000-000000000001',
  },
  HOSPITAL_ADMIN: {
    id: 'user-hosp-admin-001',
    name: 'Director Bello',
    email: 'admin.bello@nationalhospital.gov.ng',
    role: 'HOSPITAL_ADMIN',
    roleLabel: 'Hospital Administrator',
    title: 'Chief Medical Director',
    facilityId: 'f1000000-0000-0000-0000-000000000001',
  },
  PLATFORM_ADMIN: {
    id: 'user-plat-admin-001',
    name: 'Super Admin Danladi',
    email: 'superadmin@mediflow.mesh.gov.ng',
    role: 'PLATFORM_ADMIN',
    roleLabel: 'Platform Administrator',
    title: 'Ecosystem Super Admin',
    facilityId: 'f1000000-0000-0000-0000-000000000001',
  },
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: UserRole;
  facility: Facility;
  setFacility: (facility: Facility) => void;
  activePatientId: string | null;
  setActivePatientId: (id: string | null) => void;
  activeEncounterId: string | null;
  setActiveEncounterId: (id: string | null) => void;
  login: (email: string, password?: string, targetRole?: UserRole) => Promise<{ success: boolean; user: AuthUser; defaultPath: string }>;
  logout: () => void;
  setRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRoleState] = useState<UserRole>('TRIAGE_OFFICER');
  const [facility, setFacilityState] = useState<Facility>(DEMO_FACILITIES[0]);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check saved session in localStorage
    try {
      const savedSession = localStorage.getItem('mediflow_auth_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed?.role && USER_ROLES.some((r) => r.id === parsed.role)) {
          setUser(parsed);
          setRoleState(parsed.role);
          setIsAuthenticated(true);
          const matchedFacility = DEMO_FACILITIES.find((f) => f.id === parsed.facilityId);
          if (matchedFacility) setFacilityState(matchedFacility);
        }
      }
    } catch {
      // Ignore storage errors
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const login = async (
    email: string,
    password?: string,
    targetRole?: UserRole
  ): Promise<{ success: boolean; user: AuthUser; defaultPath: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Determine role from targetRole, or auto-detect from email pattern
    let resolvedRole: UserRole = targetRole || 'TRIAGE_OFFICER';

    if (!targetRole) {
      if (cleanEmail.includes('doc') || cleanEmail.includes('clinician')) {
        resolvedRole = 'CLINICIAN';
      } else if (cleanEmail.includes('nurse') || cleanEmail.includes('triage')) {
        resolvedRole = 'TRIAGE_OFFICER';
      } else if (cleanEmail.includes('patient') || cleanEmail.includes('musa')) {
        resolvedRole = 'PATIENT';
      } else if (cleanEmail.includes('zainab') || cleanEmail.includes('pharmacy')) {
        resolvedRole = 'PHARMACY_STAFF';
      } else if (cleanEmail.includes('okon')) {
        resolvedRole = 'PHARMACY_ADMIN';
      } else if (cleanEmail.includes('platform') || cleanEmail.includes('super')) {
        resolvedRole = 'PLATFORM_ADMIN';
      } else if (cleanEmail.includes('admin') || cleanEmail.includes('bello')) {
        resolvedRole = 'HOSPITAL_ADMIN';
      }
    }

    const preset = PRESET_ACCOUNTS[resolvedRole] || PRESET_ACCOUNTS.TRIAGE_OFFICER;
    let authenticatedUser: AuthUser = {
      ...preset,
      email: cleanEmail || preset.email,
    };

    // Attempt real backend authentication
    try {
      const authRes = await authApi.login(authenticatedUser.email, password || 'Password123!');
      if (authRes?.accessToken) {
        localStorage.setItem('mediflow_auth_token', authRes.accessToken);
        if (authRes.user) {
          authenticatedUser = {
            id: authRes.user.id,
            name: authRes.user.name,
            email: authRes.user.email,
            role: authRes.user.role as UserRole,
            roleLabel: preset.roleLabel,
            title: authRes.user.title || preset.title,
            facilityId: authRes.user.facilityId || preset.facilityId,
          };
          resolvedRole = authenticatedUser.role;
        }
      }
    } catch (err) {
      console.warn('Backend login attempt fell back to offline/preset session:', err);
    }

    setUser(authenticatedUser);
    setRoleState(resolvedRole);
    setIsAuthenticated(true);

    const matchedFacility = DEMO_FACILITIES.find((f) => f.id === authenticatedUser.facilityId) || DEMO_FACILITIES[0];
    setFacilityState(matchedFacility);

    try {
      localStorage.setItem('mediflow_auth_session', JSON.stringify(authenticatedUser));
    } catch {
      // Ignored
    }

    const roleConfig = USER_ROLES.find((r) => r.id === resolvedRole);
    const defaultPath = roleConfig?.defaultPath || '/triage';

    return { success: true, user: authenticatedUser, defaultPath };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    try {
      localStorage.removeItem('mediflow_auth_session');
      localStorage.removeItem('mediflow_auth_token');
    } catch {
      // Ignored
    }
  };

  const setRole = async (newRole: UserRole) => {
    const preset = PRESET_ACCOUNTS[newRole] || PRESET_ACCOUNTS.TRIAGE_OFFICER;
    let authUser: AuthUser = preset;

    try {
      const authRes = await authApi.login(preset.email, 'Password123!');
      if (authRes?.accessToken) {
        localStorage.setItem('mediflow_auth_token', authRes.accessToken);
        if (authRes.user) {
          authUser = {
            id: authRes.user.id,
            name: authRes.user.name,
            email: authRes.user.email,
            role: authRes.user.role as UserRole,
            roleLabel: preset.roleLabel,
            title: authRes.user.title || preset.title,
            facilityId: authRes.user.facilityId || preset.facilityId,
          };
        }
      }
    } catch (err) {
      console.warn('SetRole backend token acquisition fell back to preset:', err);
    }

    setUser(authUser);
    setRoleState(newRole);
    const matchedFacility = DEMO_FACILITIES.find((f) => f.id === authUser.facilityId) || DEMO_FACILITIES[0];
    setFacilityState(matchedFacility);

    try {
      localStorage.setItem('mediflow_auth_session', JSON.stringify(authUser));
    } catch {
      // Ignored
    }
  };

  const setFacility = (newFacility: Facility) => {
    setFacilityState(newFacility);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        role,
        facility,
        setFacility,
        activePatientId,
        setActivePatientId,
        activeEncounterId,
        setActiveEncounterId,
        login,
        logout,
        setRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
