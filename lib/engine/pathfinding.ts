import { GraphNode, GraphEdge } from './types';

export interface PathResult {
  path: string[];
  distance: number;
  durationMinutes: number;
}

class MinHeap<T> {
  private data: { item: T; priority: number }[] = [];

  get size() {
    return this.data.length;
  }

  push(item: T, priority: number) {
    this.data.push({ item, priority });
    this.bubbleUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0].item;
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.data[parent].priority <= this.data[i].priority) break;
      [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
      i = parent;
    }
  }

  private sinkDown(i: number) {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.data[left].priority < this.data[smallest].priority) smallest = left;
      if (right < n && this.data[right].priority < this.data[smallest].priority) smallest = right;
      if (smallest === i) break;
      [this.data[smallest], this.data[i]] = [this.data[i], this.data[smallest]];
      i = smallest;
    }
  }
}

export function dijkstra(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string
): PathResult | null {
  const adj = new Map<string, { nodeId: string; weight: number; edgeId: string }[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (e.blocked) return;
    adj.get(e.source)!.push({ nodeId: e.target, weight: e.weight, edgeId: e.id });
    adj.get(e.target)!.push({ nodeId: e.source, weight: e.weight, edgeId: e.id });
  });

  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();
  const heap = new MinHeap<string>();

  dist.set(startId, 0);
  heap.push(startId, 0);

  while (heap.size > 0) {
    const u = heap.pop()!;
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === endId) break;

    const neighbors = adj.get(u) || [];
    for (const { nodeId: v, weight } of neighbors) {
      if (visited.has(v)) continue;
      const alt = (dist.get(u) ?? Infinity) + weight;
      if (alt < (dist.get(v) ?? Infinity)) {
        dist.set(v, alt);
        prev.set(v, u);
        heap.push(v, alt);
      }
    }
  }

  if (!dist.has(endId)) return null;

  const path: string[] = [];
  let cur: string | null = endId;
  while (cur) {
    path.unshift(cur);
    cur = prev.get(cur) || null;
  }

  const distance = dist.get(endId)!;
  const avgSpeedKmh = 40;
  const durationMinutes = Math.round((distance / avgSpeedKmh) * 60);

  return { path, distance, durationMinutes };
}

export function aStar(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string
): PathResult | null {
  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const adj = new Map<string, { nodeId: string; weight: number }[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (e.blocked) return;
    adj.get(e.source)!.push({ nodeId: e.target, weight: e.weight });
    adj.get(e.target)!.push({ nodeId: e.source, weight: e.weight });
  });

  const heuristic = (a: string, b: string) => {
    const na = nodeMap.get(a)!;
    const nb = nodeMap.get(b)!;
    const R = 6371;
    const dLat = ((nb.lat - na.lat) * Math.PI) / 180;
    const dLng = ((nb.lng - na.lng) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((na.lat * Math.PI) / 180) *
        Math.cos((nb.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const straightLine = R * 2 * Math.asin(Math.sqrt(x));
    return straightLine * 1.41;
  };

  const open = new MinHeap<string>();
  const gScore = new Map<string, number>();
  const cameFrom = new Map<string, string | null>();
  const visited = new Set<string>();

  gScore.set(startId, 0);
  open.push(startId, 0 + heuristic(startId, endId));

  while (open.size > 0) {
    const current = open.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    if (current === endId) break;

    const neighbors = adj.get(current) || [];
    for (const { nodeId: neighbor, weight } of neighbors) {
      if (visited.has(neighbor)) continue;
      const tentative = (gScore.get(current) ?? Infinity) + weight;
      if (tentative < (gScore.get(neighbor) ?? Infinity)) {
        gScore.set(neighbor, tentative);
        cameFrom.set(neighbor, current);
        const f = tentative + heuristic(neighbor, endId);
        open.push(neighbor, f);
      }
    }
  }

  if (!gScore.has(endId)) return null;

  const path: string[] = [];
  let cur: string | null = endId;
  while (cur) {
    path.unshift(cur);
    cur = cameFrom.get(cur) || null;
  }

  const distance = gScore.get(endId)!;
  const durationMinutes = Math.round((distance / 40) * 60);
  return { path, distance, durationMinutes };
}
