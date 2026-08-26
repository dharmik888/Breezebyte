import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.decisionLogEntry.deleteMany();
  await prisma.medicineBatch.deleteMany();
  await prisma.patientRequest.deleteMany();
  await prisma.ambulance.deleteMany();
  await prisma.edge.deleteMany();
  await prisma.node.deleteMany();

  // Create nodes (hospitals, villages, pharmacies, ambulance depots)
  const hospital1 = await prisma.node.create({
    data: {
      label: 'City General Hospital',
      type: 'hospital',
      lat: 28.6139,
      lng: 77.2090,
      capacity: 200,
      occupied: 120,
      specialties: JSON.stringify(['cardiology', 'neurology', 'emergency', 'pediatrics']),
      medicines: JSON.stringify({ aspirin: 500, insulin: 200, antibiotics: 300 }),
    },
  });

  const hospital2 = await prisma.node.create({
    data: {
      label: 'Regional Medical Center',
      type: 'hospital',
      lat: 28.6500,
      lng: 77.2167,
      capacity: 150,
      occupied: 80,
      specialties: JSON.stringify(['orthopedics', 'emergency', 'surgery']),
      medicines: JSON.stringify({ aspirin: 300, painkillers: 250, antibiotics: 400 }),
    },
  });

  const village1 = await prisma.node.create({
    data: {
      label: 'Riverside Village',
      type: 'village',
      lat: 28.5800,
      lng: 77.1800,
    },
  });

  const village2 = await prisma.node.create({
    data: {
      label: 'Hillside Village',
      type: 'village',
      lat: 28.6400,
      lng: 77.2500,
    },
  });

  const village3 = await prisma.node.create({
    data: {
      label: 'Lakeside Village',
      type: 'village',
      lat: 28.6000,
      lng: 77.2300,
    },
  });

  const pharmacy1 = await prisma.node.create({
    data: {
      label: 'MediPlus Pharmacy',
      type: 'pharmacy',
      lat: 28.6200,
      lng: 77.2100,
      medicines: JSON.stringify({ aspirin: 1000, insulin: 500, antibiotics: 800, painkillers: 600 }),
    },
  });

  const ambulanceDepot = await prisma.node.create({
    data: {
      label: 'Central Ambulance Depot',
      type: 'ambulance-depot',
      lat: 28.6100,
      lng: 77.2000,
      ambulanceCount: 10,
      availableAmbulances: 7,
    },
  });

  // Create edges (connections between nodes with distances)
  await prisma.edge.createMany({
    data: [
      // Village to Hospital connections
      { sourceId: village1.id, targetId: hospital1.id, weight: 8.5, blocked: false },
      { sourceId: village1.id, targetId: hospital2.id, weight: 12.3, blocked: false },
      { sourceId: village2.id, targetId: hospital1.id, weight: 6.2, blocked: false },
      { sourceId: village2.id, targetId: hospital2.id, weight: 4.5, blocked: false },
      { sourceId: village3.id, targetId: hospital1.id, weight: 5.8, blocked: false },
      { sourceId: village3.id, targetId: hospital2.id, weight: 9.1, blocked: false },

      // Ambulance depot connections
      { sourceId: ambulanceDepot.id, targetId: village1.id, weight: 5.0, blocked: false },
      { sourceId: ambulanceDepot.id, targetId: village2.id, weight: 4.2, blocked: false },
      { sourceId: ambulanceDepot.id, targetId: village3.id, weight: 3.8, blocked: false },
      { sourceId: ambulanceDepot.id, targetId: hospital1.id, weight: 2.5, blocked: false },
      { sourceId: ambulanceDepot.id, targetId: hospital2.id, weight: 6.7, blocked: false },

      // Pharmacy connections
      { sourceId: pharmacy1.id, targetId: hospital1.id, weight: 3.2, blocked: false },
      { sourceId: pharmacy1.id, targetId: hospital2.id, weight: 4.8, blocked: false },
    ],
  });

  // Create ambulances
  await prisma.ambulance.createMany({
    data: [
      { nodeId: ambulanceDepot.id, status: 'idle' },
      { nodeId: ambulanceDepot.id, status: 'idle' },
      { nodeId: ambulanceDepot.id, status: 'idle' },
      { nodeId: hospital1.id, status: 'idle' },
      { nodeId: hospital1.id, status: 'busy', etaMinutes: 15 },
      { nodeId: hospital2.id, status: 'idle' },
      { nodeId: hospital2.id, status: 'maintenance' },
    ],
  });

  // Create medicine batches
  await prisma.medicineBatch.createMany({
    data: [
      { name: 'Aspirin', hospitalId: hospital1.id, stock: 500, threshold: 100 },
      { name: 'Insulin', hospitalId: hospital1.id, stock: 200, threshold: 50 },
      { name: 'Antibiotics', hospitalId: hospital1.id, stock: 300, threshold: 80 },
      { name: 'Aspirin', hospitalId: hospital2.id, stock: 300, threshold: 100 },
      { name: 'Painkillers', hospitalId: hospital2.id, stock: 250, threshold: 75 },
      { name: 'Antibiotics', hospitalId: hospital2.id, stock: 400, threshold: 100 },
    ],
  });

  // Create sample patient requests
  const now = Date.now();
  await prisma.patientRequest.createMany({
    data: [
      {
        villageId: village1.id,
        urgency: 'high',
        specialty: 'cardiology',
        createdAt: now - 300000, // 5 minutes ago
        status: 'pending',
      },
      {
        villageId: village2.id,
        urgency: 'medium',
        specialty: 'emergency',
        createdAt: now - 600000, // 10 minutes ago
        status: 'assigned',
        assignedHospitalId: hospital2.id,
        waitTimeMinutes: 25,
      },
      {
        villageId: village3.id,
        urgency: 'low',
        specialty: 'pediatrics',
        createdAt: now - 900000, // 15 minutes ago
        status: 'completed',
        assignedHospitalId: hospital1.id,
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log(`   - Created ${await prisma.node.count()} nodes`);
  console.log(`   - Created ${await prisma.edge.count()} edges`);
  console.log(`   - Created ${await prisma.ambulance.count()} ambulances`);
  console.log(`   - Created ${await prisma.medicineBatch.count()} medicine batches`);
  console.log(`   - Created ${await prisma.patientRequest.count()} patient requests`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
