import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [events, setEvents]   = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [users, setUsers]     = useState([]);
  const [tab, setTab]         = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    fetchAll();
    const interval = setInterval(fetchAll, 10000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function fetchAll() {
    try {
      const requests = [
        api.get('/dashboard/stats'),
        api.get('/dashboard/events/recent'),
        api.get('/dashboard/events/flagged'),
      ];
      if (user?.role === 'admin') requests.push(api.get('/dashboard/users'));
      const [statsRes, eventsRes, flaggedRes, usersRes] = await Promise.all(requests);
      setStats(statsRes.data);
      setEvents(eventsRes.data);
      setFlagged(flaggedRes.data);
      if (usersRes) setUsers(usersRes.data);
    } catch {
      logout(); navigate('/');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlock(username) {
    try {
      await api.patch(`/dashboard/users/${username}/unlock`);
      fetchAll();
    } catch (err) {
      alert('Unlock failed: ' + err.message);
    }
  }

  function handleLogout() { logout(); navigate('/'); }

  if (loading) return <div style={styles.loading}>Loading Sentinel Dashboard...</div>;

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <span style={styles.navLogo}>🛡️ Sentinel</span>
        <div style={styles.navRight}>
          <span style={styles.navUser}>👤 {user?.username} ({user?.role})</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Stats Cards */}
      {stats && (
        <div style={styles.statsGrid}>
          <StatCard label="Total Login Events" value={stats.total}       color="#38bdf8" />
          <StatCard label="Failed Attempts"    value={stats.failed}      color="#f87171" />
          <StatCard label="Flagged Events"     value={stats.flagged}     color="#fb923c" />
          <StatCard label="Locked Accounts"    value={stats.lockedUsers} color="#a78bfa" />
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        {['overview', 'flagged', 'risky', ...(user?.role === 'admin' ? ['users'] : [])].map(t => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.activeTab : {}) }}
            onClick={() => setTab(t)}>
            {t === 'overview' ? '📋 Recent Events' : t === 'flagged' ? '🚨 Flagged Events' : t === 'risky' ? '⚠️ Risk Report' : '👥 Users'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.content}>
        {tab === 'overview' && <EventTable events={events} />}
        {tab === 'flagged'  && <EventTable events={flagged} highlight />}
        {tab === 'risky'    && stats && <RiskReport stats={stats} />}
        {tab === 'users'    && <UsersTable users={users} onUnlock={handleUnlock} />}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...styles.card, borderTop: `3px solid ${color}` }}>
      <p style={{ ...styles.cardValue, color }}>{value}</p>
      <p style={styles.cardLabel}>{label}</p>
    </div>
  );
}

