'use client';

import React, { useEffect, useState } from 'react';
import {
  Pill,
  Play,
  Zap,
  RotateCcw,
  AlertTriangle,
  Building2,
  FlaskConical,
  Package,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Navigation,
} from 'lucide-react';
import Link from 'next/link';
import { GraphNode } from '@/lib/engine/types';

const MEDICINE_LIST = [
  { value: 'Paracetamol', label: '💊 Paracetamol' },
  { value: 'Insulin', label: '💉 Insulin' },
  { value: 'Morphine', label: '🩺 Morphine' },
  { value: 'Amoxicillin', label: '🧬 Amoxicillin' },
  { value: 'Atorvastatin', label: '❤️ Atorvastatin' },
  { value: 'Salbutamol', label: '🫁 Salbutamol' },
  { value: 'Adenosine', label: '⚡ Adenosine' },
  { value: 'Epinephrine', label: '🔴 Epinephrine' },
];

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
  high:     { label: 'High',     color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)'  },
  normal:   { label: 'Normal',   color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)' },
  low:      { label: 'Low',      color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)'  },
};

interface Transfer {
  id: string;
  medicine: { medicine: string; quantity: number; source: string };
  from: { id: string; name: string; type: string };
  to: { id: string; name: string; type: string };
  status: 'in-transit' | 'completed';
  timing: { elapsedMinutes: number; remainingMinutes: number; totalMinutes: number; progress: number };
  priority: string;
  rationale: string;
  distance: number;
}

