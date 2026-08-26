import { prisma } from './db';

export interface Node {
  id: string;
  label: string;
  type: string;
  lat: number;
  lng: number;
  capacity?: number | null;
  occupied?: number | null;
  specialties?: string | null;
  medicines?: string | null;
  ambulanceCount?: number | null;
  availableAmbulances?: number | null;
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  weight: number;
  blocked: boolean;
}

export interface RouteResult {
  path: string[];
  totalDistance: number;
  estimatedMinutes: number;
  nodes: Node[];
}

export interface Graph {
  [nodeId: string]: {
    [neighborId: string]: number;
  };
}

/**
 * Build a graph from edges for routing algorithms
 */
export function buildGraph(edges: Edge[]): Graph {
  const graph: Graph = {};

  edges.forEach((edge) => {
    if (edge.blocked) return;

    if (!graph[edge.sourceId]) {
      graph[edge.sourceId] = {};
    }
    if (!graph[edge.targetId]) {
      graph[edge.targetId] = {};
    }

    // Bidirectional edges
    graph[edge.sourceId][edge.targetId] = edge.weight;
    graph[edge.targetId][edge.sourceId] = edge.weight;
  });

  return graph;
}

/**
 * Dijkstra's algorithm for shortest path
 */
export function dijkstra(
  graph: Graph,
  startId: string,
  endId: string
): { path: string[]; distance: number } | null {
  const distances: { [nodeId: string]: number } = {};
  const previous: { [nodeId: string]: string | null } = {};
  const unvisited = new Set<string>();

  // Initialize
  for (const nodeId in graph) {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
    unvisited.add(nodeId);
  }
  distances[startId] = 0;

  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let currentNode: string | null = null;
    let minDistance = Infinity;
    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        currentNode = nodeId;
      }
    }

    if (currentNode === null || distances[currentNode] === Infinity) {
      break; // No path exists
    }

    if (currentNode === endId) {
      break; // Found shortest path to destination
    }

    unvisited.delete(currentNode);

    // Update distances to neighbors
    const neighbors = graph[currentNode] || {};
    for (const neighborId in neighbors) {
      if (!unvisited.has(neighborId)) continue;

      const distance = distances[currentNode] + neighbors[neighborId];
      if (distance < distances[neighborId]) {
        distances[neighborId] = distance;
        previous[neighborId] = currentNode;
      }
    }
  }

  // Reconstruct path
  if (distances[endId] === Infinity) {
    return null; // No path found
  }

  const path: string[] = [];
  let current: string | null = endId;
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  return {
    path,
    distance: distances[endId],
  };
}

/**
 * Find the shortest route between two nodes
 */
export async function findShortestRoute(
  startNodeId: string,
  endNodeId: string
): Promise<RouteResult | null> {
  const edges = await prisma.edge.findMany();
  const graph = buildGraph(edges);

  const result = dijkstra(graph, startNodeId, endNodeId);
  if (!result) return null;

  // Fetch node details
  const nodes = await prisma.node.findMany({
    where: { id: { in: result.path } },
  });

  // Sort nodes by path order
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const orderedNodes = result.path.map((id) => nodeMap.get(id)!);

  // Calculate estimated time (assuming 40 km/h average speed)
  const estimatedMinutes = Math.ceil((result.distance / 40) * 60);

  return {
    path: result.path,
    totalDistance: result.distance,
    estimatedMinutes,
    nodes: orderedNodes,
  };
}

/**
 * Find nearest available ambulance to a location
 */
