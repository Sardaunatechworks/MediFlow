import { API_BASE_URL } from './constants';
import {
  ApiResponse,
  ApiErrorResponse,
  CreatePatientDto,
  CreateEncounterDto,
  UpdateEncounterStatusDto,
  CreateTriageDto,
  OverrideTriageDto,
  SearchMedicineDto,
  UpdateInventoryDto,
  CreateReservationDto,
  UpdateReservationDto,
  FacilityQueueResponse,
  AvailabilityResult,
  TriageAssessResponse,
} from '@/types/api';
import {
  Patient,
  Encounter,
  TriageAssessment,
  Medicine,
  PharmacyInventory,
  Reservation,
  Facility,
} from '@/types/domain';

export class ApiError extends Error {
  code: string;
  details: any[];
  statusCode: number;

  constructor(message: string, code = 'API_ERROR', details: any[] = [], statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (data && data.success === false) {
        const err = data as ApiErrorResponse;
        throw new ApiError(
          err.message || 'API request failed',
          err.error?.code || 'UNKNOWN_ERROR',
          err.error?.details || [],
          res.status
        );
      }
      throw new ApiError(
        data?.message || `HTTP error ${res.status}: ${res.statusText}`,
        'HTTP_ERROR',
        [],
        res.status
      );
    }

    // Backend wraps response in { success: true, message, data, meta }
    if (data && typeof data === 'object' && 'data' in data) {
      return (data as ApiResponse<T>).data;
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or connection failure
    throw new ApiError(
      error.message || 'Failed to connect to backend server. Ensure NestJS backend is running.',
      'NETWORK_ERROR',
      [error.toString()],
      0
    );
  }
}

// ============================================================
// Strongly Typed Domain API Services
// ============================================================

export const patientApi = {
  async create(dto: CreatePatientDto): Promise<Patient> {
    return request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async getById(id: string): Promise<Patient> {
    return request<Patient>(`/patients/${id}`);
  },
};

export const encounterApi = {
  async create(dto: CreateEncounterDto): Promise<Encounter> {
    return request<Encounter>('/encounters', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateStatus(id: string, dto: UpdateEncounterStatusDto): Promise<Encounter> {
    return request<Encounter>(`/encounters/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  async getById(id: string): Promise<Encounter> {
    return request<Encounter>(`/encounters/${id}`);
  },
};

export const triageApi = {
  async assess(encounterId: string, dto: CreateTriageDto): Promise<TriageAssessResponse> {
    return request<TriageAssessResponse>(`/encounters/${encounterId}/triage`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async override(triageId: string, dto: OverrideTriageDto): Promise<TriageAssessment> {
    return request<TriageAssessment>(`/triage/${triageId}/override`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async getById(id: string): Promise<TriageAssessment> {
    return request<TriageAssessment>(`/triage/${id}`);
  },
};

export const queueApi = {
  async getFacilityQueue(facilityId: string, status?: string): Promise<FacilityQueueResponse> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<FacilityQueueResponse>(`/facilities/${facilityId}/queue${query}`);
  },
};

export const medicineApi = {
  async search(query: SearchMedicineDto = {}): Promise<Medicine[]> {
    const params = new URLSearchParams();
    if (query.name) params.append('name', query.name);
    if (query.strength) params.append('strength', query.strength);
    if (query.dosageForm) params.append('dosageForm', query.dosageForm);
    const qs = params.toString();
    return request<Medicine[]>(`/medicines/search${qs ? `?${qs}` : ''}`);
  },
};

export const availabilityApi = {
  async search(params: { medicineId?: string; strength?: string; dosageForm?: string }): Promise<AvailabilityResult[]> {
    const searchParams = new URLSearchParams();
    if (params.medicineId) searchParams.append('medicineId', params.medicineId);
    if (params.strength) searchParams.append('strength', params.strength);
    if (params.dosageForm) searchParams.append('dosageForm', params.dosageForm);
    const qs = searchParams.toString();
    return request<AvailabilityResult[]>(`/availability/search${qs ? `?${qs}` : ''}`);
  },
};

export const inventoryApi = {
  async list(facilityId: string): Promise<PharmacyInventory[]> {
    return request<PharmacyInventory[]>(`/pharmacies/${facilityId}/inventory`);
  },

  async update(facilityId: string, medicineId: string, dto: UpdateInventoryDto): Promise<PharmacyInventory> {
    return request<PharmacyInventory>(`/pharmacies/${facilityId}/inventory/${medicineId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },
};

export const reservationApi = {
  async create(dto: CreateReservationDto): Promise<Reservation> {
    return request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateStatus(id: string, dto: UpdateReservationDto): Promise<Reservation> {
    return request<Reservation>(`/reservations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  async getById(id: string): Promise<Reservation> {
    return request<Reservation>(`/reservations/${id}`);
  },
};

export const pharmacyApi = {
  async getById(id: string): Promise<Facility> {
    return request<Facility>(`/pharmacies/${id}`);
  },
};
