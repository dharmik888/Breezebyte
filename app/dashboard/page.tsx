/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState, useCallback } from 'react';
import nextDynamic from 'next/dynamic';
import TelemetryPanel from '@/components/TelemetryPanel';
import DecisionLog from '@/components/DecisionLog';
import ScenarioControls from '@/components/ScenarioControls';
import { GraphNode, GraphEdge, Ambulance, PatientRequest, DecisionLogEntry, Telemetry } from '@/lib/engine/types';
import { Activity, Radio, Wifi, Shield } from 'lucide-react';

const MapView = nextDynamic(() => import('@/components/MapView'), { ssr: false });

export const dynamic = 'force-dynamic';

export default function Home() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [requests, setRequests] = useState<PatientRequest[]>([]);
  const [logs, setLogs] = useState<DecisionLogEntry[]>([]);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState<{ nodeIds: string[] } | null>(null);
  const [graphLoaded, setGraphLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchGraph = useCallback(async () => {
    const res = await fetch('/api/graph');
    const data = await res.json();
    setNodes(data.nodes);
    setEdges(data.edges);
    setAmbulances(data.ambulances);
    setRequests(data.requests);
    setLogs(data.decisionLog);
    setGraphLoaded(true);
  }, []);

  const fetchTelemetry = useCallback(async () => {
    const res = await fetch('/api/telemetry');
    const data = await res.json();
    setTelemetry(data);
    setPulse(p => !p);
  }, []);

  useEffect(() => {
    fetchGraph();
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2000);
    return () => clearInterval(interval);
  }, [fetchGraph, fetchTelemetry]);

  const handleDispatch = async (req: { requestId: string; villageId: string; urgency: string; specialty: string }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveRoute({ nodeIds: data.route.nodeIds });
        fetchGraph();
        fetchTelemetry();
        if (data.missingMeds && data.missingMeds.length > 0) {
          alert(`Warning: The assigned hospital is OUT OF STOCK for: ${data.missingMeds.join(', ')}.\n\nAn emergency medicine transfer from the nearest pharmacy has been automatically triggered.`);
        }
      } else {
        alert(data.error || 'Dispatch failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScenario = async (name: string) => {
    setLoading(true);
    try {
      if (name === 'demo-cardiology') {
        const villages = nodes.filter((n) => n.type === 'village');
        const target = villages[Math.floor(Math.random() * villages.length)] || villages[0];
        await handleDispatch({
          requestId: `scenario-${Date.now()}`,
          villageId: target.id,
          urgency: 'critical',
          specialty: 'cardiology',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await fetch('/api/reset', { method: 'POST' });
      setActiveRoute(null);
      fetchGraph();
      fetchTelemetry();
    } finally {
      setLoading(false);
    }
  };

  const villages = nodes.filter((n) => n.type === 'village');
  const idleAmbulances = ambulances.filter(a => a.status === 'idle').length;
  const busyAmbulances = ambulances.filter(a => a.status === 'busy').length;
  const activeRequestCount = requests.filter(r => r.status === 'dispatched').length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: '60px',
          background: 'rgba(255,255,255,0.7)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          flexShrink: 0,
          position: 'relative',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #38bdf8, #a78bfa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(56,189,248,0.4)',
            }}
          >
            <Shield size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Rural Health Routing Engine
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
              Intelligent dispatch · scheduling · medicine logistics
            </p>
          </div>
        </div>

        {/* Center stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="stat-badge"
            style={{
              background: 'rgba(16,185,129,0.1)',
              color: 'var(--accent-green)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            <span className="status-dot idle active" />
            {nodes.length} Nodes
          </span>
          <span
            className="stat-badge"
            style={{
              background: 'rgba(14,165,233,0.1)',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(14,165,233,0.25)',
            }}
          >
            <Activity size={10} />
            {requests.length} Requests
          </span>
          <span
            className="stat-badge"
            style={{
              background: activeRequestCount > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(71,85,105,0.1)',
              color: activeRequestCount > 0 ? 'var(--accent-red)' : 'var(--text-secondary)',
              border: `1px solid ${activeRequestCount > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(0,0,0,0.08)'}`,
            }}
          >
            <Radio size={10} />
            {activeRequestCount} Active
          </span>
          <span
            className="stat-badge"
            style={{
              background: 'rgba(139,92,246,0.1)',
              color: 'var(--accent-purple)',
              border: '1px solid rgba(139,92,246,0.25)',
            }}
          >
            <Wifi size={10} />
            {idleAmbulances} idle / {busyAmbulances} busy
          </span>
        </div>

        {/* Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              color: '#38bdf8',
              letterSpacing: '2px',
              fontWeight: 500,
            }}
          >
            {currentTime}
          </div>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 8px #34d399',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }}
          />
        </div>

        {/* Bottom gradient line */}
        <div
          className="header-gradient"
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        />
      </header>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '300px 1fr 300px',
          gap: '16px',
          padding: '16px',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* Left panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden', minHeight: 0 }}>
          <ScenarioControls
            villages={villages}
            onDispatch={handleDispatch}
            onReset={handleReset}
            onScenario={handleScenario}
            loading={loading}
          />
          {telemetry && (
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              <TelemetryPanel data={telemetry} />
            </div>
          )}
        </div>

        {/* Map panel */}
        <div style={{ minHeight: 0, overflow: 'hidden', borderRadius: '16px' }}>
          {graphLoaded ? (
            <MapView
              nodes={nodes}
              ambulances={ambulances}
              requests={requests}
              activeRoute={activeRoute}
            />
          ) : (
            <div
              className="glass-card"
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: '2px solid rgba(56,189,248,0.3)',
                  borderTopColor: '#38bdf8',
                  animation: 'spin-slow 1s linear infinite',
                }}
              />
              <p style={{ color: '#475569', fontSize: '13px' }}>Loading graph data...</p>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ minHeight: 0, overflow: 'hidden' }}>
          <DecisionLog logs={logs} />
        </div>
      </main>
    </div>
  );
}
