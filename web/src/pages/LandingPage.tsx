import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LanguageLogo from '../components/LanguageLogo';
import TypewriterEffect from '../components/TypewriterEffect';

const features = [
  { icon: '⚡', color: 'rgba(99,102,241,0.15)', title: 'Real-Time Battles', desc: 'Server-authoritative 45s timers, simultaneous question delivery, and sub-150ms event latency keep the game perfectly synchronized.' },
  { icon: '🎯', color: 'rgba(168,85,247,0.15)', title: 'Battleship Grid', desc: 'Answer correctly to dig into your opponent\'s hidden grid. Find their shapes to sink them — strategy meets knowledge.' },
  { icon: '🧠', color: 'rgba(34,211,238,0.15)', title: 'AI-Powered Hints', desc: 'Stuck on a question? Request a Gemini-powered hint that nudges you in the right direction without giving it away.' },
  { icon: '🏆', color: 'rgba(234,179,8,0.15)', title: 'Ranked Leaderboards', desc: 'Weekly and all-time rankings across Python, JavaScript, Java, and C++. Climb the ladder and prove your coding mastery.' },
  { icon: '🤝', color: 'rgba(99,102,241,0.15)', title: 'Friend Challenges', desc: 'Add friends, see who\'s online, and challenge them to a match instantly with real-time invitations.' },
  { icon: '🔀', color: 'rgba(239,68,68,0.15)', title: '100+ Questions', desc: 'Curated questions across arrays, strings, OOP, closures, pointers, and more — varying difficulty from beginner to expert.' },
];

const howItWorks = [
  { step: '01', title: 'Choose Your Arena', desc: 'Pick a programming language and topics. The server generates a fresh question set for your match.' },
  { step: '02', title: 'Place Your Ships', desc: 'In 90 seconds, strategically place random shapes on your hidden grid. Your opponent can\'t see your layout.' },
  { step: '03', title: 'Answer & Attack', desc: 'Answer the 45-second question first to earn a dig turn. Hit a cell on your opponent\'s grid to score points.' },
  { step: '04', title: 'Dominate', desc: 'Most points after all questions wins. Sink all your opponent\'s shapes for an early victory!' },
];

