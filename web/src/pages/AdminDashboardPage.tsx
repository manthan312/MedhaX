import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

interface DashboardStats {
  summary: {
    totalVisits: number;
    totalGames: number;
    totalUsers: number;
    totalReviews: number;
    averageRating: number;
  };
  graphs: {
    visitsDaily: { date: string; count: number }[];
    gamesDaily: { date: string; count: number }[];
    usersDaily: { date: string; count: number }[];
    ratingDistribution: { stars: number; count: number }[];
  };
  reviews: {
    matchId: string;
    rating: number;
    comment: string;
    createdAt: string;
    username: string;
  }[];
}

export default function AdminDashboardPage() {
  const { token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080') + '/api';
        const res = await axios.get(`${apiBase}/analytics/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err: any) {
        console.error('Failed to fetch admin stats:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard statistics.');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchStats();
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper component to render SVG Line/Area Chart (for daily visits)
  const SvgAreaChart = ({ data, color, gradientId }: { data: { date: string; count: number }[]; color: string; gradientId: string }) => {
    if (data.length === 0) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No data available</div>;

    const width = 500;
    const height = 180;
    const padding = 30;

    const counts = data.map(d => d.count);
    const maxVal = Math.max(...counts, 5);
    const minVal = 0;

    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
      const y = height - padding - ((d.count - minVal) / (maxVal - minVal)) * (height - padding * 2);
      return { x, y, ...d };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const closedPathD = points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
            <stop offset="100%" stopColor={color} stopOpacity="0.0"/>
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.08)" />

        {/* Area */}
        {closedPathD && <path d={closedPathD} fill={`url(#${gradientId})`} />}

        {/* Line */}
        {pathD && <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-card)" stroke={color} strokeWidth="2.5" />
            <title>{`${p.date}: ${p.count}`}</title>
          </g>
        ))}

        {/* Labels */}
        <text x={padding} y={height - 8} fill="var(--text-muted)" fontSize="9">{data[0]?.date.split('-').slice(1).join('/')}</text>
        <text x={width - padding} y={height - 8} textAnchor="end" fill="var(--text-muted)" fontSize="9">{data[data.length - 1]?.date.split('-').slice(1).join('/')}</text>
        <text x={padding - 5} y={padding + 4} textAnchor="end" fill="var(--text-muted)" fontSize="9">{maxVal}</text>
        <text x={padding - 5} y={height - padding + 4} textAnchor="end" fill="var(--text-muted)" fontSize="9">0</text>
      </svg>
    );
  };

  // Helper component to render SVG Bar Chart (for daily games or users)
  const SvgBarChart = ({ data, color }: { data: { date: string; count: number }[]; color: string }) => {
    if (data.length === 0) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No data available</div>;

    const width = 500;
    const height = 180;
    const padding = 30;

    const counts = data.map(d => d.count);
    const maxVal = Math.max(...counts, 5);

    const barWidth = ((width - padding * 2) / data.length) * 0.7;
    const gap = ((width - padding * 2) / data.length) * 0.3;

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Grid Lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.08)" />

        {data.map((d, i) => {
          const x = padding + i * (barWidth + gap) + gap / 2;
          const barHeight = (d.count / maxVal) * (height - padding * 2);
          const y = height - padding - barHeight;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={Math.max(barWidth, 2)}
                height={Math.max(barHeight, 2)}
                fill={color}
                rx="2"
              />
              <title>{`${d.date}: ${d.count}`}</title>
            </g>
          );
        })}

        {/* Labels */}
        <text x={padding} y={height - 8} fill="var(--text-muted)" fontSize="9">{data[0]?.date.split('-').slice(1).join('/')}</text>
        <text x={width - padding} y={height - 8} textAnchor="end" fill="var(--text-muted)" fontSize="9">{data[data.length - 1]?.date.split('-').slice(1).join('/')}</text>
        <text x={padding - 5} y={padding + 4} textAnchor="end" fill="var(--text-muted)" fontSize="9">{maxVal}</text>
        <text x={padding - 5} y={height - padding + 4} textAnchor="end" fill="var(--text-muted)" fontSize="9">0</text>
      </svg>
    );
  };

  // Helper component to render SVG Rating Distribution
  const SvgRatingChart = ({ data, color }: { data: { stars: number; count: number }[]; color: string }) => {
    const width = 500;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 80;
    const paddingTop = 15;
    const paddingBottom = 15;

    const counts = data.map(d => d.count);
    const maxVal = Math.max(...counts, 1);
    const rowHeight = (height - paddingTop - paddingBottom) / 5;

    // Ordered 5 stars down to 1 star
    const sortedData = [...data].sort((a, b) => b.stars - a.stars);

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {sortedData.map((d, i) => {
          const y = paddingTop + i * rowHeight + (rowHeight - 10) / 2;
          const fillWidth = (d.count / maxVal) * (width - paddingLeft - paddingRight);

          return (
            <g key={i}>
              <text x={10} y={y + 9} fill="var(--yellow)" fontSize="11" fontWeight="700">
                {d.stars} ★
              </text>

              {/* Background Track */}
              <rect
                x={paddingLeft}
                y={y}
                width={width - paddingLeft - paddingRight}
                height="8"
                fill="rgba(255, 255, 255, 0.03)"
                rx="4"
              />

              {/* Filled Track */}
              <rect
                x={paddingLeft}
                y={y}
                width={fillWidth}
                height="8"
                fill={color}
                rx="4"
              />

              {/* Value Label */}
              <text x={width - paddingRight + 8} y={y + 9} fill="var(--text-secondary)" fontSize="11">
                {d.count} {d.count === 1 ? 'review' : 'reviews'}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="spinner spinner-lg" style={{ marginBottom: 16 }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading admin console...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="card text-center" style={{ maxWidth: 400, width: '100%' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Access Error</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>{error || 'Stats not available.'}</p>
          <button className="btn btn-primary w-full" onClick={handleLogout}>Back to Login</button>
        </div>
      </div>
    );
  }

  const { summary, graphs, reviews } = stats;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 60 }}>
      {/* Header bar */}
      <header className="navbar" style={{ padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="nav-logo" style={{ fontSize: 24 }}>MedhaX</span>
          <span className="badge badge-indigo" style={{ padding: '4px 12px', fontSize: 11 }}>ADMIN CONSOLE</span>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm">
          Sign Out
        </button>
      </header>

      <main className="container" style={{ marginTop: 40, padding: '0 40px' }}>
        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>System Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Real-time statistics on website visits, matches played, registrations, and user feedback.</p>
        </div>

        {/* Summary Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginBottom: 40 }}>
          <div className="card card-glow" style={{ padding: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: 'var(--indigo-light)' }}>
              {summary.totalUsers}
            </div>
            <div className="score-label" style={{ fontSize: 11, textAlign: 'left', marginTop: 4 }}>Total Registered Users</div>
          </div>

          <div className="card card-glow" style={{ padding: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚔️</div>
            <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: 'var(--purple)' }}>
              {summary.totalGames}
            </div>
            <div className="score-label" style={{ fontSize: 11, textAlign: 'left', marginTop: 4 }}>Total Games Played</div>
          </div>

          <div className="card card-glow" style={{ padding: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🌐</div>
            <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: 'var(--cyan)' }}>
              {summary.totalVisits}
            </div>
            <div className="score-label" style={{ fontSize: 11, textAlign: 'left', marginTop: 4 }}>Website Page Views</div>
          </div>

          <div className="card card-glow" style={{ padding: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⭐</div>
            <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: 'var(--yellow)' }}>
              {summary.averageRating} <span style={{ fontSize: 18, color: 'var(--text-secondary)' }}>/ 5</span>
            </div>
            <div className="score-label" style={{ fontSize: 11, textAlign: 'left', marginTop: 4 }}>Average Rating ({summary.totalReviews} reviews)</div>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(48%, 1fr))', gap: 28, marginBottom: 48 }}>
          {/* Chart 1: Website Visits */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Website User Visits (Last 30 Days)</h3>
            <div style={{ height: 200, padding: '10px 0' }}>
              <SvgAreaChart data={graphs.visitsDaily} color="var(--cyan)" gradientId="visitsGrad" />
            </div>
          </div>

          {/* Chart 2: Daily Games */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Daily Games Played (Last 30 Days)</h3>
            <div style={{ height: 200, padding: '10px 0' }}>
              <SvgBarChart data={graphs.gamesDaily} color="var(--purple)" />
            </div>
          </div>

          {/* Chart 3: User Registrations */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>New User Registrations (Last 30 Days)</h3>
            <div style={{ height: 200, padding: '10px 0' }}>
              <SvgBarChart data={graphs.usersDaily} color="var(--indigo)" />
            </div>
          </div>

          {/* Chart 4: Rating Distribution */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>User Ratings Distribution</h3>
            <div style={{ height: 200, padding: '10px 0' }}>
              <SvgRatingChart data={graphs.ratingDistribution} color="var(--yellow)" />
            </div>
          </div>
        </div>

        {/* Reviews Feed */}
        <div className="card">
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>User Feedback & Reviews</h3>
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 0' }}>No reviews submitted yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}>USER</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}>RATING</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}>COMMENT</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 14 }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: 'var(--indigo-light)' }}>
                        {r.username}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--yellow)', fontWeight: 700 }}>
                        {'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-primary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.comment || <em style={{ color: 'var(--text-muted)' }}>No written comment</em>}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: 12 }}>
                        {new Date(r.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
