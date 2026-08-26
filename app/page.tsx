'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, MapPin, Activity, Stethoscope, Ambulance, Pill, HeartPulse, Route, CheckCircle2, Hospital, AlertTriangle, ArrowDown } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Glowing Orbs */}
      <div style={{
        position: 'absolute', top: '-15%', left: '-10%', width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, rgba(14,165,233,0) 70%)',
        filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '-10%', width: '60vw', height: '60vw',
        background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0) 70%)',
        filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none'
      }} />

      {/* Header (Preserved) */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 48px', position: 'relative', zIndex: 10,
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--glow-blue)',
          }}>
            <Shield size={20} color="white" />
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Rural Health Routing Engine
          </h1>
        </div>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div className="btn-primary" style={{
            padding: '10px 24px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            color: 'white', fontSize: '14px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: 'var(--glow-blue)', cursor: 'pointer'
          }}>
            Enter Dashboard <ArrowRight size={16} />
          </div>
        </Link>
      </header>

      <main style={{ flex: 1, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* 1. HERO */}
        <section style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
          maxWidth: '1300px', width: '100%', padding: '80px 24px', gap: '60px'
        }}>
          {/* Left: Copy */}
          <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{
              padding: '8px 16px', borderRadius: '999px', background: 'rgba(14,165,233,0.1)',
              border: '1px solid rgba(14,165,233,0.2)', color: 'var(--accent-blue)',
              fontSize: '13px', fontWeight: 700, marginBottom: '32px',
              display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}>
              <span className="status-dot active idle" style={{ width: '8px', height: '8px' }} />
              SYSTEM ACTIVE & MONITORING
            </div>
            
            <h2 style={{
              fontSize: 'clamp(48px, 6vw, 64px)', fontWeight: 800, color: 'var(--text-primary)',
              lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '24px'
            }}>
              Intelligent Dispatch for <br/>
              <span style={{
                background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Rural Healthcare</span>
            </h2>

            <p style={{
              fontSize: '20px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '40px', maxWidth: '540px'
            }}>
              Optimize ambulance routing, track real-time hospital capacity, and automate emergency medicine logistics across rural networks.
            </p>

            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <div className="btn-primary" style={{
                padding: '16px 32px', borderRadius: '16px', background: 'var(--text-primary)',
                color: 'white', fontSize: '16px', fontWeight: 600, display: 'flex',
                alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
              }}>
                Launch Live Dashboard <ArrowRight size={20} />
              </div>
            </Link>
          </div>

          {/* Right: Visual Routing Element */}
          <div style={{
            flex: '1 1 500px', display: 'flex', justifyContent: 'center', position: 'relative'
          }}>
            <div className="glass-card animate-float" style={{
              width: '100%', maxWidth: '480px', aspectRatio: '1', borderRadius: '24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4))'
            }}>
              <svg width="100%" height="100%" viewBox="0 0 400 400" style={{ position: 'absolute', inset: 0, opacity: 0.6 }}>
                <path d="M 100 300 Q 150 150 250 100" fill="none" stroke="var(--accent-blue)" strokeWidth="3" strokeDasharray="8 8" className="animated-route-amb" />
                <path d="M 300 300 Q 250 250 250 100" fill="none" stroke="var(--accent-green)" strokeWidth="3" strokeDasharray="8 8" className="animated-route-patient" />
              </svg>
              
              <div style={{ position: 'absolute', top: '20%', left: '55%', transform: 'translate(-50%, -50%)' }}>
                <VisualNode icon={Hospital} color="var(--accent-red)" label="Hospital" pulse />
              </div>
              <div style={{ position: 'absolute', bottom: '20%', left: '20%', transform: 'translate(-50%, -50%)' }}>
                <VisualNode icon={MapPin} color="var(--accent-blue)" label="Village" />
              </div>
              <div style={{ position: 'absolute', bottom: '20%', right: '20%', transform: 'translate(-50%, -50%)' }}>
                <VisualNode icon={Ambulance} color="var(--accent-green)" label="Depot" />
              </div>
            </div>
          </div>
        </section>


        {/* 3. DISPATCH PROCESS — MAIN SCROLL SECTION */}
        <section style={{ maxWidth: '1000px', width: '100%', padding: '100px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h3 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px' }}>The Dispatch Workflow</h3>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              A connected, intelligent pipeline that routes critical resources where they are needed most.
            </p>
          </div>
          
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* The vertical connection line */}
            <div style={{ position: 'absolute', top: '40px', bottom: '40px', left: '48px', width: '4px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
              <div style={{ width: '100%', height: '100%', background: 'var(--accent-blue)', opacity: 0.2, borderRadius: '4px' }} />
            </div>

            <TimelineStep 
              num="01" icon={HeartPulse} color="#ef4444" title="Emergency Triggered" 
              desc="A patient request arrives from a rural village with urgency and required specialty." 
            />
            <TimelineStep 
              num="02" icon={Ambulance} color="#3b82f6" title="Ambulance Dispatch" 
              desc="The engine identifies an available ambulance and calculates a feasible route." 
            />
            <TimelineStep 
              num="03" icon={Hospital} color="#10b981" title="Specialist & Hospital Selection" 
              desc="The engine evaluates specialist availability and hospital capacity." 
            />
            <TimelineStep 
              num="04" icon={Route} color="#f59e0b" title="Route Optimization" 
              desc="The routing engine calculates an efficient path while considering the available road network." 
            />
            <TimelineStep 
              num="05" icon={Pill} color="#8b5cf6" title="Medicine Preparation" 
              desc="Required medicines are checked and prepared. If stock is insufficient, replenishment/transfer can be initiated." 
            />
            <TimelineStep 
              num="06" icon={CheckCircle2} color="#14b8a6" title="Patient Reaches Facility" 
              desc="The ambulance reaches the selected qualified healthcare facility." 
            />
          </div>
        </section>

        {/* 4. DECISION INTELLIGENCE */}
        <section style={{ maxWidth: '1200px', width: '100%', padding: '40px 24px', textAlign: 'center' }}>
          <div className="glass-card" style={{ padding: '48px 24px', background: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '40px' }}>Decision Intelligence</h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
              <Factor badge="Urgency" icon={AlertTriangle} />
              <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>+</span>
              <Factor badge="Distance" icon={MapPin} />
              <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>+</span>
              <Factor badge="Ambulance Availability" icon={Ambulance} />
              <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>+</span>
              <Factor badge="Specialist Availability" icon={Stethoscope} />
              <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>+</span>
              <Factor badge="Hospital Capacity" icon={Hospital} />
              <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>+</span>
              <Factor badge="Medicine Availability" icon={Pill} />
            </div>

            <div style={{ margin: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <ArrowDown size={20} color="var(--accent-blue)" opacity={0.4} />
              <ArrowDown size={20} color="var(--accent-blue)" opacity={0.7} />
              <ArrowDown size={20} color="var(--accent-blue)" />
            </div>

            <div style={{
              padding: '16px 40px', borderRadius: '999px', background: 'var(--text-primary)',
              color: 'white', fontSize: '18px', fontWeight: 700, boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
            }}>
              → Optimal Feasible Decision
            </div>
          </div>
        </section>

        {/* 5. CORE CAPABILITIES */}
        <section style={{ maxWidth: '1200px', width: '100%', padding: '60px 24px 100px' }}>
          <h3 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '40px', textAlign: 'center' }}>Core Capabilities</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center' }}>
            <CapabilityCard icon={Route} title="Dynamic Graph Routing" desc="Shortest-path calculations utilizing real-time edge weights." />
            <CapabilityCard icon={Activity} title="Resource Allocation" desc="Smart matching of patient needs with exact specialist capacity." />
            <CapabilityCard icon={Pill} title="Medicine Logistics" desc="Proactive supply tracking and predictive fulfillment." />
          </div>
        </section>

        {/* 6. FINAL CTA */}
        <section style={{ padding: '60px 24px 120px', textAlign: 'center', width: '100%' }}>
          <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '32px' }}>See the routing engine in action.</h2>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <div className="btn-primary" style={{
              display: 'inline-flex', padding: '20px 48px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', color: 'white',
              fontSize: '18px', fontWeight: 700, alignItems: 'center', gap: '12px',
              boxShadow: '0 12px 40px rgba(14,165,233,0.3)', cursor: 'pointer'
            }}>
              Enter Live Dashboard <ArrowRight size={20} />
            </div>
          </Link>
        </section>

      </main>
    </div>
  );
}

