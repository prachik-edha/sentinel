import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [form, setForm]     = useState({ username: '', email: '', password: '' });
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setSuccess('Registered! Redirecting to login...');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>🛡️ Sentinel</h1>
        <p style={styles.sub}>Create your account</p>
        <form onSubmit={handleSubmit}>
          <input style={styles.input} placeholder="Username" value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })} required />
          <input style={styles.input} placeholder="Email" type="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} required />
          {error   && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={styles.link}>
          Already have an account?{' '}
          <span style={styles.anchor} onClick={() => navigate('/')}>Login</span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card:      { background: '#1e293b', padding: '2.5rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 30px rgba(0,0,0,0.5)' },
  logo:      { color: '#38bdf8', textAlign: 'center', fontSize: '2rem', marginBottom: '0.25rem' },
  sub:       { color: '#94a3b8', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' },
  input:     { display: 'block', width: '100%', padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: '1rem', boxSizing: 'border-box' },
  btn:       { width: '100%', padding: '0.75rem', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' },
  error:     { color: '#f87171', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' },
  success:   { color: '#4ade80', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' },
  link:      { color: '#94a3b8', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' },
  anchor:    { color: '#38bdf8', cursor: 'pointer' },
};
