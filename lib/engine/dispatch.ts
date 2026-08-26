import {
  GraphNode,
  GraphEdge,
  Ambulance,
  PatientRequest,
  MedicineBatch,
  MedicineTransfer,
  DecisionLogEntry,
  Telemetry,
  DispatchRequest,
  DispatchResponse,
} from './types';
import { dijkstra, aStar } from './pathfinding';
import { generateGraph, haversineKm } from './graph';
import { incrementCounter } from '../observability/metrics';

export interface EngineState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  ambulances: Ambulance[];
  medicines: MedicineBatch[];
  requests: PatientRequest[];
  decisionLog: DecisionLogEntry[];
  medicineTransfers: MedicineTransfer[];
  villages: GraphNode[];
  hospitals: GraphNode[];
  pharmacies: GraphNode[];
  depots: GraphNode[];
}

const urgencyWeights: Record<string, number> = {
  critical: 0.2,
  urgent: 0.5,
  moderate: 0.8,
  low: 1.5,
};

// Idempotency cache: avoids re-processing the same requestId within TTL
const idempotentResponses = new Map<string, { response: DispatchResponse; expiresAt: number }>();
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;

function pruneIdempotencyCache() {
  const now = Date.now();
  for (const [key, value] of idempotentResponses) {
    if (value.expiresAt <= now) idempotentResponses.delete(key);
  }
}

export function createInitialState(): EngineState {
  const g = generateGraph();
  return {
    nodes: g.nodes,
    edges: g.edges,
    ambulances: g.ambulances,
    medicines: g.medicines,
    requests: g.requests,
    decisionLog: [],
    medicineTransfers: [],
    villages: g.villages,
    hospitals: g.hospitals,
    pharmacies: g.pharmacies,
    depots: g.depots,
  };
}

let state: EngineState | null = null;

export function getState(): EngineState {
  if (!state) state = createInitialState();
  return state;
}

export function resetState() {
  state = createInitialState();
  idempotentResponses.clear();
}

export function blockEdge(edgeId: string) {
  const e = getState().edges.find((e) => e.id === edgeId);
  if (e) e.blocked = true;
}

export function unblockEdge(edgeId: string) {
  const e = getState().edges.find((e) => e.id === edgeId);
  if (e) e.blocked = false;
}

