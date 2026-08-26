# Algorithmic Approach: Rural Health Routing Engine

This document details the actual technical and algorithmic implementation of the Breezebyte Rural Health Routing Engine based strictly on the source code.

## 1. Problem Definition

The system coordinates rural healthcare emergency response. The core problem involves:
- **Emergency Requests**: Patients in villages requiring urgent medical attention for specific specialties (e.g., cardiology).
- **Resource Constraints**: 
  - Hospitals have limited bed capacity and specific specialties.
  - Ambulances are stationed at depots and have idle/busy states.
  - Hospitals require specific medicines to treat patients, which deplete upon admission.
- **Dynamic Routing**: Finding the shortest viable road network path from an ambulance depot to a village, and from the village to a capable hospital.
- **Implemented Scope**: The system accurately models patient request intake, haversine-optimized shortest-path routing, capacity-aware hospital selection, idle ambulance assignment, and automated medicine replenishment via connected pharmacies.

*Note: While the hackathon problem statement mentions minimizing "Wait Time + Travel Time" as a mathematical function, the current implementation strictly minimizes **distance/travel time** via shortest-path algorithms, assuming wait time is a derivative of ambulance arrival time.*

## 2. System Architecture

The implemented architecture is a monolith Next.js application leveraging an in-memory high-performance routing engine for benchmark-scale graph simulations.

```text
Frontend (React / Leaflet)
         ↓ HTTP POST /api/dispatch
API Layer (app/api/dispatch/route.ts)
         ↓ injectRequest()
Dispatch Engine (lib/engine/dispatch.ts)
         ↓ aStar() / dijkstra()
Graph & Pathfinding (lib/engine/pathfinding.ts, lib/engine/graph.ts)
         ↓
Resource Allocation (Ambulance, Hospital, Medicine)
         ↓
State Updates (In-Memory Engine State)
         ↓
Response returned to Frontend
```

*(A secondary Prisma/DB-backed engine exists in `lib/routing.ts` and `/api/ambulance`, but the primary high-scale simulation engine used in the dashboard resides in `lib/engine/*`).*

## 3. Data Model

The core data structures (defined in `lib/engine/types.ts`) are:

- **`GraphNode`**: Represents villages, hospitals, pharmacies, and ambulance-depots. Fields include `id`, `lat`, `lng`, `capacity`, `occupied`, `specialties`, and `medicines`.
- **`GraphEdge`**: Represents bidirectional roads. Fields include `weight` (distance) and `blocked` (boolean for road closures).
- **`Ambulance`**: Tracks fleet units. Fields include `nodeId` (depot location), `status` (idle/busy), and `patientId`.
- **`PatientRequest`**: Tracks dispatch lifecycle. Fields include `urgency`, `specialty`, `status`, and `assignedHospitalId`.
- **`MedicineTransfer`**: Tracks automated stock replenishment. Fields include `medicine`, `quantity`, `fromId` (pharmacy), and `toId` (hospital).
- **`DecisionLogEntry`**: Records the justification, cost, and routing metrics for every dispatch.

## 4. Graph Representation

- **Generation**: Created dynamically in `lib/engine/graph.ts`.
- **Nodes**: Spatially distributed across predefined coordinates spanning India. Scalable to 50,000+ nodes using a scaling factor.
- **Edges**: Bidirectional adjacency lists created based on proximity.
- **Weights**: Edge weights strictly represent travel distance in kilometers, calculated using the Haversine formula multiplied by a circuitry factor (1.41) to approximate road networks.
- **Road Closures**: Edges possess a `blocked` boolean. Pathfinding algorithms explicitly skip blocked edges.

## 5. Pathfinding Algorithm

The dispatch engine implements two shortest-path algorithms in `lib/engine/pathfinding.ts`:

1. **A* Search Algorithm (`aStar`)** (Primary)
2. **Dijkstra's Algorithm (`dijkstra`)** (Fallback)

**Implementation Details**:
- **Data Structure**: Both algorithms utilize a custom `MinHeap` class for the priority queue to ensure efficient node exploration.
- **A* Heuristic**: Uses Haversine straight-line distance to the destination, multiplied by the circuitry factor (1.41) to ensure admissibility and avoid overestimating road distance.
- **Output**: Returns the array of node IDs (`path`), total `distance`, and `durationMinutes` (assuming 40 km/h average speed).
- **Complexity**: 
  - Time Complexity: `O(E log V)`
  - Space Complexity: `O(V)` for distance and visited maps.

## 6. Ambulance Allocation