function SelectField({ label, icon: Icon, value, onChange, children }: {
  label: string; icon: React.ElementType; value: string;
  onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        <Icon size={11} />
        {label}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', padding: '9px 32px 9px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', transition: 'border-color 0.2s' }}
        onFocus={(e) => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
        onBlur={(e) => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
      >
        {children}
      </select>
    </div>
  );
}

function TransferCard({ t, onReceive }: { t: Transfer; onReceive: (id: string) => void }) {
  const isActive = t.status === 'in-transit';
  const pct = Math.round(Math.min(100, t.timing.progress * 100));
  const pc = PRIORITY_CONFIG[t.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.normal;

  return (
    <div className="glass-card animate-slide-in" style={{ padding: '16px 18px', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: pc.bg, border: `1px solid ${pc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Pill size={16} color={pc.color} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t.medicine.quantity}× {t.medicine.medicine}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              <span>{t.from.name}</span><ArrowRight size={10} /><span>{t.to.name}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{ padding: '3px 9px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: isActive ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: isActive ? '#f59e0b' : '#10b981' }}>
            {isActive ? 'IN TRANSIT' : 'DELIVERED'}
          </span>
          <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
            {pc.label}
          </span>
        </div>
      </div>

      {/* Progress bar for in-transit */}
      {isActive && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Navigation size={9} /> {t.timing.elapsedMinutes}m elapsed</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={9} /> {t.timing.remainingMinutes}m left · {pct}%</span>
          </div>
          <div style={{ height: '5px', borderRadius: '99px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: 'linear-gradient(90deg, #f59e0b, #10b981)', transition: 'width 1.5s ease' }} />
          </div>
        </div>
      )}

      {isActive && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span>{t.distance.toFixed(1)} km route</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{t.timing.totalMinutes} min total</span>
            <button
              onClick={() => onReceive(t.id)}
              style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16,185,129,0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(16,185,129,0.15)')}
            >
              Receive
            </button>
          </div>
        </div>
      )}

      {!isActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#10b981' }}>
          <CheckCircle2 size={12} /> Delivered · {t.distance.toFixed(1)} km
        </div>
      )}
    </div>
  );
}

export default function MedicineTransferPage() {
  const [medicine, setMedicine] = useState('Paracetamol');
  const [quantity, setQuantity] = useState('50');
  const [priority, setPriority] = useState<keyof typeof PRIORITY_CONFIG>('normal');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [pharmacies, setPharmacies] = useState<GraphNode[]>([]);
  const [hospitals, setHospitals] = useState<GraphNode[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [dispatching, setDispatching] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load graph to get pharmacies and hospitals
  useEffect(() => {
    fetch('/api/graph').then((r) => r.json()).then((data) => {
      const ph = (data.nodes as GraphNode[]).filter((n) => n.type === 'pharmacy');
      const ho = (data.nodes as GraphNode[]).filter((n) => n.type === 'hospital');
      setPharmacies(ph);
      setHospitals(ho);
      if (ph.length > 0) setFromId(ph[0].id);
      if (ho.length > 0) setToId(ho[0].id);
    });
  }, []);

  // Poll transfers
  const fetchTransfers = async () => {
    try {
      const res = await fetch('/api/dispatch-status?type=medicine&status=all');
      const data = await res.json();
      setTransfers(data.medicineTransfers || []);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchTransfers();
    const i = setInterval(fetchTransfers, 3000);
    return () => clearInterval(i);
  }, []);

  const handleDispatch = async () => {
    if (!fromId || !toId) return;
    setDispatching(true);
    setResult(null);
    try {
      // Manually create a medicine transfer by posting to medicine API
      const res = await fetch('/api/medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicine, quantity: parseInt(quantity, 10), fromId, toId, priority }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: `Transfer of ${quantity}× ${medicine} dispatched!` });
        fetchTransfers();
      } else {
        setResult({ success: false, message: data.error || 'Failed to dispatch transfer.' });
      }
    } catch (e) {
      setResult({ success: false, message: 'Network error.' });
    } finally {
      setDispatching(false);
    }
  };

  const handleReceive = async (id: string) => {
    try {
      await fetch('/api/dispatch-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatchId: id, type: 'medicine', action: 'complete' }),
      });
      fetchTransfers();
    } catch { /* ignore */ }
  };

  const handleDemo = async () => {
    setDispatching(true);
    setResult(null);
    try {
      const res = await fetch('/api/medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicine: 'Epinephrine', quantity: 30,
          fromId: pharmacies[0]?.id, toId: hospitals[0]?.id, priority: 'critical',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: 'Demo: Emergency Epinephrine transfer dispatched!' });
        fetchTransfers();
      } else {
        setResult({ success: false, message: data.error || 'Demo failed.' });
      }
    } catch {
      setResult({ success: false, message: 'Network error.' });
    } finally {
      setDispatching(false);
    }
  };

  const handleReset = () => {
    setMedicine('Paracetamol');
    setQuantity('50');
    setPriority('normal');
    if (pharmacies.length > 0) setFromId(pharmacies[0].id);
    if (hospitals.length > 0) setToId(hospitals[0].id);
    setResult(null);
  };

  const inTransit = transfers.filter((t) => t.status === 'in-transit').length;
  const completed = transfers.filter((t) => t.status === 'completed').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ── LEFT: Dispatch Control Panel ── */}
        <div>
          <div className="glass-card" style={{ padding: '18px', flexShrink: 0 }}>

            {/* Header */}
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(167,139,250,0.2))', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Pill size={14} color="#10b981" />
              </div>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Medicine Dispatch</h3>
                <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '1px' }}>Configure & trigger medicine transfer</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Medicine select */}
              <SelectField label="Medicine" icon={Pill} value={medicine} onChange={setMedicine}>
                {MEDICINE_LIST.map((m) => (
                  <option key={m.value} value={m.value} style={{ background: '#fff' }}>{m.label}</option>
                ))}
              </SelectField>

              {/* Quantity */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  <Package size={11} /> Quantity (units)
                </label>
                <input type="number" min={1} max={500} value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
                />
              </div>

              {/* Priority */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  <AlertTriangle size={11} /> Priority Level
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {(Object.entries(PRIORITY_CONFIG) as [keyof typeof PRIORITY_CONFIG, typeof PRIORITY_CONFIG[keyof typeof PRIORITY_CONFIG]][]).map(([key, cfg]) => (
                    <button key={key} onClick={() => setPriority(key)}
                      style={{ padding: '7px 10px', borderRadius: '8px', border: `1px solid ${priority === key ? cfg.border : 'rgba(0,0,0,0.06)'}`, background: priority === key ? cfg.bg : 'transparent', color: priority === key ? cfg.color : '#475569', fontSize: '12px', fontWeight: priority === key ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      {priority === key && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />}
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* From Pharmacy */}
              <SelectField label="From (Pharmacy)" icon={FlaskConical} value={fromId} onChange={setFromId}>
                {pharmacies.map((p) => (
                  <option key={p.id} value={p.id} style={{ background: '#fff' }}>{p.label}</option>
                ))}
              </SelectField>

              {/* To Hospital */}
              <SelectField label="To (Hospital)" icon={Building2} value={toId} onChange={toId => setToId(toId)}>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id} style={{ background: '#fff' }}>{h.label}</option>
                ))}
              </SelectField>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={handleDispatch} disabled={dispatching || !fromId || !toId} className="btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', background: 'linear-gradient(135deg, #059669, #10b981)', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: dispatching ? 'not-allowed' : 'pointer', opacity: dispatching ? 0.6 : 1, transition: 'all 0.2s' }}>
                  <Play size={14} />
                  {dispatching ? 'Sending…' : 'Dispatch'}
                </button>
                <button onClick={handleDemo} disabled={dispatching} className="btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', background: 'linear-gradient(135deg, #be123c, #f87171)', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: dispatching ? 'not-allowed' : 'pointer', opacity: dispatching ? 0.6 : 1, transition: 'all 0.2s' }}>
                  <Zap size={14} />
                  Demo
                </button>
                <button onClick={handleReset}
                  style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                  onMouseEnter={(e) => { (e.currentTarget.style.background = 'rgba(0,0,0,0.06)'); (e.currentTarget.style.color = 'var(--text-primary)'); }}
                  onMouseLeave={(e) => { (e.currentTarget.style.background = 'rgba(0,0,0,0.03)'); (e.currentTarget.style.color = 'var(--text-secondary)'); }}>
                  <RotateCcw size={15} />
                </button>
              </div>

              {/* Result feedback */}
              {result && (
                <div style={{ padding: '10px 12px', borderRadius: '10px', background: result.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${result.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                  <p style={{ fontSize: '12px', color: result.success ? '#10b981' : '#ef4444', fontWeight: 600 }}>{result.message}</p>
                </div>
              )}

              {/* Smart routing note */}
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
                  <AlertTriangle size={11} /> Smart Route Calculation
                </div>
                <p style={{ fontSize: '11px', color: '#78716c', lineHeight: 1.5 }}>
                  Routes are calculated using A* pathfinding. Transfers auto-complete when ETA is reached and stock is credited to the destination hospital.
                </p>
              </div>
            </div>
          </div>

          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600, fontSize: '13px', marginTop: '16px' }}>
            ← Dashboard
          </Link>
        </div>

        {/* ── RIGHT: Live Transfer List ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Live Transfers</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Auto-updates every 3 seconds</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <RefreshCw size={12} />
              {lastUpdate || 'Loading…'}
            </div>
          </div>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { label: 'Total', value: transfers.length, color: '#8b5cf6' },
              { label: 'In Transit', value: inTransit, color: '#f59e0b' },
              { label: 'Delivered', value: completed, color: '#10b981' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                <p style={{ fontSize: '24px', fontWeight: 800, color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Transfer cards */}
          {transfers.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
              <Package size={36} style={{ color: 'var(--text-secondary)', opacity: 0.3, margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>No transfers yet.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                Use the panel to dispatch a transfer, or trigger a demo.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', paddingRight: '4px' }}>
              {transfers.map((t) => <TransferCard key={t.id} t={t} onReceive={handleReceive} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
