import { GraphNode, GraphEdge, Ambulance, PatientRequest, MedicineBatch } from './types';

const BASE_VILLAGES = Number(process.env.BREEZEBYTE_BASE_VILLAGES || 50);
const SCALE_FACTOR = Math.max(1, Number(process.env.BREEZEBYTE_SCALE_FACTOR || 1000));
const VILLAGE_COUNT = Math.max(50, Math.floor(BASE_VILLAGES * SCALE_FACTOR));
const INDIA_HOSPITAL_COUNT = Math.max(12, Math.floor(Number(process.env.BREEZEBYTE_INDIA_HOSPITALS || 120)));
// International facility counts removed — all nodes are India-only
const INDIA_PHARMACY_COUNT = Math.max(8, Math.floor(Number(process.env.BREEZEBYTE_INDIA_PHARMACIES || 80)));
const INDIA_DEPOT_COUNT = Math.max(10, Math.floor(Number(process.env.BREEZEBYTE_INDIA_DEPOTS || 60)));
const AMBULANCES_PER_DEPOT = 2;

type Region = { id: string; label: string; lat: number; lng: number; spread: number; weight: number };

const regions: Region[] = [
  { id: 'delhi-ncr', label: 'Delhi NCR, India', lat: 28.61, lng: 77.21, spread: 0.85, weight: 0.06 },
  { id: 'punjab-haryana', label: 'Punjab-Haryana, India', lat: 30.90, lng: 75.85, spread: 0.95, weight: 0.04 },
  { id: 'rajasthan', label: 'Rajasthan, India', lat: 26.91, lng: 75.79, spread: 1.25, weight: 0.05 },
  { id: 'uttar-pradesh', label: 'Uttar Pradesh, India', lat: 26.85, lng: 80.95, spread: 1.15, weight: 0.08 },
  { id: 'bihar-jharkhand', label: 'Bihar-Jharkhand, India', lat: 25.60, lng: 85.14, spread: 1.00, weight: 0.06 },
  { id: 'gujarat', label: 'Gujarat, India', lat: 23.02, lng: 72.57, spread: 1.05, weight: 0.06 },
  { id: 'maharashtra', label: 'Maharashtra, India', lat: 19.08, lng: 73.85, spread: 1.15, weight: 0.09 },
  { id: 'madhya-pradesh', label: 'Madhya Pradesh, India', lat: 23.26, lng: 77.41, spread: 1.35, weight: 0.07 },
  { id: 'chhattisgarh-odisha', label: 'Chhattisgarh-Odisha, India', lat: 21.25, lng: 81.63, spread: 1.10, weight: 0.06 },
  { id: 'west-bengal', label: 'West Bengal, India', lat: 22.57, lng: 88.10, spread: 0.85, weight: 0.06 },
  { id: 'telangana-andhra', label: 'Telangana-Andhra Pradesh, India', lat: 17.39, lng: 78.49, spread: 1.10, weight: 0.08 },
  { id: 'karnataka', label: 'Karnataka, India', lat: 12.97, lng: 77.59, spread: 1.00, weight: 0.08 },
  { id: 'tamil-nadu', label: 'Tamil Nadu, India', lat: 12.25, lng: 78.90, spread: 0.95, weight: 0.07 },
  { id: 'kerala', label: 'Kerala, India', lat: 10.85, lng: 76.30, spread: 0.55, weight: 0.04 },
  { id: 'assam-northeast', label: 'Assam Northeast, India', lat: 26.14, lng: 91.74, spread: 0.85, weight: 0.04 },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const straightLineDistance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const CIRCUITRY_FACTOR = 1.41; // Typical road network detour index
  return straightLineDistance * CIRCUITRY_FACTOR;
}