export async function findNearestAmbulance(
  villageId: string
): Promise<{ ambulance: any; route: RouteResult } | null> {
  // Get all idle ambulances
  const ambulances = await prisma.ambulance.findMany({
    where: { status: 'idle' },
    include: { node: true },
  });

  if (ambulances.length === 0) return null;

  const edges = await prisma.edge.findMany();
  const graph = buildGraph(edges);

  let nearestAmbulance = null;
  let shortestRoute = null;
  let shortestDistance = Infinity;

  // Find closest ambulance
  for (const ambulance of ambulances) {
    const result = dijkstra(graph, ambulance.nodeId, villageId);
    if (result && result.distance < shortestDistance) {
      shortestDistance = result.distance;
      nearestAmbulance = ambulance;
      shortestRoute = result;
    }
  }

  if (!nearestAmbulance || !shortestRoute) return null;

  // Get node details for the route
  const nodes = await prisma.node.findMany({
    where: { id: { in: shortestRoute.path } },
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const orderedNodes = shortestRoute.path.map((id) => nodeMap.get(id)!);

  return {
    ambulance: nearestAmbulance,
    route: {
      path: shortestRoute.path,
      totalDistance: shortestRoute.distance,
      estimatedMinutes: Math.ceil((shortestRoute.distance / 40) * 60),
      nodes: orderedNodes,
    },
  };
}

/**
 * Find optimal hospital for a patient based on specialty, capacity, and distance
 */
export async function findOptimalHospital(
  villageId: string,
  requiredSpecialty: string,
  urgency: 'low' | 'medium' | 'high'
): Promise<{ hospital: Node; route: RouteResult; score: number } | null> {
  // Get all hospitals
  const hospitals = await prisma.node.findMany({
    where: { type: 'hospital' },
  });

  if (hospitals.length === 0) return null;

  const edges = await prisma.edge.findMany();
  const graph = buildGraph(edges);

  let bestHospital = null;
  let bestRoute = null;
  let bestScore = -Infinity;

  // Urgency weights for distance
  const urgencyWeights = {
    high: 3.0, // Distance matters most
    medium: 1.5,
    low: 1.0,
  };

  for (const hospital of hospitals) {
    const result = dijkstra(graph, villageId, hospital.id);
    if (!result) continue;

    // Parse specialties
    const specialties = hospital.specialties
      ? JSON.parse(hospital.specialties)
      : [];
    const hasSpecialty = specialties.includes(requiredSpecialty);

    // Calculate capacity score
    const capacity = hospital.capacity || 0;
    const occupied = hospital.occupied || 0;
    const available = capacity - occupied;
    const capacityScore = available > 0 ? available / capacity : 0;

    // Calculate distance score (inverse - closer is better)
    const distanceScore = 1 / (1 + result.distance);

    // Composite score
    let score =
      (hasSpecialty ? 50 : 0) +
      capacityScore * 30 +
      distanceScore * urgencyWeights[urgency] * 20;

    if (score > bestScore) {
      bestScore = score;
      bestHospital = hospital;
      bestRoute = result;
    }
  }

  if (!bestHospital || !bestRoute) return null;

  // Get node details for the route
  const nodes = await prisma.node.findMany({
    where: { id: { in: bestRoute.path } },
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const orderedNodes = bestRoute.path.map((id) => nodeMap.get(id)!);

  return {
    hospital: bestHospital,
    route: {
      path: bestRoute.path,
      totalDistance: bestRoute.distance,
      estimatedMinutes: Math.ceil((bestRoute.distance / 40) * 60),
      nodes: orderedNodes,
    },
    score: bestScore,
  };
}

/**
 * Find optimal pharmacy to transfer medicine from
 */
export async function findOptimalMedicineSource(
  hospitalId: string,
  medicineName: string,
  requiredQuantity: number
): Promise<{ pharmacy: Node; route: RouteResult; availableStock: number } | null> {
  // Get all pharmacies
  const pharmacies = await prisma.node.findMany({
    where: { type: 'pharmacy' },
  });

  if (pharmacies.length === 0) return null;

  const edges = await prisma.edge.findMany();
  const graph = buildGraph(edges);

  let bestPharmacy = null;
  let bestRoute = null;
  let bestScore = -Infinity;
  let availableStock = 0;

  for (const pharmacy of pharmacies) {
    const result = dijkstra(graph, hospitalId, pharmacy.id);
    if (!result) continue;

    // Parse medicines
    const medicines = pharmacy.medicines ? JSON.parse(pharmacy.medicines) : {};
    const stock = medicines[medicineName.toLowerCase()] || 0;

    if (stock < requiredQuantity) continue; // Not enough stock

    // Calculate score (prefer closer pharmacies with more stock)
    const distanceScore = 1 / (1 + result.distance);
    const stockScore = Math.min(stock / requiredQuantity, 2); // Cap at 2x required
    const score = distanceScore * 60 + stockScore * 40;

    if (score > bestScore) {
      bestScore = score;
      bestPharmacy = pharmacy;
      bestRoute = result;
      availableStock = stock;
    }
  }

  if (!bestPharmacy || !bestRoute) return null;

  // Get node details for the route
  const nodes = await prisma.node.findMany({
    where: { id: { in: bestRoute.path } },
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const orderedNodes = bestRoute.path.map((id) => nodeMap.get(id)!);

  return {
    pharmacy: bestPharmacy,
    route: {
      path: bestRoute.path,
      totalDistance: bestRoute.distance,
      estimatedMinutes: Math.ceil((bestRoute.distance / 40) * 60),
      nodes: orderedNodes,
    },
    availableStock,
  };
}
