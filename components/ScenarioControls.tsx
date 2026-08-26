/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { Play, RotateCcw, Zap, AlertTriangle, MapPin, Clock3, Stethoscope, ChevronDown } from 'lucide-react';
import { GraphNode } from '@/lib/engine/types';

const URGENCY_CONFIG = {
  critical: { label: 'Critical', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
  urgent: { label: 'Urgent', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' },
  moderate: { label: 'Moderate', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)' },
  low: { label: 'Low', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)' },
};

const SPECIALTIES = [
  { value: 'cardiology', label: 'Cardiology', icon: '🫀' },
  { value: 'neurology', label: 'Neurology', icon: '🧠' },
  { value: 'orthopedics', label: 'Orthopedics', icon: '🦴' },
  { value: 'pediatrics', label: 'Pediatrics', icon: '👶' },
  { value: 'general', label: 'General', icon: '⚕️' },
];

function SelectField({
  label,
  icon: Icon,
  value,
  onChange,
  children,
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          fontWeight: 600,
          color: '#64748b',
          marginBottom: '6px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}
      >
        <Icon size={11} />
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            background: 'rgba(0,0,0,0.02)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '10px',
            padding: '9px 32px 9px 12px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            outline: 'none',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(14,165,233,0.5)')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
        >
          {children}
        </select>
      </div>
    </div>
  );
}

export default function ScenarioControls({
  villages,
  onDispatch,
  onReset,
  onScenario,
  loading,
}: {
  villages: GraphNode[];
  onDispatch: (req: { requestId: string; villageId: string; urgency: string; specialty: string }) => void;
  onReset: () => void;
  onScenario: (name: string) => void;
  loading: boolean;
}) {
  const [villageId, setVillageId] = useState(villages[0]?.id || '');
  const [urgency, setUrgency] = useState<keyof typeof URGENCY_CONFIG>('critical');
  const [specialty, setSpecialty] = useState('cardiology');

  useEffect(() => {
    if (villages.length > 0 && !villages.find((v) => v.id === villageId)) {
      setVillageId(villages[0].id);
    }
  }, [villages, villageId]);

  const urgencyConfig = URGENCY_CONFIG[urgency];

  return (
    <div
      className="glass-card"
      style={{ padding: '18px', flexShrink: 0 }}
    >
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(167,139,250,0.2))',
            border: '1px solid rgba(56,189,248,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Play size={14} color="#38bdf8" />
        </div>
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Dispatch Controls</h3>
          <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '1px' }}>Configure & trigger emergency response</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Village select */}
        <SelectField label="Village" icon={MapPin} value={villageId} onChange={setVillageId}>
          {villages.map((v) => (
            <option key={v.id} value={v.id} style={{ background: '#ffffff' }}>
              {v.label}
            </option>
          ))}
        </SelectField>

        {/* Urgency select */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#64748b',
              marginBottom: '6px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            <AlertTriangle size={11} />
            Urgency Level
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {(Object.entries(URGENCY_CONFIG) as [keyof typeof URGENCY_CONFIG, typeof URGENCY_CONFIG[keyof typeof URGENCY_CONFIG]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setUrgency(key)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${urgency === key ? cfg.border : 'rgba(0,0,0,0.06)'}`,
                  background: urgency === key ? cfg.bg : 'transparent',
                  color: urgency === key ? cfg.color : '#475569',
                  fontSize: '12px',
                  fontWeight: urgency === key ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                {urgency === key && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />}
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Specialty select */}
        <SelectField label="Specialty" icon={Stethoscope} value={specialty} onChange={setSpecialty}>
          {SPECIALTIES.map((s) => (
            <option key={s.value} value={s.value} style={{ background: '#ffffff' }}>
              {s.icon} {s.label}
            </option>
          ))}
        </SelectField>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={() =>
              onDispatch({
                requestId: `req-${Date.now()}`,
                villageId,
                urgency,
                specialty,
              })
            }
            disabled={loading || villages.length === 0}
            className="btn-primary"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              border: 'none',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            <Play size={14} />
            {loading ? 'Dispatching...' : 'Dispatch'}
          </button>

          <button
            onClick={() => onScenario('demo-cardiology')}
            disabled={loading}
            className="btn-primary"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #be123c, #f87171)',
              border: 'none',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            <Zap size={14} />
            Demo
          </button>

          <button
            onClick={onReset}
            style={{
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              background: 'rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.08)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(0,0,0,0.06)';
              (e.target as HTMLButtonElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(0,0,0,0.03)';
              (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Edge cases notice */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.15)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#fbbf24',
              marginBottom: '4px',
            }}
          >
            <AlertTriangle size={11} />
            Smart Edge Handling
          </div>
          <p style={{ fontSize: '11px', color: '#78716c', lineHeight: 1.5 }}>
            Handles missing routes, specialist unavailability, occupied ambulances, full hospitals & concurrent emergencies automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
