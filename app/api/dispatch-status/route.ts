import { NextRequest, NextResponse } from 'next/server';
import { getState, updateDispatchStatus, completeMedicineTransfer } from '@/lib/engine/dispatch';

// Get all active dispatches with detailed information
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get('type') || 'all';
  const statusFilter = searchParams.get('status') || 'all';

  const s = getState();
  const now = Date.now();

  // ─── Ambulance Dispatches ─────────────────────────────────────────────────
  let requests = s.requests;
  if (statusFilter === 'active') {
    requests = requests.filter((r) => r.status === 'dispatched' || r.status === 'queued');
  } else if (statusFilter === 'completed') {
    requests = requests.filter((r) => r.status === 'completed' || r.status === 'cancelled');
  }

  const ambulanceDispatches = requests.map((r) => {
    const village = s.nodes.find((n) => n.id === r.villageId);
    const hospital = r.assignedHospitalId ? s.nodes.find((n) => n.id === r.assignedHospitalId) : null;
    const ambulance = r.assignedAmbulanceId ? s.ambulances.find((a) => a.id === r.assignedAmbulanceId) : null;
    const depotNode = ambulance ? s.nodes.find((n) => n.id === ambulance.nodeId) : null;

    const elapsedMs = now - r.createdAt;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const totalWait = r.waitTimeMinutes ?? 0;
    const remainingMinutes = Math.max(0, totalWait - elapsedMinutes);

    return {
      id: r.id,
      type: 'ambulance',
      status: r.status === 'dispatched' ? 'assigned' : r.status,
      createdAt: r.createdAt,
      village: village
        ? { id: village.id, name: village.label, lat: village.lat, lng: village.lng }
        : null,
      hospital: hospital
        ? { id: hospital.id, name: hospital.label, lat: hospital.lat, lng: hospital.lng }
        : null,
      ambulance: ambulance
        ? {
            id: ambulance.id,
            status: ambulance.status,
            currentLocation: depotNode?.label ?? 'En Route',
            etaMinutes: ambulance.etaMinutes ?? null,
          }
        : null,
      specialty: r.specialty,
      urgency: r.urgency,
      route: r.route ?? [],
      ambulanceRoute: r.ambulanceRoute ?? [],
      timing: {
        elapsedMinutes,
        remainingMinutes,
        estimatedArrival: r.estimatedArrival ?? null,
        waitTimeMinutes: r.waitTimeMinutes ?? null,
      },
    };
  });

  // ─── Medicine Transfers ──────────────────────────────────────────────────
  let transfers = s.medicineTransfers;
  if (statusFilter === 'active') {
    transfers = transfers.filter((t) => t.status === 'in-transit');
  } else if (statusFilter === 'completed') {
    transfers = transfers.filter((t) => t.status === 'completed');
  }

  const medicineTransfers = transfers.map((t) => {
    const elapsedMs = now - t.createdAt;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const remainingMinutes = Math.max(0, t.durationMinutes - elapsedMinutes);

    // Auto-complete transfer if its duration has elapsed
    if (t.status === 'in-transit' && remainingMinutes <= 0) {
      completeMedicineTransfer(t.id, 'complete');
    }

    return {
      id: t.id,
      type: 'medicine',
      status: t.status,
      createdAt: t.createdAt,
      medicine: {
        medicine: t.medicine,
        quantity: t.quantity,
        source: t.fromLabel,
      },
      from: { id: t.fromId, name: t.fromLabel, type: t.fromType },
      to: { id: t.toId, name: t.toLabel, type: t.toType },
      hospital: { id: t.toId, name: t.toLabel },
      route: t.route,
      distance: t.distance,
      timing: {
        elapsedMinutes,
        remainingMinutes,
        totalMinutes: t.durationMinutes,
        estimatedCompletion: t.createdAt + t.durationMinutes * 60000,
        progress:
          t.durationMinutes > 0
            ? Math.min(1, elapsedMinutes / t.durationMinutes)
            : 1,
      },
      priority: t.priority,
      rationale: t.rationale,
    };
  });

  // ─── Summary ─────────────────────────────────────────────────────────────
  const summary = {
    activeAmbulances: s.ambulances.filter((a) => a.status === 'busy').length,
    activeMedicineTransfers: s.medicineTransfers.filter((t) => t.status === 'in-transit').length,
    totalAmbulances: s.ambulances.length,
    totalMedicineTransfers: s.medicineTransfers.length,
  };

  return NextResponse.json({
    ambulanceDispatches: typeFilter === 'medicine' ? [] : ambulanceDispatches,
    medicineTransfers: typeFilter === 'ambulance' ? [] : medicineTransfers,
    summary,
  });
}

// PATCH – complete or cancel a dispatch / medicine transfer
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as {
      dispatchId: string;
      type: 'ambulance' | 'medicine';
      action: 'complete' | 'cancel';
    };
    const { dispatchId, type, action } = body;

    if (!dispatchId || !type || !action) {
      return NextResponse.json({ error: 'Missing fields: dispatchId, type, action' }, { status: 400 });
    }

    if (type === 'ambulance') {
      const req = updateDispatchStatus(dispatchId, action);
      return NextResponse.json({ success: true, status: req.status });
    }

    if (type === 'medicine') {
      const transfer = completeMedicineTransfer(dispatchId, action);
      return NextResponse.json({ success: true, status: transfer.status });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
