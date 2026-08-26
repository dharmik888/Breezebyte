# Rural Health Routing Engine

The **Breezebyte Rural Health Routing Engine** is a high-performance logistics and pathfinding system designed to coordinate rural healthcare emergency response. It dynamically routes emergency requests to appropriate hospitals, dispatches idle ambulances from depots, and automates medicine replenishment—all overlaid on an interactive geographic map.

## Problem Statement

Rural healthcare networks often suffer from fragmented communication and inefficient routing. Emergency patients experience delayed ambulance arrivals, and ambulances are frequently routed to hospitals that lack the required specialist or bed capacity. Furthermore, critical medicines run out without automated resupply logistics.

## Solution

This project solves this by implementing an algorithmic dispatch engine that treats the healthcare network as a graph. It evaluates real-time capacity, specialist availability, ambulance locations, and medicine stock, running pathfinding algorithms to find the truly optimal road network path for both the patient and the required resources.

## Key Features

- **Graph-Based Routing**: Models villages, hospitals, pharmacies, and depots as nodes on a weighted road network.
- **Shortest-Path Search**: Uses A* Search (with Dijkstra fallback) powered by Haversine heuristics for fast routing.
- **Ambulance Allocation**: Automatically locates and dispatches the nearest idle ambulance to the incident.
- **Hospital & Specialist Filtering**: Ensures patients are only routed to hospitals with the required specialty (e.g., Cardiology) and available beds.
- **Medicine Handling**: Simulates medicine consumption upon admission and auto-triggers transfers from nearby pharmacies when stock falls below thresholds.
- **Emergency Dispatch**: Exposes an API to process requests with varying urgency levels.
- **Decision Logging**: Records transparent rationales for every algorithmic choice made during dispatch.
- **Interactive Map**: Renders live telemetry, routes, and facility statuses using Leaflet.

## Algorithmic Approach

The engine generates a scalable graph of the rural network. When a dispatch request is received, it pre-filters valid hospitals, sorts them by straight-line distance to optimize throughput, and runs **A* Search** to find the shortest road path. It concurrently searches for the nearest idle ambulance. 

For an in-depth breakdown of the graph representation, time complexity, and data structures:
**[Read the Detailed Algorithmic Approach](./ALGORITHMIC_APPROACH.md)**

## System Architecture

```text
Frontend (React / Leaflet)
         ↓
API Layer (Next.js App Router)
         ↓
Dispatch Engine (In-Memory / Prisma)
         ↓
Graph & Pathfinding (A* / Dijkstra)
         ↓
Resource Allocation (Beds, Ambulances, Meds)
         ↓
Decision Logging & Updated State
```

## Tech Stack

- **Framework**: Next.js (App Router), React
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Mapping**: Leaflet / `react-leaflet`
- **Charts/Metrics**: Chart.js / `react-chartjs-2`
- **Icons**: Lucide React
- **Database (Secondary Engine)**: Prisma

## Project Structure

- `app/` - Next.js frontend pages and API routes.
- `app/api/` - REST API endpoints handling dispatch, telemetry, and graph data.
- `components/` - Reusable React UI components (Map, Dashboard, Modals).
- `lib/engine/` - Core high-scale in-memory routing and dispatch logic (`dispatch.ts`, `pathfinding.ts`, `graph.ts`).
- `lib/routing.ts` - Secondary Prisma/DB-backed routing implementation.
- `prisma/` - Database schema and seeding scripts.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Breezebyte-main
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:** Navigate to `http://localhost:3000`.

## Environment Variables

The high-scale benchmark engine operates in-memory and can scale using optional environment variables in `.env`:
- `BREEZEBYTE_SCALE_FACTOR`: Multiplier for village generation (default: 1000, generates ~50k nodes).
- `BREEZEBYTE_BASE_VILLAGES`: Base village count.
- `BREEZEBYTE_INDIA_HOSPITALS`: Number of hospitals to generate.

*(No sensitive secrets are required to run the simulation engine).*

## Application Pages

- **`/` (Home)**: Landing page.
- **`/dashboard`**: Core interactive map displaying live telemetry, simulated graph, and active dispatches.
- **`/dispatch-control`**: Manual interface to inject emergency requests.
- **`/medicine-transfer`**: View active and completed medicine transfers between pharmacies and hospitals.
- **`/routing`**: Interface interacting with the secondary DB-backed routing engine.
- **`/process`**: Technical process overview.

## Demo Workflow

For hackathon demonstration:
1. Open the **Dashboard** to view the live graph and telemetry.
2. Navigate to **Dispatch Control** and submit a *Critical Cardiology* request.
3. Observe the system:
   - Filter hospitals.
   - Run pathfinding.
   - Dispatch an ambulance (status turns busy).
   - Draw the computed route on the map.
4. Check the **Decision Log** to see why that hospital and ambulance were chosen.
5. If medicine drops low, observe an auto-generated transfer on the **Medicine Transfer** page.

*(Note: Real-time map animations are mock interpolations based on algorithm ETA).*

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/dispatch` | Injects a new patient request into the high-scale engine. |
| `GET/PATCH` | `/api/dispatch-status` | Polls or updates the status of active requests and transfers. |
| `GET` | `/api/graph` | Retrieves the graph nodes and edges for map rendering. |
| `GET/POST` | `/api/medicine` | Retrieves hospital inventory or manually triggers a transfer. |
| `GET` | `/api/telemetry` | Returns real-time system metrics (fleet utilization, queues). |
| `POST` | `/api/ambulance` | Dispatches via the secondary Prisma/DB routing engine. |
| `POST` | `/api/scenario` | Triggers load-testing simulations. |

## Complexity

- **Pathfinding (A*)**: `O(E log V)`
- **Dispatch Pipeline**: `O((H+D) log (H+D) + E log V)`
Full Big-O analysis is available in the [ALGORITHMIC_APPROACH.md](./ALGORITHMIC_APPROACH.md).

## Edge Cases

- **Handled**: Blocked road traversal, unavailable specialists, full hospital capacity, duplicate requests (idempotency cache), automated low-stock medicine replenishment.
- **Unsupported**: Cross-hospital patient transfers (only village-to-hospital is supported), real-time live traffic delays.

## Current Limitations

- **In-Memory State**: The primary high-scale routing engine stores state in-memory to meet benchmark speed requirements; state resets on server restart.
- **Concurrency**: Node.js single-threading means massive simultaneous dispatch spikes may block the event loop temporarily.
- **Mock Telemetry**: Ambulance map movement is interpolated on the frontend based on the calculated ETA, rather than real GPS tracking.

## Future Improvements

- Migrate the in-memory state to Redis for horizontal scalability and persistence.
- Offload `A*` pathfinding to Node.js Worker Threads.
- Integrate real-world traffic APIs to dynamically adjust edge weights instead of static distance.