// ---------------------------------------------------------
// Sub-components
// ---------------------------------------------------------

function VisualNode({ icon: Icon, color, label, pulse }: { icon: any, color: string, label: string, pulse?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%', background: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 12px 32px ${color}30`, border: `2px solid ${color}40`, position: 'relative'
      }}>
        {pulse && (
          <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `2px solid ${color}`, opacity: 0.5, animation: 'pulse-dot 2s infinite' }} />
        )}
        <Icon size={32} color={color} />
      </div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        {label}
      </div>
    </div>
  );
}

function MetricItem({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div className="metric-number" style={{ 
        fontSize: '40px', fontWeight: 800, 
        color: highlight ? 'var(--accent-blue)' : 'var(--text-primary)',
        lineHeight: 1
      }}>
        {value}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
    </div>
  );
}

function TimelineStep({ num, icon: Icon, title, desc, color }: { num: string, icon: any, title: string, desc: string, color: string }) {
  const isVisible = true; // In a real scenario, use IntersectionObserver for scroll-reveal
  
  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', gap: '32px', zIndex: 2,
      opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.6s ease, transform 0.6s ease'
    }}>
      <div style={{
        width: '100px', height: '100px', borderRadius: '24px', background: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${color}40`, boxShadow: `0 12px 32px ${color}20`,
        flexShrink: 0, position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: '-10px', left: '-10px', background: color, color: 'white', fontSize: '12px', fontWeight: 800, padding: '4px 8px', borderRadius: '8px' }}>
          {num}
        </div>
        <Icon size={40} color={color} />
      </div>
      
      <div className="glass-card" style={{ padding: '24px', flex: 1, background: 'rgba(255,255,255,0.8)' }}>
        <h4 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>{title}</h4>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}

function Factor({ badge, icon: Icon }: { badge: string, icon: any }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
      background: 'white', border: '1px solid var(--border-color)', borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
    }}>
      <Icon size={16} color="var(--text-secondary)" />
      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{badge}</span>
    </div>
  );
}

function CapabilityCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="glass-card" style={{
      padding: '24px', width: '320px', display: 'flex', gap: '16px', alignItems: 'flex-start'
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(14,165,233,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={24} color="var(--accent-blue)" />
      </div>
      <div>
        <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{title}</h4>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}
