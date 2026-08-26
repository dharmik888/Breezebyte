import { NextRequest, NextResponse } from 'next/server';
import { getState } from '@/lib/engine/dispatch';
import { dijkstra, aStar } from '@/lib/engine/pathfinding';
import { MedicineTransfer } from '@/lib/engine/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      medicine: string;
      quantity: number;
      fromId: string;
      toId: string;
      priority?: 'critical' | 'high' | 'normal' | 'low';
    };

    const { medicine, quantity, fromId, toId, priority = 'normal' } = body;

    if (!medicine || !quantity || !fromId || !toId) {
      return NextResponse.json({ error: 'Missing fields: medicine, quantity, fromId, toId' }, { status: 400 });
    }

    const s = getState();

    const fromNode = s.nodes.find((n) => n.id === fromId);
    const toNode = s.nodes.find((n) => n.id === toId);

    if (!fromNode) return NextResponse.json({ error: 'Source node not found' }, { status: 404 });
    if (!toNode) return NextResponse.json({ error: 'Destination node not found' }, { status: 404 });

    // Calculate route using A* then fallback to Dijkstra
    const route = aStar(s.nodes, s.edges, fromId, toId) || dijkstra(s.nodes, s.edges, fromId, toId);
    if (!route) {
      return NextResponse.json({ error: 'No route found between source and destination' }, { status: 422 });
    }

    const transfer: MedicineTransfer = {
      id: `transfer-${Date.now()}-${medicine.replace(/\s+/g, '')}`,
      medicine,
      quantity,
      fromId,
      fromLabel: fromNode.label,
      fromType: fromNode.type,
      toId,
      toLabel: toNode.label,
      toType: toNode.type,
      status: 'in-transit',
      createdAt: Date.now(),
      durationMinutes: route.durationMinutes,
      distance: route.distance,
      route: route.path,
      priority: priority as MedicineTransfer['priority'],
      rationale: `Manual dispatch: ${quantity} units of ${medicine} from ${fromNode.label} to ${toNode.label}. Route: ${route.distance.toFixed(1)} km, ETA: ${route.durationMinutes} min.`,
    };

    // Push into engine state
    s.medicineTransfers.unshift(transfer);

    return NextResponse.json({
      success: true,
      transfer: {
        id: transfer.id,
        medicine: transfer.medicine,
        quantity: transfer.quantity,
        from: { id: fromNode.id, name: fromNode.label },
        to: { id: toNode.id, name: toNode.label },
        distance: route.distance,
        durationMinutes: route.durationMinutes,
        priority: transfer.priority,
        status: 'in-transit',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get('hospitalId');

  const s = getState();

  if (hospitalId) {
    const hospital = s.hospitals.find((h) => h.id === hospitalId);
    if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });

    const inventory = Object.entries(hospital.medicines ?? {}).map(([name, stock]) => ({
      name,
      stock,
      threshold: 10,
      status: (stock as number) < 10 ? 'low' : 'sufficient',
    }));

    return NextResponse.json({ hospital: { id: hospital.id, name: hospital.label }, inventory });
  }

  // Return all hospital medicine stocks
  const inventories = s.hospitals.map((h) => ({
    hospitalId: h.id,
    hospitalName: h.label,
    medicines: Object.entries(h.medicines ?? {}).map(([name, stock]) => ({ name, stock })),
  }));

  return NextResponse.json({ hospitals: inventories });
}
