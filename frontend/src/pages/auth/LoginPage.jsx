import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/format';
import { EyeIcon, EyeOffIcon } from '../../components/common/Icons';
import Alert from '../../components/common/Alert';
import './AuthPages.css';

const BrandPanel = () => (
  <div className="auth-brand">
    <div className="auth-brand-logo">
      <div className="auth-brand-mark"><span>BV</span></div>
      <div>
        <div className="auth-brand-name">BalanceVault</div>
        <div className="auth-brand-tagline">TrustLedger</div>
      </div>
    </div>

    <div className="auth-brand-content">
      <div className="auth-trust-badges">
        <span>Enterprise-ready</span>
        <span>Audit-grade controls</span>
      </div>

      <h2 className="auth-brand-headline">
        Banking operations built<br /><span>for modern trust.</span>
      </h2>
      <p className="auth-brand-desc">
        Secure financial management with verified ledger integrity, real-time transfers,
        and role-based access built for risk-aware teams and customers.
      </p>

      <div className="auth-brand-stats">
        <div className="auth-stat-box">
          <strong>99.99%</strong>
          <span>system uptime</span>
        </div>
        <div className="auth-stat-box">
          <strong>24/7</strong>
          <span>transaction visibility</span>
        </div>
        <div className="auth-stat-box">
          <strong>256-bit</strong>
          <span>secure architecture</span>
        </div>
      </div>

      <div className="auth-brand-features">
        {[
          'End-to-end encrypted transactions',
          'Double-entry ledger verification',
          'Granular role-based permissions',
          'Continuous audit logging',
          'Idempotent transfer protection',
        ].map((f) => (
          <div className="auth-feature" key={f}>
            <div className="auth-feature-dot" />
            {f}
          </div>
        ))}
      </div>
    </div>

    <div className="auth-brand-footer">© 2026 BalanceVault • TrustLedger</div>
  </div>
);

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields'); return; }
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <BrandPanel />

      <div className="auth-form-panel">
        <div className="auth-form-box">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Welcome back</h1>
            <p className="auth-form-sub">Sign in to your BalanceVault account</p>
          </div>

          <div className="auth-form-card">
            <Alert type="error" message={error} onClose={() => setError('')} />

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email address</label>
                <input
                  id="email" name="email" type="email"
                  className="form-input"
                  value={form.email} onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email" autoFocus required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                </div>
                <div className="password-wrapper">
                  <input
                    id="password" name="password"
                    type={showPass ? 'text' : 'password'}
                    className="form-input"
                    value={form.password} onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password" required
                    style={{ paddingRight: '2.75rem' }}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPass((s) => !s)} aria-label={showPass ? 'Hide password' : 'Show password'}>
                    {showPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-xl w-full"
                style={{ marginTop: '0.5rem' }}
                disabled={loading}
                aria-busy={loading}
              >
                {loading
                  ? <><span className="spinner spinner-sm" /> Signing in…</>
                  : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="auth-footer-link">
            Don&apos;t have an account?{' '}
            <Link to="/register">Create account</Link>
          </p>

          {/* Demo credentials */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(0,196,180,0.06)',
            border: '1px solid rgba(0,196,180,0.2)',
            borderRadius: 'var(--r)',
            fontSize: '0.78rem',
            color: 'var(--grey-500)',
          }}>
            <div style={{ fontWeight: 700, color: 'var(--grey-700)', marginBottom: '0.5rem' }}>Demo Credentials</div>
            <div style={{ display: 'grid', gap: '0.3rem' }}>
              <div><span style={{ color: 'var(--grey-400)' }}>Admin:</span> admin@balancevault.internal / Admin@12345</div>
              <div><span style={{ color: 'var(--grey-400)' }}>User:</span> alice@example.com / Alice@12345</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
