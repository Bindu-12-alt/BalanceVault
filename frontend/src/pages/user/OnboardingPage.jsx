import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { onboardingAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/format';
import Alert from '../../components/common/Alert';

const ID_TYPES = ['AADHAAR', 'PAN', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE'];

const OnboardingPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    dateOfBirth: '', address: '', city: '', state: '', pincode: '',
    occupation: '', annualIncome: '', idType: 'AADHAAR', idNumber: '',
  });

  useEffect(() => {
    onboardingAPI.status()
      .then((res) => setStatus(res.data.data.onboarding?.status || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onboardingAPI.submit(form);
      setSuccess('Application submitted! Awaiting admin review.');
      await refreshUser();
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  if (status === 'PENDING') {
    return (
      <div style={{ maxWidth: 500 }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h2>Application Under Review</h2>
          <p style={{ color: 'var(--grey-500)', marginTop: '0.75rem' }}>
            Your KYC application is being reviewed. You&apos;ll be notified once it&apos;s processed.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'APPROVED') {
    return (
      <div style={{ maxWidth: 500 }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2>Onboarding Complete</h2>
          <p style={{ color: 'var(--grey-500)', marginTop: '0.75rem' }}>
            Your account is fully verified. You have access to all features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>KYC Verification</h1>
        <p style={{ color: 'var(--grey-500)' }}>Complete identity verification to unlock banking features</p>
      </div>

      {status === 'REJECTED' && (
        <Alert type="error" message="Your previous application was rejected. Please resubmit with correct information." />
      )}

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} />}

      <div className="card">
        <form onSubmit={handleSubmit} noValidate>
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--navy)', borderBottom: '1px solid var(--grey-200)', paddingBottom: '0.75rem' }}>
            Personal Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input id="fullName" name="fullName" className="form-input" value={form.fullName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="dateOfBirth">Date of Birth</label>
              <input id="dateOfBirth" name="dateOfBirth" type="date" className="form-input" value={form.dateOfBirth} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="occupation">Occupation</label>
              <input id="occupation" name="occupation" className="form-input" value={form.occupation} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="annualIncome">Annual Income (₹)</label>
              <input id="annualIncome" name="annualIncome" type="number" className="form-input" value={form.annualIncome} onChange={handleChange} required />
            </div>
          </div>

          <h3 style={{ margin: '1.25rem 0', color: 'var(--navy)', borderBottom: '1px solid var(--grey-200)', paddingBottom: '0.75rem' }}>
            Address
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="address">Street Address</label>
              <input id="address" name="address" className="form-input" value={form.address} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="city">City</label>
              <input id="city" name="city" className="form-input" value={form.city} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="state">State</label>
              <input id="state" name="state" className="form-input" value={form.state} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pincode">Pincode</label>
              <input id="pincode" name="pincode" className="form-input" value={form.pincode} onChange={handleChange} pattern="^\d{6}$" required />
            </div>
          </div>

          <h3 style={{ margin: '1.25rem 0', color: 'var(--navy)', borderBottom: '1px solid var(--grey-200)', paddingBottom: '0.75rem' }}>
            ID Verification
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="idType">ID Type</label>
              <select id="idType" name="idType" className="form-select" value={form.idType} onChange={handleChange}>
                {ID_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="idNumber">ID Number</label>
              <input id="idNumber" name="idNumber" className="form-input" value={form.idNumber} onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" style={{ marginTop: '0.75rem' }} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