// ─── High-precision India land boundary (70 vertices) ────────────────────────
// Traced carefully along India's borders to exclude:
//   • Arabian Sea (west coast + Gulf of Kutch + Gulf of Khambhat)
//   • Bay of Bengal (east coast)
//   • Indian Ocean (southern tip)
//   • Pakistan / China / Nepal / Bhutan / Bangladesh / Myanmar land borders
//   • Sri Lanka (separate island — excluded)
const indiaLandOutline: [number, number][] = [
  // NW corner — Jammu & Kashmir / Pakistan border
  [35.50, 74.00],
  // Northern Himalayan border going east
  [34.70, 76.50],
  [34.20, 78.00],
  [33.40, 79.50],
  [32.50, 80.80],
  [31.50, 81.80],
  [30.50, 83.20],
  [29.50, 85.00],
  [28.50, 87.00],
  [27.50, 88.00],
  [27.20, 89.00],
  // Sikkim / Bhutan / Arunachal corridor
  [26.90, 90.00],
  [26.50, 91.50],
  [26.00, 93.00],
  // Arunachal Pradesh — north-east tip
  [27.50, 93.50],
  [28.00, 95.00],
  [27.20, 96.00],
  // Nagaland / Manipur — Myanmar border coming south
  [26.00, 95.00],
  [24.50, 94.00],
  [23.00, 93.50],
  // Mizoram / Tripura — south-east corner
  [22.00, 93.00],
  [21.00, 92.50],
  // Chittagong Hill Tracts / Bangladesh border
  [22.50, 91.50],
  [23.50, 91.00],
  [24.00, 90.50],
  // West Bengal coast at Bay of Bengal
  [22.00, 89.50],
  [21.50, 88.00],
  // Odisha coast
  [20.50, 87.00],
  [19.50, 85.50],
  [18.50, 84.00],
  // Andhra Pradesh coast
  [17.50, 82.50],
  [16.50, 81.50],
  [15.50, 80.50],
  [14.50, 80.20],
  [13.50, 80.30],
  // Tamil Nadu coast — south-east corner
  [12.50, 80.00],
  [11.50, 79.50],
  [10.50, 79.00],
  [9.50, 78.50],
  // Southern tip of India (Cape Comorin / Kanyakumari)
  [8.00, 77.50],
  // Kerala coast going north-west
  [8.50, 76.80],
  [9.50, 76.20],
  [10.50, 75.80],
  [11.50, 75.20],
  [12.50, 74.80],
  // Karnataka coast
  [13.50, 74.50],
  [14.50, 74.20],
  [15.50, 73.80],
  // Goa coast
  [16.50, 73.50],
  [17.50, 73.00],
  // Maharashtra coast
  [18.50, 72.80],
  [19.50, 72.50],
  [20.50, 72.50],
  // Gujarat coast — Daman / Surat area
  [21.00, 72.50],
  [21.50, 71.80],
  // Gulf of Khambhat narrows — stay inland
  [22.00, 71.00],
  // Saurashtra peninsula
  [22.50, 69.50],
  [23.00, 68.80],
  // Gulf of Kutch — north-west Gujarat
  [23.50, 68.50],
  [24.00, 69.00],
  [24.50, 70.00],
  // Rajasthan border with Pakistan (Thar Desert)
  [25.50, 70.50],
  [26.50, 70.80],
  [27.50, 71.00],
  [28.50, 71.50],
  [29.50, 71.50],
  // Punjab / J&K border going north
  [30.50, 72.00],
  [31.50, 73.00],
  [32.50, 74.00],
  [33.50, 74.00],
  [34.50, 74.00],
  [35.50, 74.00],
];

function isInsideIndia(lat: number, lng: number): boolean {
  // Fast bounding-box reject before expensive ray-cast
  if (lat < 7.5 || lat > 36.0 || lng < 68.0 || lng > 97.5) return false;
  let inside = false;
  for (let i = 0, j = indiaLandOutline.length - 1; i < indiaLandOutline.length; j = i++) {
    const [yi, xi] = indiaLandOutline[i];
    const [yj, xj] = indiaLandOutline[j];
    const intersects = xi > lng !== xj > lng && lat < ((yj - yi) * (lng - xi)) / (xj - xi) + yi;
    if (intersects) inside = !inside;
  }
  return inside;
}

// Safe inland fallback points — well-tested to be inside India
const INDIA_SAFE_FALLBACKS: [number, number][] = [
  [22.00, 78.00], // Madhya Pradesh centre
  [23.00, 80.00], // MP / Chhattisgarh
  [25.00, 82.00], // UP / Bihar
  [20.00, 76.00], // Maharashtra
  [17.00, 79.00], // Telangana
  [14.00, 77.00], // Karnataka
  [27.00, 78.00], // Uttar Pradesh
  [24.00, 74.00], // Rajasthan
  [21.00, 85.00], // Odisha
  [26.00, 88.00], // West Bengal / Bihar
];

function pointAcrossIndia(index: number): { lat: number; lng: number } {
  let candidate = index;
  for (let attempt = 0; attempt < 300; attempt++, candidate++) {
    // Golden-ratio quasi-random low-discrepancy sequence — covers India uniformly
    const u = (candidate * 0.61803398875 + 0.13) % 1;
    const v = (candidate * 0.41421356237 + 0.27) % 1;
    // India's bounding box: lat 8–36, lng 68.5–97
    const lat = 8.0 + v * 28.0;
    const lng = 68.5 + u * 28.5;
    if (isInsideIndia(lat, lng)) return { lat, lng };
  }
  // Guaranteed-inland fallback: cycle through safe interior points
  const fb = INDIA_SAFE_FALLBACKS[index % INDIA_SAFE_FALLBACKS.length];
  return { lat: fb[0], lng: fb[1] };
}

