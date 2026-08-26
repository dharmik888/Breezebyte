-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "capacity" INTEGER,
    "occupied" INTEGER,
    "specialties" TEXT,
    "medicines" TEXT,
    "ambulanceCount" INTEGER,
    "availableAmbulances" INTEGER
);

-- CreateTable
CREATE TABLE "Edge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Edge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Node" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Edge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Node" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ambulance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "patientId" TEXT,
    "etaMinutes" INTEGER,
    CONSTRAINT "Ambulance_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "villageId" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "createdAt" REAL NOT NULL,
    "assignedHospitalId" TEXT,
    "assignedAmbulanceId" TEXT,
    "status" TEXT NOT NULL,
    "route" TEXT,
    "ambulanceRoute" TEXT,
    "estimatedArrival" REAL,
    "waitTimeMinutes" INTEGER
);

-- CreateTable
CREATE TABLE "MedicineBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "threshold" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "DecisionLogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" REAL NOT NULL,
    "requestId" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "cost" REAL NOT NULL,
    "costRange" TEXT NOT NULL,
    "durationMinutes" REAL NOT NULL,
    "path" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "ambulanceId" TEXT,
    "medicinePrepared" TEXT
);
