import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  findNearestAmbulance,
  findOptimalHospital,
  findShortestRoute,
} from '@/lib/routing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { villageId, specialty, urgency } = body;

    if (!villageId || !specialty || !urgency) {
      return NextResponse.json(
        { error: 'Missing required fields: villageId, specialty, urgency' },
        { status: 400 }
      );
    }

    // Step 1: Find optimal hospital
    const hospitalResult = await findOptimalHospital(
      villageId,
      specialty,
      urgency
    );

    if (!hospitalResult) {
      return NextResponse.json(
        { error: 'No suitable hospital found' },
        { status: 404 }
      );
    }

    // Step 2: Find nearest available ambulance
    const ambulanceResult = await findNearestAmbulance(villageId);

    if (!ambulanceResult) {
      return NextResponse.json(
        { error: 'No available ambulances' },
        { status: 404 }
      );
    }

    // Step 3: Calculate full route (ambulance -> village -> hospital)
    const ambulanceToVillageRoute = ambulanceResult.route;
    const villageToHospitalRoute = hospitalResult.route;

    // Step 4: Create patient request
    const patientRequest = await prisma.patientRequest.create({
      data: {
        villageId,
        urgency,
        specialty,
        createdAt: Date.now(),
        assignedHospitalId: hospitalResult.hospital.id,
        assignedAmbulanceId: ambulanceResult.ambulance.id,
        status: 'assigned',
        route: JSON.stringify(villageToHospitalRoute.path),
        ambulanceRoute: JSON.stringify(ambulanceToVillageRoute.path),
        estimatedArrival:
          Date.now() +
          (ambulanceToVillageRoute.estimatedMinutes +
            villageToHospitalRoute.estimatedMinutes) *
            60000,
        waitTimeMinutes:
          ambulanceToVillageRoute.estimatedMinutes +
          villageToHospitalRoute.estimatedMinutes,
      },
    });

    // Step 5: Update ambulance status
    await prisma.ambulance.update({
      where: { id: ambulanceResult.ambulance.id },
      data: {
        status: 'busy',
        patientId: patientRequest.id,
        etaMinutes:
          ambulanceToVillageRoute.estimatedMinutes +
          villageToHospitalRoute.estimatedMinutes,
      },
    });

    // Step 6: Log decision
    await prisma.decisionLogEntry.create({
      data: {
        timestamp: Date.now(),
        requestId: patientRequest.id,
        rationale: `Assigned ${hospitalResult.hospital.label} (score: ${hospitalResult.score.toFixed(2)}) with ambulance from ${ambulanceResult.ambulance.node.label}`,
        cost: ambulanceToVillageRoute.totalDistance + villageToHospitalRoute.totalDistance,
        costRange: urgency === 'high' ? 'high-priority' : 'normal',
        durationMinutes:
          ambulanceToVillageRoute.estimatedMinutes +
          villageToHospitalRoute.estimatedMinutes,
        path: JSON.stringify([
          ...ambulanceToVillageRoute.path,
          ...villageToHospitalRoute.path.slice(1),
        ]),
        hospitalId: hospitalResult.hospital.id,
        ambulanceId: ambulanceResult.ambulance.id,
      },
    });

    // Step 7: Prepare response
    const village = await prisma.node.findUnique({
      where: { id: villageId },
    });

    return NextResponse.json({
      success: true,
      requestId: patientRequest.id,
      dispatch: {
        village: village,
        hospital: hospitalResult.hospital,
        ambulance: {
          id: ambulanceResult.ambulance.id,
          currentLocation: ambulanceResult.ambulance.node,
        },
        routes: {
          ambulanceToVillage: ambulanceToVillageRoute,
          villageToHospital: villageToHospitalRoute,
        },
        timing: {
          ambulanceArrivalMinutes: ambulanceToVillageRoute.estimatedMinutes,
          hospitalArrivalMinutes:
            ambulanceToVillageRoute.estimatedMinutes +
            villageToHospitalRoute.estimatedMinutes,
          estimatedArrivalTime: new Date(
            Date.now() +
              (ambulanceToVillageRoute.estimatedMinutes +
                villageToHospitalRoute.estimatedMinutes) *
                60000
          ).toISOString(),
        },
        metrics: {
          hospitalScore: hospitalResult.score,
          totalDistance:
            ambulanceToVillageRoute.totalDistance +
            villageToHospitalRoute.totalDistance,
        },
      },
    });
  } catch (error) {
    console.error('Ambulance dispatch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (requestId) {
      // Get specific dispatch status
      const patientRequest = await prisma.patientRequest.findUnique({
        where: { id: requestId },
      });

      if (!patientRequest) {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        );
      }

      const [village, hospital, ambulance] = await Promise.all([
        prisma.node.findUnique({ where: { id: patientRequest.villageId } }),
        patientRequest.assignedHospitalId
          ? prisma.node.findUnique({
              where: { id: patientRequest.assignedHospitalId },
            })
          : null,
        patientRequest.assignedAmbulanceId
          ? prisma.ambulance.findUnique({
              where: { id: patientRequest.assignedAmbulanceId },
              include: { node: true },
            })
          : null,
      ]);

      return NextResponse.json({
        request: patientRequest,
        village,
        hospital,
        ambulance,
      });
    }

    // Get all active dispatches
    const activeDispatches = await prisma.patientRequest.findMany({
      where: {
        status: { in: ['pending', 'assigned'] },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      dispatches: activeDispatches,
      count: activeDispatches.length,
    });
  } catch (error) {
    console.error('Get dispatch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
