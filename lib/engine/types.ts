export type NodeType = 'village' | 'hospital' | 'pharmacy' | 'ambulance-depot';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  lat: number;
  lng: number;
  capacity?: number;
  occupied?: number;
  specialties?: string[];
  medicines?: Record<string, number>;
  ambulanceCount?: number;
  availableAmbulances?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  blocked: boolean;
}

export interface Ambulance {
  id: string;
  nodeId: string;
  status: 'idle' | 'busy' | 'maintenance';
  patientId?: string;
  etaMinutes?: number;
}

export interface PatientRequest {
  id: string;
  villageId: string;
  urgency: 'critical' | 'urgent' | 'moderate' | 'low';
  specialty: string;
  createdAt: number;
  assignedHospitalId?: string;
  assignedAmbulanceId?: string;
  status: 'queued' | 'dispatched' | 'transported' | 'completed' | 'cancelled';
  route?: string[];
  ambulanceRoute?: string[];
  estimatedArrival?: number;
  waitTimeMinutes?: number;
}

export interface MedicineBatch {
  id: string;
  name: string;
  hospitalId: string;
  stock: number;
  threshold: number;
}

export interface DecisionLogEntry {
  id: string;
  timestamp: number;
  requestId: string;
  rationale: string;
  cost: number;
  costRange: string;
  durationMinutes: number;
  path: string[];
  hospitalId: string;
  ambulanceId?: string;
  medicinePrepared?: string[];
}

export interface MedicineTransfer {
  id: string;
  medicine: string;
  quantity: number;
  fromId: string;
  fromLabel: string;
  fromType: string;
  toId: string;
  toLabel: string;
  toType: string;
  status: 'in-transit' | 'completed';
  createdAt: number;
  durationMinutes: number;
  distance: number;
  route: string[];
  priority: 'critical' | 'high' | 'normal';
  rationale: string;
  completedAt?: number;
}

export interface Telemetry {
  queueLength: number;
  fleetUtilization: number;
  hospitalCapacity: { id: string; label: string; pct: number }[];
  medicineStock: { id: string; name: string; hospitalId: string; stock: number; threshold: number }[];
  activeRequests: PatientRequest[];
}

export interface DispatchRequest {
  requestId: string;
  villageId: string;
  urgency: 'critical' | 'urgent' | 'moderate' | 'low';
  specialty: string;
}

export interface DispatchResponse {
  requestId: string;
  hospitalId: string;
  ambulanceId: string;
  route: { nodeIds: string[]; distance: number; durationMinutes: number };
  ambulanceRoute?: { nodeIds: string[]; distance: number; durationMinutes: number };
  estimatedArrival: number;
  waitTimeMinutes: number;
  decisionLog: string[];
  medicinesPrepared: string[];
  missingMeds?: string[];
  fallback?: boolean;
}
