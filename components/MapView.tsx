/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GraphNode, Ambulance, PatientRequest } from '@/lib/engine/types';

// ─── SVG Pin Builder ──────────────────────────────────────────────────────────
function makePinSVG(fill: string, shadow: string, innerSVG: string, size: number = 36): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.4}" viewBox="0 0 ${size} ${size * 1.4}">
      <defs>
        <filter id="shadow-${fill.replace('#','')}" x="-40%" y="-20%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="${shadow}" flood-opacity="0.55"/>
        </filter>
        <radialGradient id="shine-${fill.replace('#','')}" cx="38%" cy="30%" r="55%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.45)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <path
        d="M${size / 2} ${size * 1.35}
           C${size / 2} ${size * 1.35} ${size * 0.08} ${size * 0.75} ${size * 0.08} ${size * 0.46}
           A${size * 0.42} ${size * 0.42} 0 1 1 ${size * 0.92} ${size * 0.46}
           C${size * 0.92} ${size * 0.75} ${size / 2} ${size * 1.35} ${size / 2} ${size * 1.35}Z"
        fill="${fill}"
        filter="url(#shadow-${fill.replace('#','')})"
      />
      <path
        d="M${size / 2} ${size * 1.35}
           C${size / 2} ${size * 1.35} ${size * 0.08} ${size * 0.75} ${size * 0.08} ${size * 0.46}
           A${size * 0.42} ${size * 0.42} 0 1 1 ${size * 0.92} ${size * 0.46}
           C${size * 0.92} ${size * 0.75} ${size / 2} ${size * 1.35} ${size / 2} ${size * 1.35}Z"
        fill="url(#shine-${fill.replace('#','')})"
      />
      <g transform="translate(${size * 0.5 - size * 0.28}, ${size * 0.46 - size * 0.28}) scale(${(size * 0.56) / 24})">
        ${innerSVG}
      </g>
    </svg>
  `;
}

const ICONS: Record<string, string> = {
  hospital: `
    <rect x="4" y="4" width="16" height="16" rx="2" fill="none"/>
    <path d="M12 8v8M8 12h8" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  `,
  village: `
    <path d="M3 12L12 4l9 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M5 10v8a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-8" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
  `,
  pharmacy: `
    <path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-4" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <path d="M12 8v8M8 12h8" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="12" cy="3" r="1.5" fill="white"/>
  `,
  'ambulance-depot': `
    <rect x="2" y="8" width="15" height="10" rx="1.5" fill="none" stroke="white" stroke-width="1.8"/>
    <path d="M17 12h3l2 4H17V12z" fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round"/>
    <circle cx="7" cy="19" r="2" fill="white"/>
    <circle cx="16" cy="19" r="2" fill="white"/>
    <path d="M7 10v4M5 12h4" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
  `,
  ambulance: `
    <rect x="2" y="8" width="15" height="10" rx="1.5" fill="white" opacity="0.25"/>
    <path d="M17 12h3l2 4H17V12z" fill="white" opacity="0.25" stroke="white" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="7" cy="19" r="2" fill="white"/>
    <circle cx="16" cy="19" r="2" fill="white"/>
    <path d="M7 10v4M5 12h4" stroke="white" stroke-width="2" stroke-linecap="round"/>
  `,
};

const PIN_CONFIG: Record<string, { fill: string; shadow: string; size: number; label: string }> = {
  hospital:          { fill: '#ef4444', shadow: '#ef4444', size: 40, label: 'Hospital'        },
  village:           { fill: '#3b82f6', shadow: '#3b82f6', size: 28, label: 'Village'         },
  pharmacy:          { fill: '#10b981', shadow: '#10b981', size: 32, label: 'Pharmacy'        },
  'ambulance-depot': { fill: '#8b5cf6', shadow: '#8b5cf6', size: 34, label: 'Ambulance Depot' },
};

const AMBULANCE_PIN = { fill: '#f472b6', shadow: '#f472b6', size: 30, label: 'Ambulance' };
const AMBULANCE_BUSY_PIN = { fill: '#f87171', shadow: '#f87171', size: 30, label: 'Ambulance (Busy)' };

function buildIcon(svg: string, size: number): L.DivIcon {
  return L.divIcon({
    html: svg,
    className: '',
    iconSize:   [size, size * 1.4],
    iconAnchor: [size / 2, size * 1.4],
    popupAnchor:[0, -(size * 1.2)],
    tooltipAnchor:[size * 0.55, -(size * 0.7)],
  });
}

function getNodeIcon(type: string): L.DivIcon {
  const cfg = PIN_CONFIG[type] || PIN_CONFIG.village;
  return buildIcon(
    makePinSVG(cfg.fill, cfg.shadow, ICONS[type] || ICONS.village, cfg.size),
    cfg.size
  );
}

function getAmbulanceIcon(busy: boolean): L.DivIcon {
  const cfg = busy ? AMBULANCE_BUSY_PIN : AMBULANCE_PIN;
  return buildIcon(
    makePinSVG(cfg.fill, cfg.shadow, ICONS.ambulance, cfg.size),
    cfg.size
  );
}

// ─── Legend item ─────────────────────────────────────────────────────────────
function LegendPin({ fill, label }: { fill: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <svg width="14" height="20" viewBox="0 0 14 20" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7 19.5C7 19.5 1 12.5 1 7A6 6 0 0 1 13 7C13 12.5 7 19.5 7 19.5Z"
          fill={fill}
        />
        <circle cx="7" cy="7" r="3" fill="rgba(255,255,255,0.35)" />
      </svg>
      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{label}</span>
    </div>
  );
}

// ─── Zoom Listener ────────────────────────────────────────────────────────────
function ZoomListener({ setZoom }: { setZoom: (z: number) => void }) {
  const map = useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MapView({
  nodes,
  ambulances,
  requests,
  activeRoute,
}: {
  nodes: GraphNode[];
  ambulances: Ambulance[];
  requests: PatientRequest[];
  activeRoute: { nodeIds: string[] } | null;
}) {
  const [positions, setPositions] = useState<Record<string, [number, number]>>({});
  const [zoomLevel, setZoomLevel] = useState<number>(12); // Default zoom

  useEffect(() => {
    const pos: Record<string, [number, number]> = {};
    nodes.forEach((n) => (pos[n.id] = [n.lat, n.lng]));
    setPositions(pos);
  }, [nodes]);

  const routeLatLngs: [number, number][] =
    activeRoute?.nodeIds.map((id) => positions[id]).filter(Boolean) || [];

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
        position: 'relative',
        boxShadow: '0 0 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* ── Legend overlay ── */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          background: 'rgba(255,255,255,0.88)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: '12px',
          padding: '12px 14px',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: '140px',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            color: '#475569',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            marginBottom: '2px',
          }}
        >
          Legend
        </span>
        <LegendPin fill="#ef4444" label="Hospital" />
        <LegendPin fill="#3b82f6" label="Village" />
        <LegendPin fill="#10b981" label="Pharmacy" />
        <LegendPin fill="#8b5cf6" label="Ambulance Depot" />
        <LegendPin fill="#f472b6" label="Ambulance (Idle)" />
        <LegendPin fill="#f87171" label="Ambulance (Busy)" />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '2px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <span style={{ width: '18px', height: '2px', background: '#f472b6', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: '#f472b6', fontWeight: 600 }}>Ambulance Route</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '2px',
          }}
        >
          <span style={{ width: '18px', height: '2px', background: '#3b82f6', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>Transport Route</span>
        </div>
      </div>

      <MapContainer
        center={[20.5, 78.5]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <ZoomListener setZoom={setZoomLevel} />

        <TileLayer
          attribution='&copy; Google'
          url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
        />

        {/* ── Graph nodes ── */}
        {nodes.map((n) => {
          const cfg   = PIN_CONFIG[n.type] || PIN_CONFIG.village;
          const occPct = n.capacity && n.capacity > 0
              ? Math.round(((n.occupied ?? 0) / n.capacity) * 100)
              : null;

          const popupContent = (
            <Popup maxWidth={240} className="custom-popup">
              <div style={{ fontFamily: 'Inter, sans-serif', padding: '4px 2px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${cfg.fill}22`,
                      border: `1px solid ${cfg.fill}44`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <g dangerouslySetInnerHTML={{ __html: ICONS[n.type] || ICONS.village }} />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{n.label}</div>
                    <div style={{ fontSize: '10px', color: cfg.fill, textTransform: 'capitalize', fontWeight: 600 }}>
                      {n.type.replace('-', ' ')}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                  <StatBox label="Lat" value={n.lat.toFixed(4)} />
                  <StatBox label="Lng" value={n.lng.toFixed(4)} />
                  {n.capacity !== undefined && (
                    <StatBox
                      label="Capacity"
                      value={`${n.occupied ?? 0} / ${n.capacity}`}
                      valueColor={occPct !== null && occPct > 80 ? '#f87171' : '#34d399'}
                    />
                  )}
                  {occPct !== null && (
                    <StatBox
                      label="Occupancy"
                      value={`${occPct}%`}
                      valueColor={occPct > 80 ? '#f87171' : occPct > 50 ? '#fbbf24' : '#34d399'}
                    />
                  )}
                  {n.ambulanceCount !== undefined && (
                    <StatBox label="Total Amb." value={String(n.ambulanceCount)} />
                  )}
                  {n.availableAmbulances !== undefined && (
                    <StatBox
                      label="Available"
                      value={String(n.availableAmbulances)}
                      valueColor="#34d399"
                    />
                  )}
                </div>

                {n.specialties && n.specialties.length > 0 && (
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#475569', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Specialties
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {n.specialties.map((s) => (
                        <span key={s} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', fontWeight: 500 }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {n.medicines && Object.keys(n.medicines).length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#475569', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Medicine Stock
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {Object.entries(n.medicines).slice(0, 5).map(([name, stock]) => (
                        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                          <span style={{ color: '#94a3b8' }}>{name}</span>
                          <span style={{ fontWeight: 700, color: stock < 5 ? '#f87171' : stock < 20 ? '#fbbf24' : '#34d399' }}>{stock} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          );

          const tooltipContent = (
            <Tooltip direction="top" offset={[0, -4]} opacity={1} className="custom-tooltip">
              <div style={{ fontFamily: 'Inter, sans-serif', padding: '6px 8px', minWidth: '130px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.fill, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{n.label}</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{n.type.replace('-', ' ')}</div>
                {occPct !== null && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Occupancy: <span style={{ fontWeight: 700, color: occPct > 80 ? '#f87171' : occPct > 50 ? '#fbbf24' : '#34d399' }}>{occPct}%</span>
                  </div>
                )}
              </div>
            </Tooltip>
          );

          // If zoomed out (< 13), show dots instead of large SVG pins to prevent clutter
          if (zoomLevel < 13) {
            return (
              <CircleMarker
                key={n.id}
                center={[n.lat, n.lng]}
                radius={n.type === 'hospital' ? 6 : n.type === 'village' ? 3 : 4}
                pathOptions={{ color: cfg.fill, fillColor: cfg.fill, fillOpacity: 1, weight: 1 }}
              >
                {tooltipContent}
                {popupContent}
              </CircleMarker>
            );
          }

          return (
            <Marker key={n.id} position={[n.lat, n.lng]} icon={getNodeIcon(n.type)}>
              {tooltipContent}
              {popupContent}
            </Marker>
          );
        })}

        {/* ── Ambulances ── */}
        {ambulances.map((a) => {
          const pos = positions[a.nodeId];
          if (!pos) return null;
          const busy = a.status === 'busy';
          const cfg  = busy ? AMBULANCE_BUSY_PIN : AMBULANCE_PIN;

          const tooltipContent = (
            <Tooltip direction="top" offset={[0, -4]} opacity={1} className="custom-tooltip">
              <div style={{ fontFamily: 'Inter, sans-serif', padding: '5px 7px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.fill, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{a.id}</span>
                </div>
                <div style={{ fontSize: '10px', color: busy ? '#f87171' : '#34d399', fontWeight: 600, textTransform: 'capitalize' }}>
                  ● {a.status}
                </div>
                {a.etaMinutes !== undefined && (
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                    ETA: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{a.etaMinutes} min</span>
                  </div>
                )}
              </div>
            </Tooltip>
          );

          if (zoomLevel < 13) {
            return (
              <CircleMarker
                key={a.id}
                center={pos}
                radius={5}
                pathOptions={{ color: cfg.fill, fillColor: cfg.fill, fillOpacity: 1, weight: 1 }}
              >
                {tooltipContent}
              </CircleMarker>
            );
          }

          return (
            <Marker key={a.id} position={pos} icon={getAmbulanceIcon(busy)}>
              {tooltipContent}
            </Marker>
          );
        })}

        {/* ── Active (Demo) Route ── */}
        {routeLatLngs.length > 1 && (
          <RoadPolyline
            positions={routeLatLngs}
            pathOptions={{ color: '#dc2626', weight: 4, opacity: 0.9, dashArray: '10 8' }}
            className="animated-route-patient"
          />
        )}

        {/* ── Dispatched dual-routes (Ambulance + Patient) ── */}
        {requests
          .filter((r) => r.status === 'dispatched')
          .map((r) => {
            // Ambulance route: Depot -> Patient Village
            const ambLatLngs = r.ambulanceRoute?.map((id) => positions[id]).filter(Boolean) || [];
            // Transport route: Patient Village -> Hospital
            const ptLatLngs = r.route?.map((id) => positions[id]).filter(Boolean) || [];
            
            return (
              <React.Fragment key={r.id}>
                {ambLatLngs.length > 1 && (
                  <RoadPolyline
                    positions={ambLatLngs}
                    pathOptions={{ color: '#f472b6', weight: 3, opacity: 0.8 }}
                    className="animated-route-amb"
                  />
                )}
                {ptLatLngs.length > 1 && (
                  <RoadPolyline
                    positions={ptLatLngs}
                    pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.8 }}
                    className="animated-route-patient"
                  />
                )}
              </React.Fragment>
            );
          })}
      </MapContainer>
    </div>
  );
}

// ─── Tiny stat box ────────────────────────────────────────────────────────────
function StatBox({
  label,
  value,
  valueColor = 'var(--text-primary)',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.03)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: '6px',
        padding: '5px 7px',
      }}
    >
      <div style={{ fontSize: '9px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: valueColor, marginTop: '2px' }}>
        {value}
      </div>
    </div>
  );
}

// ─── OSRM Road Polyline ───────────────────────────────────────────────────────
function RoadPolyline({ positions, pathOptions, className }: { positions: [number, number][]; pathOptions: any; className?: string }) {
  const [roadPath, setRoadPath] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!positions || positions.length < 2) {
      setRoadPath([]);
      return;
    }
    
    // Removed immediate straight-line fallback to ensure only road paths are drawn

    // Build OSRM query using only start and end points for the absolute quickest road path
    const start = positions[0];
    const end = positions[positions.length - 1];
    const coords = `${start[1]},${start[0]};${end[1]},${end[0]}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    let active = true;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.code === 'Ok' && data.routes && data.routes[0]) {
          const geometry = data.routes[0].geometry.coordinates;
          const latLngs: [number, number][] = geometry.map((c: [number, number]) => [c[1], c[0]]);
          setRoadPath(latLngs);
        }
      })
      .catch((e) => console.error('OSRM Fetch Error:', e));

    return () => { active = false; };
  }, [positions]);

  if (roadPath.length < 2) return null;

  return <Polyline positions={roadPath} pathOptions={pathOptions} className={className} />;
}