export function injectRequest(req: DispatchRequest): DispatchResponse {
  incrementCounter('dispatch_requests_total');
  pruneIdempotencyCache();
  const existing = idempotentResponses.get(req.requestId);
  if (existing && existing.expiresAt > Date.now()) return existing.response;

  const s = getState();
  const village = s.nodes.find((n) => n.id === req.villageId);
  if (!village) throw new Error('Village not found');

  const urgency = req.urgency;
  const specialty = req.specialty;

  let bestHospital: GraphNode | null = null;
  let bestRoute: { path: string[]; distance: number; durationMinutes: number } | null = null;
  let fallbackUsed = false;

  // Use haversine to pre-sort candidates (only try nearest 12) for performance at scale
  const candidates = s.hospitals
    .filter((h) => h.specialties?.includes(specialty) && (h.occupied || 0) < (h.capacity || 0))
    .sort((a, b) =>
      haversineKm(village.lat, village.lng, a.lat, a.lng) - haversineKm(village.lat, village.lng, b.lat, b.lng),
    )
    .slice(0, 12);

  if (candidates.length === 0) {
    fallbackUsed = true;
    const any = s.hospitals.find((h) => (h.occupied || 0) < (h.capacity || 0));
    if (any) candidates.push(any);
  }

  for (const h of candidates) {
    const route = aStar(s.nodes, s.edges, village.id, h.id) || dijkstra(s.nodes, s.edges, village.id, h.id);
    if (!route) continue;
    if (!bestRoute || route.distance < bestRoute.distance) {
      bestRoute = route;
      bestHospital = h;
    }
  }

  if (!bestHospital || !bestRoute) throw new Error('No route to any suitable hospital');

  const hospital = bestHospital;
  const route = bestRoute;

  let ambulance: Ambulance | null = null;
  let depot: GraphNode | null = null;
  let ambRoute: { path: string[]; distance: number; durationMinutes: number } | null = null;

  // Sort depots by haversine distance first to avoid running A* on all
  const depots = s.depots
    .slice()
    .sort((a, b) =>
      haversineKm(village.lat, village.lng, a.lat, a.lng) - haversineKm(village.lat, village.lng, b.lat, b.lng),
    );

  for (const d of depots) {
    const available = s.ambulances.filter((a) => a.nodeId === d.id && a.status === 'idle');
    if (available.length > 0) {
      ambulance = available[0];
      depot = d;
      ambRoute = aStar(s.nodes, s.edges, d.id, village.id) || dijkstra(s.nodes, s.edges, d.id, village.id);
      break;
    }
  }

  if (!ambulance) {
    for (const d of depots) {
      const any = s.ambulances.find((a) => a.nodeId === d.id);
      if (any) {
        ambulance = any;
        depot = d;
        ambRoute = aStar(s.nodes, s.edges, d.id, village.id) || dijkstra(s.nodes, s.edges, d.id, village.id);
        break;
      }
    }
  }

  if (!ambulance || !depot) throw new Error('No ambulance available');

  ambulance.status = 'busy';
  ambulance.patientId = req.requestId;
  ambulance.etaMinutes = ambRoute ? ambRoute.durationMinutes : 30;

  hospital.occupied = (hospital.occupied || 0) + 1;

  const medicinesPrepared: string[] = [];
  const missingMeds: string[] = [];
  const neededMeds =
    specialty === 'cardiology'
      ? ['Adenosine', 'Epinephrine', 'Morphine']
      : ['Amoxicillin', 'Salbutamol', 'Paracetamol'];
  for (const medName of neededMeds) {
    const stock = hospital.medicines?.[medName];
    if (stock && stock > 0) {
      medicinesPrepared.push(medName);
      hospital.medicines![medName] = stock - 1;
    } else {
      missingMeds.push(medName);
    }
  }

  const patientRequest: PatientRequest = {
    id: req.requestId,
    villageId: req.villageId,
    urgency,
    specialty,
    createdAt: Date.now(),
    assignedHospitalId: hospital.id,
    assignedAmbulanceId: ambulance.id,
    status: 'dispatched',
    route: route.path,
    ambulanceRoute: ambRoute?.path,
    estimatedArrival: Date.now() + route.durationMinutes * 60 * 1000,
    waitTimeMinutes: Math.round(route.durationMinutes + (ambRoute?.durationMinutes || 0) * 0.5),
  };
  s.requests.push(patientRequest);

  // Auto-generate medicine replenishment transfers for low-stock medicines
  triggerMedicineReplenishment(s, hospital, medicinesPrepared);

  const totalDist = route.distance + (ambRoute?.distance || 0);
  const totalTime = route.durationMinutes + (ambRoute?.durationMinutes || 0);
  const minCost = Math.round(500 + totalDist * 15 + totalTime * 2);
  const maxCost = Math.round(500 + totalDist * 25 + totalTime * 5);

  const logEntry: DecisionLogEntry = {
    id: `log-${Date.now()}`,
    timestamp: Date.now(),
    requestId: req.requestId,
    rationale: `Routed to ${hospital.label} (specialty: ${specialty}, occupancy: ${hospital.occupied}/${hospital.capacity}). Ambulance ${ambulance.id} dispatched from ${depot.label}. Distance: ${totalDist.toFixed(1)}km, ETA: ${totalTime.toFixed(0)} min.`,
    cost: route.distance + (urgencyWeights[urgency] || 1),
    costRange: `₹${minCost} - ₹${maxCost}`,
    durationMinutes: totalTime,
    path: route.path,
    hospitalId: hospital.id,
    ambulanceId: ambulance.id,
    medicinePrepared: medicinesPrepared,
  };
  s.decisionLog.unshift(logEntry);

  const response: DispatchResponse = {
    requestId: req.requestId,
    hospitalId: hospital.id,
    ambulanceId: ambulance.id,
    route: { nodeIds: route.path, distance: route.distance, durationMinutes: route.durationMinutes },
    ambulanceRoute: ambRoute ? { nodeIds: ambRoute.path, distance: ambRoute.distance, durationMinutes: ambRoute.durationMinutes } : undefined,
    estimatedArrival: patientRequest.estimatedArrival!,
    waitTimeMinutes: patientRequest.waitTimeMinutes!,
    decisionLog: [logEntry.rationale],
    medicinesPrepared,
    missingMeds,
    fallback: fallbackUsed,
  };
  idempotentResponses.set(req.requestId, { response, expiresAt: Date.now() + IDEMPOTENCY_TTL_MS });
  return response;
}

// Auto-replenishment: when a hospital's medicine stock falls below 20, dispatch a transfer from the nearest pharmacy
function triggerMedicineReplenishment(s: EngineState, hospital: GraphNode, usedMeds: string[]) {
  const nearestPharmacy = s.pharmacies
    .map((p) => ({ p, d: haversineKm(p.lat, p.lng, hospital.lat, hospital.lng) }))
    .filter((x) => x.d < Infinity)
    .sort((a, b) => a.d - b.d)[0]?.p;

  if (!nearestPharmacy) return;

  for (const medName of usedMeds) {
    const stock = hospital.medicines?.[medName] ?? 0;
    const LOW_THRESHOLD = 20;
    if (stock <= LOW_THRESHOLD) {
      const already = s.medicineTransfers.find(
        (t) => t.medicine === medName && t.toId === hospital.id && t.status === 'in-transit'
      );
      if (already) continue;

      const route = aStar(s.nodes, s.edges, nearestPharmacy.id, hospital.id) ||
                    dijkstra(s.nodes, s.edges, nearestPharmacy.id, hospital.id);
      if (!route) continue;

      const qty = 50;
      const priority: MedicineTransfer['priority'] = stock === 0 ? 'critical' : stock <= 10 ? 'high' : 'normal';
      const transfer: MedicineTransfer = {
        id: `transfer-${Date.now()}-${medName}`,
        medicine: medName,
        quantity: qty,
        fromId: nearestPharmacy.id,
        fromLabel: nearestPharmacy.label,
        fromType: 'pharmacy',
        toId: hospital.id,
        toLabel: hospital.label,
        toType: 'hospital',
        status: 'in-transit',
        createdAt: Date.now(),
        durationMinutes: route.durationMinutes,
        distance: route.distance,
        route: route.path,
        priority,
        rationale: `Low stock alert: ${medName} at ${hospital.label} is ${stock <= 0 ? 'depleted' : `at ${stock} units (threshold: ${LOW_THRESHOLD})`}. Dispatching ${qty} units from ${nearestPharmacy.label}.`,
      };
      s.medicineTransfers.unshift(transfer);
    }
  }
}

