import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/format';
import { EyeIcon, EyeOffIcon, CheckIcon } from '../../components/common/Icons';
import Alert from '../../components/common/Alert';
import './AuthPages.css';

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Uppercase letter',       ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter',       ok: /[a-z]/.test(password) },
    { label: 'Number',                 ok: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;
  return (
    <div style={{ marginTop: '0.6rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem' }}>
        {[1,2,3,4].map((i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 999,
            background: i <= score ? colors[score] : 'var(--grey-200)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {checks.map((c) => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: c.ok ? 'var(--success)' : 'var(--grey-400)' }}>
            <CheckIcon size={11} /> {c.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', phone: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim())  errs.lastName = 'Required';
    if (!form.email)            errs.email = 'Email is required';
    if (form.password.length < 8) errs.password = 'At least 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) errs.password = 'Must include uppercase, lowercase, number';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await authAPI.register({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName, phone: form.phone || undefined });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="auth-layout">
      <div className="auth-brand" style={{ background: 'linear-gradient(145deg, #0a1628 0%, #1a3a5c 100%)' }}>
        <div className="auth-brand-logo">
          <div className="auth-brand-mark"><span>BV</span></div>
          <div><div className="auth-brand-name">BalanceVault</div><div className="auth-brand-tagline">TrustLedger</div></div>
        </div>
        <div className="auth-brand-content">
          <h2 className="auth-brand-headline">Your journey<br /><span>starts here.</span></h2>
        </div>
        <div className="auth-brand-footer">© 2026 BalanceVault • TrustLedger</div>
      </div>
      <div className="auth-form-panel">
        <div className="auth-form-box">
          <div className="auth-form-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div className="auth-success-icon">✅</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Account created!</h2>
            <p style={{ color: 'var(--grey-400)', marginBottom: '1.5rem' }}>Redirecting you to sign in…</p>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-layout">
      {/* Brand */}
      <div className="auth-brand">
        <div className="auth-brand-logo">
          <div className="auth-brand-mark"><span>BV</span></div>
          <div><div className="auth-brand-name">BalanceVault</div><div className="auth-brand-tagline">TrustLedger</div></div>
        </div>
        <div className="auth-brand-content">
          <div className="auth-trust-badges">
            <span>Private banking</span>
            <span>Verified flows</span>
          </div>
          <h2 className="auth-brand-headline">Open your<br /><span>financial future.</span></h2>
          <p className="auth-brand-desc">Join customers managing wealth, transfers, and account activity with clarity, confidence, and security.</p>
          <div className="auth-brand-stats">
            <div className="auth-stat-box"><strong>24/7</strong><span>account visibility</span></div>
            <div className="auth-stat-box"><strong>Bank-grade</strong><span>security controls</span></div>
            <div className="auth-stat-box"><strong>Zero</strong><span>hidden fees</span></div>
          </div>
          <div className="auth-brand-features">
            {['Free to register','No hidden fees','Enterprise security','Instant onboarding','24/7 transaction history'].map((f) => (
              <div className="auth-feature" key={f}><div className="auth-feature-dot" />{f}</div>
            ))}
          </div>
        </div>
        <div className="auth-brand-footer">© 2026 BalanceVault • TrustLedger</div>
      </div>

      {/* Form */}
      <div className="auth-form-panel">
        <div className="auth-form-box" style={{ maxWidth: 480 }}>
          <div className="auth-form-header">
            <h1 className="auth-form-title">Create account</h1>
            <p className="auth-form-sub">Fill in your details to get started</p>
          </div>

          <div className="auth-form-card">
            <Alert type="error" message={serverError} onClose={() => setServerError('')} />

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="firstName">First name</label>
                  <input id="firstName" name="firstName" type="text" className={`form-input${errors.firstName ? ' error' : ''}`}
                    value={form.firstName} onChange={handle} placeholder="Ravi" required />
                  {errors.firstName && <p className="form-error">{errors.firstName}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lastName">Last name</label>
                  <input id="lastName" name="lastName" type="text" className={`form-input${errors.lastName ? ' error' : ''}`}
                    value={form.lastName} onChange={handle} placeholder="Sharma" required />
                  {errors.lastName && <p className="form-error">{errors.lastName}</p>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email address</label>
                <input id="reg-email" name="email" type="email" className={`form-input${errors.email ? ' error' : ''}`}
                  value={form.email} onChange={handle} placeholder="ravi@example.com" required autoComplete="email" />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone number <span style={{ color: 'var(--grey-400)', fontWeight: 400 }}>(optional)</span></label>
                <input id="phone" name="phone" type="tel" className="form-input"
                  value={form.phone} onChange={handle} placeholder="+91 98765 43210" autoComplete="tel" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-password">Password</label>
                  <div className="password-wrapper">
                    <input id="reg-password" name="password" type={showPass ? 'text' : 'password'}
                      className={`form-input${errors.password ? ' error' : ''}`}
                      value={form.password} onChange={handle} placeholder="Min. 8 characters" required
                      style={{ paddingRight: '2.75rem' }} />
                    <button type="button" className="password-toggle" onClick={() => setShowPass((s) => !s)} aria-label="Toggle password">
                      {showPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="form-error">{errors.password}</p>}
                  <PasswordStrength password={form.password} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
                  <input id="confirmPassword" name="confirmPassword" type="password"
                    className={`form-input${errors.confirmPassword ? ' error' : ''}`}
                    value={form.confirmPassword} onChange={handle} placeholder="Repeat password" required />
                  {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-xl w-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
                {loading ? <><span className="spinner spinner-sm" /> Creating account…</> : 'Create account'}
              </button>
            </form>
          </div>

          <p className="auth-footer-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