Ambulance selection operates to minimize pathfinding overhead on large graphs:
1. All depots are sorted by Haversine straight-line distance to the incident village.
2. The engine iterates through the closest depots first, checking for ambulances with `status === 'idle'`.
3. Pathfinding (A*) is executed from the closest valid depot to the village.
4. If no idle ambulance is found, it throws an error.

## 7. Hospital and Specialist Selection

Hospital selection heavily optimizes candidate evaluation to achieve high throughput:
1. **Filtering**: Excludes hospitals that do not have the required specialty or lack available beds (`occupied < capacity`).
2. **Pre-sorting**: Remaining candidates are sorted by Haversine distance to the village. Only the **top 12** closest hospitals are evaluated further.
3. **Routing**: A* pathfinding is executed for the top 12 candidates. The hospital yielding the lowest true route distance is selected.
4. **Fallback**: If no hospital has the required specialty and beds, the engine will fallback to *any* hospital with an available bed.

## 8. Medicine Allocation

The system accurately simulates medicine depletion and auto-replenishment:
- **Consumption**: Upon hospital assignment, required medicines are deducted from the hospital's `medicines` inventory (e.g., Cardiology consumes Adenosine, Epinephrine, Morphine).
- **Auto-Replenishment**: If a hospital's stock for a consumed medicine drops below the threshold of 20, `triggerMedicineReplenishment()` is invoked.
- **Transfers**: The engine finds the closest `pharmacy` (using Haversine sorting), calculates a route, and generates a `MedicineTransfer` for 50 units.
- **Resolution**: Transfers enter an `in-transit` state and are credited back to the hospital upon duration completion via polling (`app/api/dispatch-status`).

## 9. Dispatch Decision Pipeline

The actual source-code order of operations (`injectRequest`):
1. **Idempotency Check**: Return cached response if `requestId` was recently processed.
2. **Hospital Filtering & Sorting**: Filter by specialty/capacity, sort by Haversine, take top 12.
3. **Find Hospital Route**: Run A* to find the closest reachable hospital.
4. **Depot Sorting**: Sort depots by Haversine distance.
5. **Find Ambulance**: Locate nearest idle ambulance and run A* for ambulance-to-village route.
6. **State Updates**: Set ambulance to busy, increment hospital occupancy.
7. **Medicine Check**: Deduct required meds, trigger pharmacy replenishment if low.
8. **Logging**: Create `PatientRequest` and `DecisionLogEntry`.

## 10. Optimization / Cost Model

- **Implemented Optimization**: The system directly optimizes for **Minimum Route Distance** (which correlates to minimum travel time).
- **Cost Logging**: While routing is distance-based, the `DecisionLogEntry` calculates an arbitrary financial cost range based on total distance and time (e.g., `minCost = 500 + dist*15 + time*2`), and a priority weight modifier for transparency logging.

## 11. Priority and Urgency

Urgency (critical, urgent, moderate, low) is passed in the request. In the implemented high-scale in-memory engine, requests are processed synchronously via HTTP POST. Urgency acts primarily as metadata for the frontend and alters the cost logging weights, but does not currently pause or preempt lower-priority inflight requests.

## 12. Dynamic State Updates

After dispatch, the in-memory engine mutates:
- `requests`: New dispatch appended.
- `ambulances`: Status set to `busy`, assigned patient ID.
- `hospitals`: `occupied` counter incremented, `medicines` map decremented.
- `medicineTransfers`: New in-transit jobs created if stock is low.

## 13. Edge Cases and Resilience

| Scenario | Handled In Code? | Response/Fallback |
| :--- | :--- | :--- |
| **Blocked roads** | Yes | `aStar` / `dijkstra` skips edges where `blocked: true`. |
| **Hospital Full** | Yes | Hospital excluded during initial filtering. |
| **No Specialist** | Yes | Falls back to any hospital with capacity (`fallback: true`). |
| **No Route** | Yes | Throws Error: "No route to any suitable hospital". |
| **No Ambulance** | Yes | Throws Error: "No ambulance available". |
| **Medicine Unavailable** | Yes | Populates `missingMeds` in response, triggers transfer, does not block admission. |
| **Duplicate Request** | Yes | Idempotency cache (`idempotentResponses`) prevents duplicate processing. |

## 14. Complexity Analysis

| Component | Algorithm | Time Complexity | Space Complexity |
|---|---|---|---|
| **Pathfinding** | A* (MinHeap) / Dijkstra | `O(E log V)` | `O(V)` |
| **Hospital Selection** | Haversine Sort + A* | `O(H log H + 12 * E log V)` | `O(V)` |
| **Ambulance Allocation** | Haversine Sort + A* | `O(D log D + E log V)` | `O(V)` |
| **Medicine Replenishment** | Haversine Sort + A* | `O(P log P + E log V)` | `O(V)` |
| **Overall Dispatch** | Sequential Pipeline | `O((H+D) log (H+D) + E log V)` | `O(V)` |

