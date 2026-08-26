'use client';

import { DecisionLogEntry } from '@/lib/engine/types';
import { Clock, Route, IndianRupee, Pill, Ambulance, FileText, ChevronRight, Timer } from 'lucide-react';

const URGENCY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
  urgent: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
  moderate: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
  low: { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
};

function MetaChip({ icon: Icon, children, color }: { icon: React.ElementType; children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '6px',
        background: 'rgba(0,0,0,0.03)',
        border: '1px solid rgba(0,0,0,0.08)',
        fontSize: '11px',
        color: color || 'var(--text-secondary)',
        fontWeight: 500,
      }}
    >
      <Icon size={10} color={color} />
      {children}
    </span>
  );
}

export default function DecisionLog({ logs }: { logs: DecisionLogEntry[] }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '18px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(244,114,182,0.2))',
              border: '1px solid rgba(167,139,250,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={14} color="#a78bfa" />
          </div>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Decision Log</h3>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '1px' }}>AI dispatch rationale</p>
          </div>
        </div>
        {logs.length > 0 && (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '999px',
              background: 'rgba(167,139,250,0.15)',
              border: '1px solid rgba(167,139,250,0.25)',
              fontSize: '11px',
              color: '#a78bfa',
              fontWeight: 600,
            }}
          >
            {logs.length}
          </span>
        )}
      </div>

      {/* Log entries */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '2px' }}>
        {logs.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: '#334155',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.03)',
                border: '1px dashed rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={20} />
            </div>
            <p style={{ fontSize: '12px', textAlign: 'center', lineHeight: 1.6 }}>
              No decisions yet.<br />
              Trigger a dispatch to see AI rationale.
            </p>
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={log.id}
              className="animate-slide-in"
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.02)',
                border: '1px solid rgba(0,0,0,0.06)',
                transition: 'border-color 0.2s, background 0.2s',
                animationDelay: `${index * 0.05}s`,
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(167,139,248,0.25)';
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(167,139,248,0.04)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.06)';
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.02)';
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ChevronRight size={12} color="#a78bfa" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {log.requestId}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                  <Clock size={10} />
                  {new Date(log.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                  })}
                </div>
              </div>

              {/* Rationale */}
              <p
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '10px',
                  padding: '8px 10px',
                  background: 'rgba(0,0,0,0.03)',
                  borderRadius: '8px',
                  borderLeft: '3px solid rgba(167,139,250,0.4)',
                }}
              >
                {log.rationale}
              </p>

              {/* Meta chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                <MetaChip icon={IndianRupee} color="#fbbf24">
                  {log.costRange || `₹${log.cost.toFixed(1)}`} est.
                </MetaChip>
                {log.durationMinutes !== undefined && (
                  <MetaChip icon={Timer} color="#a78bfa">
                    {Math.round(log.durationMinutes)} min ETA
                  </MetaChip>
                )}
                <MetaChip icon={Route} color="#38bdf8">
                  {log.path.length} hops
                </MetaChip>
                {log.ambulanceId && (
                  <MetaChip icon={Ambulance} color="#34d399">
                    {log.ambulanceId}
                  </MetaChip>
                )}
                {log.medicinePrepared && log.medicinePrepared.length > 0 && (
                  <MetaChip icon={Pill} color="#f472b6">
                    {log.medicinePrepared.join(', ')}
                  </MetaChip>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
