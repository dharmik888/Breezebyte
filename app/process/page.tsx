'use client';

import React from 'react';
import { Stethoscope, ArrowRight, Ambulance, Syringe, HeartPulse } from 'lucide-react';
import Link from 'next/link';

export default function ProcessPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '48px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ maxWidth: '800px', width: '100%' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-blue)'
          }}>
            <Stethoscope size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
              Dispatch Process
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              How the routing engine coordinates Ambulances, Doctors, and Medicines.
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
          
          <ProcessStep 
            icon={HeartPulse}
            color="#ef4444"
            title="1. Emergency Triggered"
            description="A request is generated at a rural village node. The engine evaluates the urgency level and required medical specialty (e.g., Cardiology, Orthopedics)."
          />

          <ProcessStep 
            icon={Ambulance}
            color="#3b82f6"
            title="2. Ambulance Dispatch"
            description="The engine locates the nearest idle ambulance using real-time graph routing. The ambulance is dispatched to the village."
          />

          <ProcessStep 
            icon={Stethoscope}
            color="#10b981"
            title="3. Hospital Selection"
            description="Simultaneously, the engine queries the network for a hospital that has the required specialist on duty AND available bed capacity. The ambulance is dynamically routed there."
          />

          <ProcessStep 
            icon={Syringe}
            color="#f59e0b"
            title="4. Medicine Preparation"
            description="Upon arrival, the required medicines (e.g., Epinephrine for critical cardiology cases) are prepared. If hospital stocks run low, an automated transfer order is placed."
          />

        </div>
        
        <Link href="/dashboard" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--accent-blue)',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          Return to Dashboard <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function ProcessStep({ icon: Icon, title, description, color }: { icon: React.ElementType; title: string; description: string; color: string }) {
  return (
    <div className="glass-card" style={{
      padding: '24px',
      background: 'var(--bg-card)',
      display: 'flex',
      gap: '20px',
      alignItems: 'flex-start'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: `1px solid ${color}30`
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {title}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {description}
        </p>
      </div>
    </div>
  );
}