*(Where H = Hospitals, D = Depots, P = Pharmacies)*

## 15. Scalability

Compared against the hackathon benchmark requirements:
- **50,000+ graph nodes**: **Supported**. `generateGraph()` scales based on `BREEZEBYTE_SCALE_FACTOR`.
- **200,000+ road edges**: **Supported**.
- **5,000+ villages/health points**: **Supported**.
- **Thousands of concurrent requests**: **Partially supported**. The in-memory state and idempotency cache allow fast processing, but Node.js single-threading means extreme spikes may cause event-loop blocking.

## 16. Correctness and Feasibility

Feasibility is strictly enforced:
- An ambulance is *only* assigned if `status === 'idle'`.
- A hospital is *only* considered if `occupied < capacity`.
- A route is verified as physically traversable (accounting for `blocked` edges) before assignment.

## 17. Decision Transparency

Every successful dispatch generates a `DecisionLogEntry`. This log contains the exact rationale (e.g., *"Routed to Hospital X (specialty: cardiology, occupancy: 45/100). Ambulance Y dispatched from Depot Z. Distance: 12.5km"*), ensuring full explainability of the AI/algorithmic choices.

## 18. Example Walkthrough

1. **Request**: `villageId: v-10`, `urgency: critical`, `specialty: cardiology`.
2. **Hospital Filtering**: Finds 50 cardiology hospitals. Excludes 10 full hospitals.
3. **Pre-sort**: Sorts remaining 40 by Haversine distance; takes top 12.
4. **Pathfinding**: Runs A* on the 12. Hospital `h-7` is genuinely closest by road (14km).
5. **Ambulance**: Sorts depots by Haversine. Depot `d-3` is closest and has an idle ambulance `amb-d-3-0`. Runs A* from `d-3` to `v-10`.
6. **State**: Hospital `h-7` occupancy increments. `amb-d-3-0` marked busy. Adenosine/Epinephrine/Morphine decremented at `h-7`.
7. **Return**: Route coordinates, ETA, and decision log sent to frontend map.

## 19. Core Algorithm Pseudocode

```python
def process_dispatch(request):
    # 1. Filter and Pre-Sort Hospitals
    valid_hospitals = [h for h in hospitals if has_specialty(h, request.specialty) and h.occupied < h.capacity]
    candidates = sort_by_haversine_distance(request.village, valid_hospitals)[:12]
    
    # 2. Find Shortest Path to Hospital
    best_hospital, best_route = null, null
    for h in candidates:
        route = aStar(request.village, h)
        if route and route.distance < best_route.distance:
            best_route = route
            best_hospital = h
            
    # 3. Find Closest Ambulance
    depots = sort_by_haversine_distance(request.village, all_depots)
    ambulance, amb_route = null, null
    for d in depots:
        idle_ambs = get_idle_ambulances(d)
        if idle_ambs:
            ambulance = idle_ambs[0]
            amb_route = aStar(d, request.village)
            break
            
    # 4. State Updates
    ambulance.status = 'busy'
    best_hospital.occupied += 1
    consume_medicines(best_hospital, request.specialty)
    
    # 5. Replenishment Check
    if best_hospital.medicine_stock < 20:
        nearest_pharmacy = sort_by_haversine_distance(best_hospital, pharmacies)[0]
        trigger_transfer(nearest_pharmacy, best_hospital)
        
    return build_response(best_hospital, ambulance, best_route, amb_route)
```

## 20. Limitations

- **In-Memory State**: The primary high-scale engine uses in-memory data structures. State resets upon server restart.
- **Frontend Mocks**: Real-time vehicle location tracking relies on frontend interpolation based on ETA, rather than active IoT GPS telemetry.

## 21. Future Improvements

- **Database Persistence**: Migrate the in-memory high-scale engine state to Redis or PostgreSQL to allow multi-instance horizontal scaling.
- **Web Workers**: Offload A* pathfinding to Node.js Worker Threads to prevent event-loop blocking under high concurrent load.
- **Traffic APIs**: Integrate live traffic data (e.g., Google Maps API) to dynamically adjust edge weights.

## 22. Summary

The Breezebyte Rural Health Routing Engine implements a highly optimized, scalable graph-routing pipeline. By combining Haversine pre-filtering with A* pathfinding, the engine can navigate graphs of 50,000+ nodes in milliseconds. It enforces strict capacity, specialty, and availability constraints, dynamically manages medicine supply chains, and provides transparent, logged decision-making suitable for the complex logistics of rural healthcare dispatch.
