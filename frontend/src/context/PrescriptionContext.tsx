'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClientPrescription, ClientPrescriptionItem, ReservationStatus } from '@/types/domain';
import { prescriptionApi } from '@/lib/api';

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
  refreshFromBackend: (patientId?: string) => Promise<void>;
}

const PrescriptionContext = createContext<PrescriptionContextType | undefined>(undefined);

function generateMvpUuid(prefix = 'mvp-px'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 8)}-${Date.now().toString(36)}`;
}

// Default Seeded Prescriptions for fallback demonstration
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
        quantity: 10,
        instructions: 'Take 2 tablets when needed for headache',
      },
    ],
  },
];

export function PrescriptionProvider({ children }: { children: React.ReactNode }) {
  const [prescriptions, setPrescriptions] = useState<ClientPrescription[]>(SEEDED_DEMO_PRESCRIPTIONS);
  const [activePrescription, setActivePrescription] = useState<ClientPrescription | null>(SEEDED_DEMO_PRESCRIPTIONS[0]);
  const [knownReservationIds, setKnownReservationIds] = useState<string[]>([]);

  const refreshFromBackend = async (patientId?: string) => {
    try {
      if (patientId) {
        const backendPrescriptions = await prescriptionApi.getByPatient(patientId);
        if (Array.isArray(backendPrescriptions) && backendPrescriptions.length > 0) {
          const mapped: ClientPrescription[] = backendPrescriptions.map((bp) => ({
            id: bp.id,
            encounterId: bp.encounterId,
            patientId: bp.patientId,
            patientName: bp.patient ? `${bp.patient.firstName} ${bp.patient.lastName}` : 'Patient',
            clinicianName: bp.clinician?.name || 'Dr. Auwal',
            issuedAt: bp.issuedAt,
            diagnosisNotes: bp.diagnosisNotes,
            status: bp.status,
            items: (bp.items || []).map((item: any) => ({
              id: item.id,
              medicineId: item.medicineId,
              medicineName: item.medicine?.genericName || 'Medicine',
              strength: item.medicine?.strength || '',
              dosageForm: item.medicine?.dosageForm || 'Tablet',
              quantity: item.quantity,
              instructions: item.instructions,
              dosageFrequency: item.dosageFrequency,
              reservationId: item.reservations?.[0]?.id,
              reservationStatus: item.reservations?.[0]?.status,
              reservedFacilityId: item.reservations?.[0]?.facilityId,
              reservedFacilityName: item.reservations?.[0]?.facility?.name,
              reservedAt: item.reservations?.[0]?.requestedAt,
            })),
          }));
          setPrescriptions((prev) => {
            const filtered = prev.filter((p) => p.patientId !== patientId);
            return [...mapped, ...filtered];
          });
        }
      }
    } catch {
      // Ignore offline errors
    }
  };

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
    const tempId = generateMvpUuid('px');
    const newPrescription: ClientPrescription = {
      id: tempId,
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

    // Update client state immediately for responsive UI
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

    // Asynchronously synchronize with backend database
    prescriptionApi
      .create({
        encounterId,
        patientId,
        diagnosisNotes,
        items: items.map((it) => ({
          medicineId: it.medicineId,
          quantity: it.quantity,
          instructions: it.instructions,
          dosageFrequency: it.dosageFrequency,
        })),
      })
      .then((createdBackend) => {
        if (createdBackend?.id) {
          setPrescriptions((prev) => {
            const updated = prev.map((p) => {
              if (p.id !== tempId) return p;
              return {
                ...p,
                id: createdBackend.id,
                items: p.items.map((it, idx) => {
                  const backendItem = createdBackend.items?.[idx];
                  return backendItem ? { ...it, id: backendItem.id } : it;
                }),
              };
            });
            try {
              sessionStorage.setItem('mediflow_mvp_prescriptions', JSON.stringify(updated));
            } catch {
              // Ignored
            }
            return updated;
          });
        }
      })
      .catch((err) => {
        console.warn('Backend prescription sync deferred/failed:', err);
      });

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
        refreshFromBackend,
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
