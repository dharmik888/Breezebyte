'use client';

import { Doughnut, Bar } from 'react-chartjs-2';
import { Ambulance, Activity, Stethoscope, Pill } from 'lucide-react';
import { Telemetry } from '@/lib/engine/types';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.02)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: '12px',
        padding: '14px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: 600,
        color: '#64748b',
        marginBottom: '12px',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
      }}
    >
      <Icon size={11} color={color} />
      {label}
    </div>
  );
}

export default function TelemetryPanel({ data }: { data: Telemetry }) {
  const busyPct = Math.round(data.fleetUtilization * 100);
  const idlePct = 100 - busyPct;

  // Aggregate medicine stock totals by drug name across all hospitals
  const aggregatedMeds = Object.values(
    data.medicineStock.reduce<Record<string, { name: string; stock: number; threshold: number }>>(
      (acc, m) => {
        if (acc[m.name]) {
          acc[m.name].stock += m.stock;
        } else {
          acc[m.name] = { name: m.name, stock: m.stock, threshold: m.threshold };
        }
        return acc;
      },
      {}
    )
  );

  const fleetData = {
    labels: ['Busy', 'Idle'],
    datasets: [
      {
        data: [busyPct, idlePct],
        backgroundColor: ['#f87171', '#34d399'],
        borderColor: ['rgba(248,113,113,0.3)', 'rgba(52,211,153,0.3)'],
        borderWidth: 1,
      },
    ],
  };

  const hospitalData = {
    labels: data.hospitalCapacity.map((h) => h.label.replace('Hospital ', 'H').replace(' Medical Center', '')),
    datasets: [
      {
        label: 'Occupancy %',
        data: data.hospitalCapacity.map((h) => h.pct),
        backgroundColor: data.hospitalCapacity.map((h) =>
          h.pct > 80 ? 'rgba(248,113,113,0.7)' : h.pct > 50 ? 'rgba(251,191,36,0.7)' : 'rgba(52,211,153,0.7)'
        ),
        borderColor: data.hospitalCapacity.map((h) =>
          h.pct > 80 ? '#f87171' : h.pct > 50 ? '#fbbf24' : '#34d399'
        ),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        titleColor: '#475569',
        bodyColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { color: '#64748b', font: { size: 10 } },
        border: { color: 'rgba(0,0,0,0.06)' },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          callback: (v: number | string) => `${v}%`,
        },
        border: { color: 'rgba(0,0,0,0.06)' },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        titleColor: '#475569',
        bodyColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: { label: string; raw: unknown }) => `${ctx.label}: ${ctx.raw}%`,
        },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* Queue length */}
        <SectionCard>
          <SectionLabel icon={Activity} label="Queue" color="#38bdf8" />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
            <span
              className="metric-number"
              style={{
                fontSize: '36px',
                fontWeight: 800,
                color: data.queueLength > 3 ? '#f87171' : data.queueLength > 0 ? '#fbbf24' : '#34d399',
                lineHeight: 1,
                letterSpacing: '-2px',
              }}
            >
              {data.queueLength}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>pending</span>
          </div>
          <div
            className="progress-bar"
            style={{ marginTop: '10px' }}
          >
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(100, (data.queueLength / 10) * 100)}%`,
                background: data.queueLength > 3
                  ? 'linear-gradient(90deg, #dc2626, #f87171)'
                  : data.queueLength > 0
                  ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                  : 'linear-gradient(90deg, #059669, #34d399)',
              }}
            />
          </div>
        </SectionCard>

        {/* Fleet utilization */}
        <SectionCard>
          <SectionLabel icon={Ambulance} label="Fleet" color="#a78bfa" />
          <div style={{ position: 'relative', height: '72px' }}>
            <Doughnut data={fleetData} options={doughnutOptions} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="metric-number"
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: busyPct > 70 ? '#f87171' : '#34d399',
                  lineHeight: 1,
                }}
              >
                {busyPct}%
              </span>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '2px' }}>busy</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
            {[
              { label: 'Busy', color: '#f87171', value: busyPct },
              { label: 'Idle', color: '#34d399', value: idlePct },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: '10px', color: '#64748b' }}>{item.label} {item.value}%</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Hospital capacity */}
      <SectionCard>
        <SectionLabel icon={Stethoscope} label="Hospital Capacity" color="#34d399" />
        <div style={{ height: '140px' }}>
          <Bar data={hospitalData} options={barOptions} />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'center' }}>
          {[
            { color: '#34d399', label: '< 50%' },
            { color: '#fbbf24', label: '50–80%' },
            { color: '#f87171', label: '> 80%' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: '10px', color: '#475569' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Medicine stock */}
      <SectionCard>
        <SectionLabel icon={Pill} label="Medicine Stock" color="#f472b6" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {aggregatedMeds.map((m) => {
            const maxStock = m.threshold * 30; // rough max for progress bar at aggregated level
            const pct = Math.min(100, (m.stock / maxStock) * 100);
            const isLow = m.stock < m.threshold * 3;
            const isCritical = m.stock < m.threshold;
            const color = isCritical ? '#f87171' : isLow ? '#fbbf24' : '#34d399';

            return (
              <div key={m.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {m.name}
                    {isLow && (
                      <span style={{ marginLeft: '6px', fontSize: '9px', fontWeight: 700, color, padding: '1px 5px', borderRadius: '4px', background: `${color}20`, border: `1px solid ${color}40` }}>
                        {isCritical ? 'CRITICAL' : 'LOW'}
                      </span>
                    )}
                  </span>
                  <span className="metric-number" style={{ fontSize: '12px', fontWeight: 700, color }}>
                    {m.stock}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: isCritical
                        ? 'linear-gradient(90deg, #dc2626, #f87171)'
                        : isLow
                        ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                        : 'linear-gradient(90deg, #059669, #34d399)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