function EventTable({ events, highlight }) {
  if (!events.length) return <p style={styles.empty}>No events found.</p>;
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Username</th>
            <th style={styles.th}>IP</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Location</th>
            <th style={styles.th}>Flag Reason</th>
            <th style={styles.th}>Time</th>
          </tr>
        </thead>
        <tbody>
          {events.map(ev => (
            <tr key={ev._id} style={ev.flagged ? styles.flaggedRow : styles.row}>
              <td style={styles.td}>{ev.username}</td>
              <td style={styles.td}>{ev.ip}</td>
              <td style={styles.td}>
                <span style={ev.success ? styles.success : styles.fail}>
                  {ev.success ? '✅ Success' : '❌ Failed'}
                </span>
              </td>
              <td style={styles.td}>{ev.city}, {ev.country}</td>
              <td style={styles.td}>{ev.flagReason || '—'}</td>
              <td style={styles.td}>{new Date(ev.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RiskReport({ stats }) {
  return (
    <div style={styles.riskGrid}>
      <div style={styles.riskSection}>
        <h3 style={styles.riskTitle}>🔥 Top Risky IPs</h3>
        {stats.riskyIPs.length === 0 && <p style={styles.empty}>No risky IPs detected.</p>}
        {stats.riskyIPs.map((item, i) => (
          <div key={i} style={styles.riskItem}>
            <span style={styles.riskIP}>{item._id}</span>
            <span style={styles.riskBadge}>{item.count} failed attempts</span>
          </div>
        ))}
      </div>
      <div style={styles.riskSection}>
        <h3 style={styles.riskTitle}>👤 High Risk Users</h3>
        {stats.riskyUsers.length === 0 && <p style={styles.empty}>No high risk users.</p>}
        {stats.riskyUsers.map((u, i) => (
          <div key={i} style={styles.riskItem}>
            <span style={styles.riskIP}>{u.username}</span>
            <span style={{ ...styles.riskBadge, background: u.riskScore > 20 ? '#7f1d1d' : '#1e3a5f' }}>
              Risk: {u.riskScore} {u.isLocked ? '🔒 Locked' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTable({ users, onUnlock }) {
  if (!users.length) return <p style={styles.empty}>No users found.</p>;
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Username</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Role</th>
            <th style={styles.th}>Risk Score</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id} style={u.isLocked ? styles.flaggedRow : styles.row}>
              <td style={styles.td}>{u.username}</td>
              <td style={styles.td}>{u.email}</td>
              <td style={styles.td}>{u.role}</td>
              <td style={styles.td} >
                <span style={{ color: u.riskScore > 20 ? '#f87171' : u.riskScore > 5 ? '#fb923c' : '#4ade80', fontWeight: 'bold' }}>
                  {u.riskScore}
                </span>
              </td>
              <td style={styles.td}>
                {u.isLocked
                  ? <span style={{ color: '#f87171', fontWeight: 'bold' }}>🔒 Locked</span>
                  : <span style={{ color: '#4ade80' }}>✅ Active</span>}
              </td>
              <td style={styles.td}>
                {u.isLocked && (
                  <button style={styles.unlockBtn} onClick={() => onUnlock(u.username)}>
                    🔓 Unlock
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  page:       { minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'sans-serif' },
  loading:    { minHeight: '100vh', background: '#0f172a', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' },
  nav:        { background: '#1e293b', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' },
  navLogo:    { fontSize: '1.4rem', fontWeight: 'bold', color: '#38bdf8' },
  navRight:   { display: 'flex', alignItems: 'center', gap: '1rem' },
  navUser:    { color: '#94a3b8', fontSize: '0.9rem' },
  logoutBtn:  { background: '#f87171', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontWeight: 'bold' },
  statsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '1.5rem 2rem' },
  card:       { background: '#1e293b', borderRadius: '10px', padding: '1.2rem 1.5rem' },
  cardValue:  { fontSize: '2rem', fontWeight: 'bold', margin: 0 },
  cardLabel:  { color: '#94a3b8', margin: '0.25rem 0 0', fontSize: '0.85rem' },
  tabs:       { display: 'flex', gap: '0.5rem', padding: '0 2rem', marginBottom: '1rem' },
  tab:        { padding: '0.5rem 1.2rem', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  activeTab:  { background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', border: '1px solid #38bdf8' },
  content:    { padding: '0 2rem 2rem' },
  tableWrap:  { overflowX: 'auto', background: '#1e293b', borderRadius: '10px' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  thead:      { background: '#0f172a' },
  th:         { padding: '0.75rem 1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #334155' },
  td:         { padding: '0.75rem 1rem', borderBottom: '1px solid #1e293b', fontSize: '0.9rem', color: '#cbd5e1' },
  row:        { background: 'transparent' },
  flaggedRow: { background: '#7f1d1d22' },
  success:    { color: '#4ade80', fontWeight: 'bold' },
  fail:       { color: '#f87171', fontWeight: 'bold' },
  empty:      { color: '#94a3b8', padding: '2rem', textAlign: 'center' },
  riskGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  riskSection:{ background: '#1e293b', borderRadius: '10px', padding: '1.5rem' },
  riskTitle:  { color: '#38bdf8', marginTop: 0, marginBottom: '1rem' },
  riskItem:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #334155' },
  riskIP:     { color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.9rem' },
  riskBadge:  { background: '#1e3a5f', color: '#93c5fd', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem' },
  unlockBtn:  { background: '#4ade80', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '0.3rem 0.8rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' },
};
