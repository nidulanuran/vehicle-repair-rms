export interface ServiceRecord {
  _id: string;
  id?: string;
  vehicleId: string;
  appointmentId?: string;
  serviceDate: string;
  workDone: string;
  partsReplaced?: string[];
  totalCost: number;
  mileageAtService?: number;
  technicianName?: string;
  documents?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRecordPayload {
  vehicleId: string;
  appointmentId?: string;
  serviceDate: string;
  workDone: string;
  partsReplaced?: string[];
  totalCost: number;
  mileageAtService?: number;
  technicianName?: string;
  documents?: string[];
}