export default function LandingPage() {
  return (
    <div className="page">
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge fade-in">
            <span>🎮</span>
            <span>Real-time Multiplayer Coding Quiz</span>
          </div>
          <h1 className="hero-title fade-in-up stagger-1">
            <TypewriterEffect />
          </h1>
          <p className="hero-subtitle fade-in-up stagger-2">
            Test your coding knowledge in real-time 1v1 battles. Answer questions, attack your opponent's hidden grid, and climb the leaderboard.
          </p>
          <div className="hero-cta fade-in-up stagger-3">
            <Link to="/signup" className="btn btn-primary btn-lg glow-pulse">
              Start Playing Free →
            </Link>
            <Link to="/login" className="btn btn-ghost btn-lg">
              Sign In
            </Link>
          </div>

          {/* Mini game preview */}
          <div className="fade-in-up stagger-4" style={{ marginTop: 64, display: 'flex', justifyContent: 'center' }}>
            <MiniGamePreview />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section container">
        <div className="stats-banner">
          {[
            { value: '100+', label: 'Questions' },
            { value: '10+', label: 'Topics' },
            { value: '<150ms', label: 'Latency' },
            { value: '8', label: 'Languages' },
          ].map((s) => (
            <div key={s.label} className="stat-item">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="section container">
        <div className="text-center" style={{ marginBottom: 48 }}>
          <h2 className="section-title">Everything you need to compete</h2>
          <p className="section-sub">Built for coders who want to test their skills in a fun, competitive way.</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={f.title} className="feature-card fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="feature-icon" style={{ background: f.color }}>{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="section" style={{ background: 'rgba(99,102,241,0.04)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <h2 className="section-title">How It Works</h2>
            <p className="section-sub">Four simple steps to coding glory.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {howItWorks.map((h, i) => (
              <div key={h.step} className="fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="font-mono" style={{ fontSize: 48, fontWeight: 900, color: 'rgba(99,102,241,0.3)', lineHeight: 1 }}>{h.step}</div>
                <div style={{ fontSize: 18, fontWeight: 700, margin: '12px 0 8px' }}>{h.title}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{h.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="section container">
        <div className="text-center" style={{ marginBottom: 48 }}>
          <h2 className="section-title">Multi-Language Support</h2>
          <p className="section-sub">Compete in your preferred language with topic-specific question sets.</p>
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { lang: 'Python', color: '#3b82f6', topics: 'Basics, Lists, OOP, GIL' },
            { lang: 'JavaScript', color: '#eab308', topics: 'Closures, Promises, Event Loop' },
            { lang: 'Java', color: '#f97316', topics: 'OOP, Collections, JVM, Threads' },
            { lang: 'C++', color: '#06b6d4', topics: 'Pointers, STL, Memory' },
            { lang: 'C', color: '#a855f7', topics: 'Basics, Pointers, Structs, Memory' },
            { lang: 'DBMS', color: '#6366f1', topics: 'SQL, Normalization, ACID, Locks' },
            { lang: 'DSA', color: '#ef4444', topics: 'Structures, Patterns, Graph Algos' },
            { lang: 'Operating System', color: '#6366f1', topics: 'Scheduling, Memory, Sync, Deadlocks' },
          ].map((l) => (
            <div key={l.lang} className="card card-glow" style={{ minWidth: 220, padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ marginBottom: 16 }}>
                <LanguageLogo language={l.lang} size={32} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: l.color, marginBottom: 8 }}>{l.lang}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{l.topics}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="section container">
        <div style={{ textAlign: 'center', padding: '64px 32px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.08))', border: '1px solid var(--border-glow)', borderRadius: 24 }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, marginBottom: 16, letterSpacing: -1 }}>Ready to prove your skills?</h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 36 }}>Join thousands of developers competing in real-time coding battles.</p>
          <Link to="/signup" className="btn btn-primary btn-lg">Create Free Account →</Link>
        </div>
      </section>

      <footer className="footer">
        <div className="nav-logo" style={{ display: 'inline-block', marginBottom: 8 }}>MedhaX</div>
        <p>Real-time multiplayer coding quiz platform. Built for developers, by developers.</p>
      </footer>
    </div>
  );
}

function MiniGamePreview() {
  const gridSize = 5;
  const shapesCells = new Set(['1,1','1,2','1,3','2,3','3,1','3,2']);
  const hit = new Set(['1,2','3,1']);
  const miss = new Set(['0,0','4,4']);

  return (
    <div style={{
      display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center',
      background: 'rgba(10, 15, 30, 0.6)', border: '1px solid var(--border-glow)',
      borderRadius: 24, padding: '32px 48px', backdropFilter: 'blur(16px)',
      boxShadow: '0 20px 40px -10px rgba(99,102,241,0.2)'
    }}>
      {/* Grid Side */}
      <div className="float-anim">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--indigo-light)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>Opponent's Grid</span>
          <span className="badge badge-red glow-pulse" style={{ animationDuration: '3s' }}>ATTACKING</span>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 44px)`, gap: 6,
          background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 16, border: '1px solid var(--border)'
        }}>
          {Array.from({ length: gridSize }, (_, r) =>
            Array.from({ length: gridSize }, (_, c) => {
              const k = `${r},${c}`;
              const hasShape = shapesCells.has(k);
              const isHit = hit.has(k);
              const isMiss = miss.has(k);
              return (
                <div key={k} style={{
                  width: 44, height: 44, borderRadius: 8, border: '1px solid',
                  borderColor: isHit ? 'rgba(239,68,68,0.6)' : isMiss ? 'rgba(255,255,255,0.1)' : hasShape ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.05)',
                  background: isHit ? 'rgba(239,68,68,0.2)' : isMiss ? 'rgba(255,255,255,0.02)' : hasShape ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  boxShadow: isHit ? '0 0 15px rgba(239,68,68,0.4)' : 'none',
                  transition: 'all 0.3s ease',
                  cursor: 'crosshair'
                }}>
                  {isHit ? '💥' : isMiss ? '○' : ''}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="avatar avatar-lg glow-pulse" style={{ background: 'var(--bg-primary)', border: '2px solid var(--indigo)' }}>⚔️</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>VS</div>
      </div>

      {/* Question Side */}
      <div className="float-anim" style={{ animationDelay: '1.5s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>Live Question</span>
          <span className="badge badge-green">⏱ 34s</span>
        </div>
        <div style={{
          width: 280, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden'
        }}>
          {/* Progress bar background */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--border)' }}>
            <div style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, var(--green), var(--cyan))', transition: 'width 1s linear' }} />
          </div>

          <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.6, fontWeight: 500 }}>
            What is the time complexity of binary search?
          </div>
          {['O(n)', 'O(log n)', 'O(n²)', 'O(1)'].map((opt, i) => {
            const isSelected = i === 1; // Simulate user picked correct
            return (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 8, fontSize: 13,
                background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSelected ? 'var(--green)' : 'rgba(255,255,255,0.08)'}`,
                color: isSelected ? '#8B5CF6' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: 12,
                transform: isSelected ? 'scale(1.02)' : 'none',
                boxShadow: isSelected ? '0 4px 12px rgba(99,102,241,0.2)' : 'none',
                transition: 'all 0.2s ease', cursor: 'pointer'
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', background: isSelected ? 'var(--green)' : 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? '#000' : 'var(--text-muted)',
                  fontSize: 11, fontWeight: 800
                }}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span style={{ fontWeight: isSelected ? 600 : 400 }}>{opt}</span>
                {isSelected && <span style={{ marginLeft: 'auto', fontSize: 14 }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
