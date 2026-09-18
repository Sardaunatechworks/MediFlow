'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClientPrescription, ClientPrescriptionItem, ReservationStatus } from '@/types/domain';

interface PrescriptionContextType {
  prescriptions: ClientPrescription[];
  addPrescription: (
    encounterId: string,
    patientId: string,
    patientName: string,
    clinicianName: string,
    items: Omit<ClientPrescriptionItem, 'id'>[],
    diagnosisNotes?: string
  ) => ClientPrescription;
  getPrescriptionsForPatient: (patientId: string) => ClientPrescription[];
  getPrescriptionById: (id: string) => ClientPrescription | undefined;
  activePrescription: ClientPrescription | null;
  setActivePrescription: (prescription: ClientPrescription | null) => void;
  updateItemReservation: (
    prescriptionId: string,
    prescriptionItemId: string,
    reservationId: string,
    reservationStatus: ReservationStatus,
    facilityId: string,
    facilityName: string
  ) => void;
  updateReservationStatus: (reservationId: string, newStatus: ReservationStatus) => void;
  knownReservationIds: string[];
  recordReservationId: (reservationId: string) => void;
}

const PrescriptionContext = createContext<PrescriptionContextType | undefined>(undefined);

function generateMvpUuid(prefix = 'mvp-px'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 8)}-${Date.now().toString(36)}`;
}

// Default Seeded Prescriptions for testing & hackathon demonstration
const SEEDED_DEMO_PRESCRIPTIONS: ClientPrescription[] = [
  {
    id: 'px-demo-seed-001',
    encounterId: 'seed-enc-red-001',
    patientId: 'seed-pt-red-001',
    patientName: 'Musa Danladi',
    clinicianName: 'Dr. Auwal (Senior Clinician)',
    issuedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    diagnosisNotes: 'Suspected Acute Coronary Event. Emergency stabilization & anti-hypertensive therapy initiated.',
    status: 'ISSUED',
    items: [
      {
        id: 'px-item-001',
        medicineId: 'seed-med-amlodipine',
        medicineName: 'Amlodipine',
        strength: '5mg',
        dosageForm: 'Tablet',
        quantity: 30,
        instructions: 'Take 1 tablet daily in the morning',
      },
    ],
  },
  {
    id: 'px-demo-seed-002',
    encounterId: 'seed-enc-yellow-002',
    patientId: 'seed-pt-yellow-002',
    patientName: 'Emeka Okonkwo',
    clinicianName: 'Dr. Auwal (Senior Clinician)',
    issuedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    diagnosisNotes: 'Acute febrile illness consistent with malaria presentation. Artemisinin-combination therapy prescribed.',
    status: 'ISSUED',
    items: [
      {
        id: 'px-item-002',
        medicineId: 'seed-med-coartem',
        medicineName: 'Artemether-Lumefantrine',
        strength: '20mg/120mg',
        dosageForm: 'Tablet',
        quantity: 24,
        instructions: 'Take 4 tablets initially, then 4 tablets after 8 hours, then 4 tablets twice daily for 2 days',
      },
      {
        id: 'px-item-003',
        medicineId: 'seed-med-paracetamol',
        medicineName: 'Paracetamol',
        strength: '500mg',
        dosageForm: 'Tablet',
        quantity: 20,
        instructions: 'Take 2 tablets every 6 hours for high temperature',
      },
    ],
  },
  {
    id: 'px-demo-seed-003',
    encounterId: 'seed-enc-green-003',
    patientId: 'seed-pt-green-003',
    patientName: 'Fatima Bello',
    clinicianName: 'Dr. Auwal (Senior Clinician)',
    issuedAt: new Date(Date.now() - 80 * 60000).toISOString(),
    diagnosisNotes: 'Tension-type headache and mild rhinitis. Analgesic prescribed.',
    status: 'ISSUED',
    items: [
      {
        id: 'px-item-004',
        medicineId: 'seed-med-paracetamol',
        medicineName: 'Paracetamol',
        strength: '500mg',
        dosageForm: 'Tablet',
        quantity: 20,
        instructions: 'Take 1 to 2 tablets every 8 hours as needed for headache',
      },
    ],
  },
];

export function PrescriptionProvider({ children }: { children: React.ReactNode }) {
  const [prescriptions, setPrescriptions] = useState<ClientPrescription[]>(SEEDED_DEMO_PRESCRIPTIONS);
  const [activePrescription, setActivePrescription] = useState<ClientPrescription | null>(SEEDED_DEMO_PRESCRIPTIONS[0]);
  const [knownReservationIds, setKnownReservationIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('mediflow_mvp_prescriptions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPrescriptions(parsed);
          setActivePrescription(parsed[0]);
        }
      } else {
        // If empty in session storage, persist default seeded demonstration prescriptions
        sessionStorage.setItem('mediflow_mvp_prescriptions', JSON.stringify(SEEDED_DEMO_PRESCRIPTIONS));
      }

      const storedRes = sessionStorage.getItem('mediflow_known_reservation_ids');
      if (storedRes) {
        const parsedRes = JSON.parse(storedRes);
        if (Array.isArray(parsedRes)) {
          setKnownReservationIds(parsedRes);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  const recordReservationId = (id: string) => {
    setKnownReservationIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [id, ...prev];
      try {
        sessionStorage.setItem('mediflow_known_reservation_ids', JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
  };

  const addPrescription = (
    encounterId: string,
    patientId: string,
    patientName: string,
    clinicianName: string,
    items: Omit<ClientPrescriptionItem, 'id'>[],
    diagnosisNotes?: string
  ): ClientPrescription => {
    const newPrescription: ClientPrescription = {
      id: generateMvpUuid('px'),
      encounterId,
      patientId,
      patientName,
      clinicianName,
      issuedAt: new Date().toISOString(),
      diagnosisNotes,
      status: 'ISSUED',
      items: items.map((item) => ({
        ...item,
        id: generateMvpUuid('item'),
      })),
    };

    setPrescriptions((prev) => {
      const updated = [newPrescription, ...prev];
      try {
        sessionStorage.setItem('mediflow_mvp_prescriptions', JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });

    setActivePrescription(newPrescription);
    return newPrescription;
  };

  const updateItemReservation = (
    prescriptionId: string,
    prescriptionItemId: string,
    reservationId: string,
    reservationStatus: ReservationStatus,
    facilityId: string,
    facilityName: string
  ) => {
    setPrescriptions((prev) => {
      const updated = prev.map((px) => {
        if (px.id !== prescriptionId) return px;
        const updatedItems = px.items.map((item) => {
          if (item.id !== prescriptionItemId) return item;
          return {
            ...item,
            reservationId,
            reservationStatus,
            reservedFacilityId: facilityId,
            reservedFacilityName: facilityName,
            reservedAt: new Date().toISOString(),
          };
        });
        return {
          ...px,
          items: updatedItems,
        };
      });

      try {
        sessionStorage.setItem('mediflow_mvp_prescriptions', JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
  };

  const updateReservationStatus = (reservationId: string, newStatus: ReservationStatus) => {
    setPrescriptions((prev) => {
      const updated = prev.map((px) => {
        let hasChanged = false;
        const updatedItems = px.items.map((item) => {
          if (item.reservationId === reservationId) {
            hasChanged = true;
            return {
              ...item,
              reservationStatus: newStatus,
            };
          }
          return item;
        });
        return hasChanged ? { ...px, items: updatedItems } : px;
      });

      try {
        sessionStorage.setItem('mediflow_mvp_prescriptions', JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
  };

  const getPrescriptionsForPatient = (patientId: string) => {
    return prescriptions.filter((p) => p.patientId === patientId);
  };

  const getPrescriptionById = (id: string) => {
    return prescriptions.find((p) => p.id === id);
  };

  return (
    <PrescriptionContext.Provider
      value={{
        prescriptions,
        addPrescription,
        getPrescriptionsForPatient,
        getPrescriptionById,
        activePrescription,
        setActivePrescription,
        updateItemReservation,
        updateReservationStatus,
        knownReservationIds,
        recordReservationId,
      }}
    >
      {children}
    </PrescriptionContext.Provider>
  );
}

export function usePrescriptions() {
  const context = useContext(PrescriptionContext);
  if (!context) {
    throw new Error('usePrescriptions must be used within a PrescriptionProvider');
  }
  return context;
}
