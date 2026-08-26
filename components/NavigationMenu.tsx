'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Map, Pill, Stethoscope, Shield } from 'lucide-react';

const ROUTES = [
  { path: '/', label: 'Home', icon: Home, color: '#0ea5e9' },
  { path: '/dashboard', label: 'Simulated Mapping', icon: Map, color: '#10b981' },
  { path: '/medicine-transfer', label: 'Medicine Transfer', icon: Pill, color: '#f43f5e' },
];

export default function NavigationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Floating Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
          border: 'none',
          boxShadow: '0 8px 32px rgba(14,165,233,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <Menu size={24} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(248, 250, 252, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            animation: 'fade-in 0.2s ease',
          }}
        />
      )}

      {/* Sidebar Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '320px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.05)',
          zIndex: 10001,
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={16} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>Routing Engine</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'rgba(0,0,0,0.04)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ROUTES.map((r) => {
            const active = pathname === r.path;
            return (
              <Link
                key={r.path}
                href={r.path}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: active ? `${r.color}15` : 'transparent',
                  color: active ? r.color : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontWeight: active ? 700 : 500,
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  border: active ? `1px solid ${r.color}30` : '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <r.icon size={18} color={active ? r.color : 'var(--text-muted)'} />
                {r.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </>
  );
}