export function getTelemetry(): Telemetry {
  const s = getState();
  const queueLength = s.requests.filter((r) => r.status === 'queued').length;
  const fleetTotal = s.ambulances.length;
  const fleetBusy = s.ambulances.filter((a) => a.status === 'busy').length;
  const fleetUtilization = fleetTotal > 0 ? fleetBusy / fleetTotal : 0;

  const hospitalCapacity = s.hospitals.map((h) => ({
    id: h.id,
    label: h.label,
    pct: h.capacity ? Math.round(((h.occupied || 0) / h.capacity) * 100) : 0,
  }));

  const medicineStock = s.medicines.map((m) => ({
    id: m.id,
    name: m.name,
    hospitalId: m.hospitalId,
    stock: m.stock,
    threshold: m.threshold,
  }));

  return {
    queueLength,
    fleetUtilization,
    hospitalCapacity,
    medicineStock,
    activeRequests: s.requests.filter((r) => r.status !== 'completed' && r.status !== 'cancelled'),
  };
}

export function getGraphData(overview = true) {
  const s = getState();
  if (!overview) {
    return {
      nodes: s.nodes,
      edges: s.edges,
      ambulances: s.ambulances,
      requests: s.requests,
      decisionLog: s.decisionLog,
      medicineTransfers: s.medicineTransfers,
      metadata: { totalNodes: s.nodes.length, totalEdges: s.edges.length, representation: 'full' },
    };
  }

  // For the map view, sample villages to keep the payload manageable
  const villageSampleRate = Math.max(1, Number(process.env.BREEZEBYTE_MAP_SAMPLE_RATE || 25));
  const visibleIds = new Set(
    s.nodes.filter((node, index) => node.type !== 'village' || index % villageSampleRate === 0).map((node) => node.id),
  );
  const nodes = s.nodes.filter((node) => visibleIds.has(node.id));
  const edges = s.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  return {
    nodes,
    edges,
    ambulances: s.ambulances,
    requests: s.requests,
    decisionLog: s.decisionLog,
    medicineTransfers: s.medicineTransfers,
    metadata: {
      totalNodes: s.nodes.length,
      totalEdges: s.edges.length,
      visibleNodes: nodes.length,
      visibleEdges: edges.length,
      representation: 'geographic-overview',
      villageSampleRate,
    },
  };
}

export function getMedicineTransfers(): MedicineTransfer[] {
  return getState().medicineTransfers;
}

export function updateDispatchStatus(requestId: string, action: 'complete' | 'cancel') {
  const s = getState();
  const req = s.requests.find((r) => r.id === requestId);
  if (!req) throw new Error('Request not found');

  if (action === 'complete') {
    req.status = 'completed';
    const amb = s.ambulances.find((a) => a.id === req.assignedAmbulanceId);
    if (amb) { amb.status = 'idle'; amb.patientId = undefined; amb.etaMinutes = undefined; }
  } else if (action === 'cancel') {
    req.status = 'cancelled';
    const amb = s.ambulances.find((a) => a.id === req.assignedAmbulanceId);
    if (amb) { amb.status = 'idle'; amb.patientId = undefined; amb.etaMinutes = undefined; }
    const hosp = s.hospitals.find((h) => h.id === req.assignedHospitalId);
    if (hosp && (hosp.occupied || 0) > 0) hosp.occupied = (hosp.occupied || 1) - 1;
  }
  return req;
}

export function completeMedicineTransfer(transferId: string, action: 'complete' | 'cancel') {
  const s = getState();
  const transfer = s.medicineTransfers.find((t) => t.id === transferId);
  if (!transfer) throw new Error('Transfer not found');

  if (action === 'complete') {
    transfer.status = 'completed';
    transfer.completedAt = Date.now();
    // Credit the stock back to the hospital
    const hospital = s.hospitals.find((h) => h.id === transfer.toId);
    if (hospital && hospital.medicines) {
      hospital.medicines[transfer.medicine] = (hospital.medicines[transfer.medicine] || 0) + transfer.quantity;
    }
    const batch = s.medicines.find((m) => m.name === transfer.medicine && m.hospitalId === transfer.toId);
    if (batch) batch.stock += transfer.quantity;
  } else {
    transfer.status = 'completed'; // treat cancel as dropped
    transfer.completedAt = Date.now();
  }
  return transfer;
}

export function getDecisionLog() {
  return getState().decisionLog;
}