export function generateGraph() {
  const rand = seededRandom(42);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const ambulances: Ambulance[] = [];
  const medicines: MedicineBatch[] = [];
  const requests: PatientRequest[] = [];
  const villages: GraphNode[] = [];
  const hospitals: GraphNode[] = [];
  const pharmacies: GraphNode[] = [];
  const depots: GraphNode[] = [];
  let nodeIdCounter = 0;
  const id = (prefix: string) => `${prefix}-${nodeIdCounter++}`;

  for (let i = 0; i < VILLAGE_COUNT; i++) {
    const point = pointAcrossIndia(i);
    const region = regions.reduce((nearest, candidate) => {
      const nearestDistance = haversineKm(point.lat, point.lng, nearest.lat, nearest.lng);
      const candidateDistance = haversineKm(point.lat, point.lng, candidate.lat, candidate.lng);
      return candidateDistance < nearestDistance ? candidate : nearest;
    }, regions[0]);
    const village: GraphNode = {
      id: id('village'),
      label: `${region.label} Village ${i + 1}`,
      type: 'village',
      lat: point.lat,
      lng: point.lng,
      capacity: Math.floor(rand() * 200) + 50,
      occupied: Math.floor(rand() * 150),
    };
    nodes.push(village);
    villages.push(village);
  }

  const createFacility = (type: GraphNode['type'], count: number, prefix: string, label: string, offset: number) => {
    const result: GraphNode[] = [];
    for (let i = 0; i < count; i++) {
      const point = pointAcrossIndia(i * 17 + offset);
      const region = regions.reduce((nearest, candidate) => {
        const nearestDistance = haversineKm(point.lat, point.lng, nearest.lat, nearest.lng);
        const candidateDistance = haversineKm(point.lat, point.lng, candidate.lat, candidate.lng);
        return candidateDistance < nearestDistance ? candidate : nearest;
      }, regions[0]);
      const facility: GraphNode = {
        id: id(prefix),
        label: `${label} · ${region.label} ${i + 1}`,
        type,
        lat: point.lat,
        lng: point.lng,
      };
      if (type === 'hospital') {
        const specs = ['cardiology', 'neurology', 'orthopedics', 'pediatrics', 'general'];
        facility.capacity = Math.floor(rand() * 120) + 80;
        facility.occupied = Math.floor(rand() * 70);
        facility.specialties = specs.filter(() => rand() > 0.35).slice(0, 4);
        if (!facility.specialties.length) facility.specialties = ['general'];
        facility.medicines = {};
      } else if (type === 'pharmacy') {
        facility.medicines = {};
      } else {
        facility.ambulanceCount = AMBULANCES_PER_DEPOT;
        facility.availableAmbulances = AMBULANCES_PER_DEPOT;
      }
      nodes.push(facility);
      result.push(facility);
    }
    return result;
  };

  hospitals.push(...createFacility('hospital', INDIA_HOSPITAL_COUNT, 'hospital', 'Hospital', 0));
  pharmacies.push(...createFacility('pharmacy', INDIA_PHARMACY_COUNT, 'pharmacy', 'Pharmacy', 3));
  depots.push(...createFacility('ambulance-depot', INDIA_DEPOT_COUNT, 'depot', 'Ambulance Depot', 6));

  for (const depot of depots) {
    for (let j = 0; j < AMBULANCES_PER_DEPOT; j++) {
      ambulances.push({ id: `amb-${depot.id}-${j}`, nodeId: depot.id, status: 'idle' });
    }
  }

  const edgeSet = new Set<string>();
  const addEdge = (source: GraphNode, target: GraphNode) => {
    const key = [source.id, target.id].sort().join('|');
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({ id: `edge-${edges.length}`, source: source.id, target: target.id, weight: Math.max(1, Math.round(haversineKm(source.lat, source.lng, target.lat, target.lng) * 10) / 10), blocked: false });
  };

  const nearest = (source: GraphNode, targets: GraphNode[], count: number) =>
    targets
      .map((target) => ({ target, distance: haversineKm(source.lat, source.lng, target.lat, target.lng) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count)
      .map(({ target }) => target);

  villages.forEach((village) => {
    nearest(village, hospitals, 4).forEach((hospital) => addEdge(village, hospital));
    nearest(village, depots, 3).forEach((depot) => addEdge(village, depot));
    nearest(village, pharmacies, 2).forEach((pharmacy) => addEdge(village, pharmacy));
  });
  hospitals.forEach((hospital) => {
    nearest(hospital, depots, 3).forEach((depot) => addEdge(hospital, depot));
    nearest(hospital, hospitals.filter((candidate) => candidate.id !== hospital.id), 4).forEach((neighbor) => addEdge(hospital, neighbor));
    nearest(hospital, pharmacies, 2).forEach((pharmacy) => addEdge(hospital, pharmacy));
  });
  pharmacies.forEach((pharmacy) => nearest(pharmacy, depots, 2).forEach((depot) => addEdge(pharmacy, depot)));

  const medicineNames = ['Paracetamol', 'Insulin', 'Morphine', 'Amoxicillin', 'Atorvastatin', 'Salbutamol', 'Adenosine', 'Epinephrine'];
  hospitals.forEach((hospital) => {
    medicineNames.forEach((name) => {
      if (rand() < 0.6) {
        const stock = Math.floor(rand() * 100) + 10;
        hospital.medicines![name] = stock;
        medicines.push({ id: `med-${hospital.id}-${name}`, name, hospitalId: hospital.id, stock, threshold: 10 });
      }
    });
  });

  return {
    nodes, edges, ambulances, medicines, requests, villages, hospitals, pharmacies, depots,
    metadata: { baseVillages: BASE_VILLAGES, scaleFactor: SCALE_FACTOR, villageCount: VILLAGE_COUNT, regions: regions.map((r) => r.id) },
  };
}
