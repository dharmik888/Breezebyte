import { prisma } from './db';
import {
  GraphNode,
  GraphEdge,
  Ambulance,
  PatientRequest,
  MedicineBatch,
  DecisionLogEntry,
  DispatchRequest
} from './engine/types';

export async function getGraphState() {
  const nodes = await prisma.node.findMany();
  const edges = await prisma.edge.findMany();
  
  // Convert DB models to engine types
  const mappedNodes: GraphNode[] = nodes.map(n => ({
    id: n.id,
    label: n.label,
    type: n.type as GraphNode['type'],
    lat: n.lat,
    lng: n.lng,
    capacity: n.capacity || undefined,
    occupied: n.occupied || undefined,
    specialties: n.specialties ? JSON.parse(n.specialties) : undefined,
    medicines: n.medicines ? JSON.parse(n.medicines) : undefined,
    ambulanceCount: n.ambulanceCount || undefined,
    availableAmbulances: n.availableAmbulances || undefined,
  }));

  const mappedEdges: GraphEdge[] = edges.map(e => ({
    id: e.id,
    source: e.sourceId,
    target: e.targetId,
    weight: e.weight,
    blocked: e.blocked,
  }));

  return { nodes: mappedNodes, edges: mappedEdges };
}

export async function getAvailableAmbulances(depotId?: string) {
  return await prisma.ambulance.findMany({
    where: {
      status: 'idle',
      ...(depotId ? { nodeId: depotId } : {})
    }
  });
}

export async function getHospitalInventory(hospitalId: string) {
  return await prisma.medicineBatch.findMany({
    where: {
      hospitalId
    }
  });
}

export async function createDispatchRequest(
  req: DispatchRequest,
  assignedHospitalId: string,
  assignedAmbulanceId: string,
  route: string[],
  ambulanceRoute: string[] | undefined,
  estimatedArrival: number,
  waitTimeMinutes: number
) {
  return await prisma.patientRequest.create({
    data: {
      id: req.requestId,
      villageId: req.villageId,
      urgency: req.urgency,
      specialty: req.specialty,
      createdAt: Date.now(),
      assignedHospitalId,
      assignedAmbulanceId,
      status: 'dispatched',
      route: JSON.stringify(route),
      ambulanceRoute: ambulanceRoute ? JSON.stringify(ambulanceRoute) : null,
      estimatedArrival,
      waitTimeMinutes
    }
  });
}

export async function createDecisionLog(
  requestId: string,
  rationale: string,
  cost: number,
  costRange: string,
  durationMinutes: number,
  path: string[],
  hospitalId: string,
  ambulanceId: string,
  medicinePrepared: string[]
) {
  return await prisma.decisionLogEntry.create({
    data: {
      timestamp: Date.now(),
      requestId,
      rationale,
      cost,
      costRange,
      durationMinutes,
      path: JSON.stringify(path),
      hospitalId,
      ambulanceId,
      medicinePrepared: JSON.stringify(medicinePrepared)
    }
  });
}

export async function updateAmbulanceStatus(ambulanceId: string, status: string, patientId: string, etaMinutes: number) {
  return await prisma.ambulance.update({
    where: { id: ambulanceId },
    data: {
      status,
      patientId,
      etaMinutes
    }
  });
}

export async function updateHospitalOccupancy(hospitalId: string, increment: number = 1) {
  return await prisma.node.update({
    where: { id: hospitalId },
    data: {
      occupied: {
        increment
      }
    }
  });
}
