import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatDate, onboardingBadgeClass } from '../../utils/format';
import { ShieldIcon } from '../../components/common/Icons';

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  const ob = user.onboarding;
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div>
      <div className="page-header">
        <h1>Profile</h1>
        <p>Your personal and account information</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Identity card */}
        <div className="card">
          <div style={{ textAlign: 'center', padding: '1rem 0 1.5rem' }}>
            <div style={{
              width: 80, height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-500) 100%)',
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem', fontWeight: 700,
              margin: '0 auto 1rem',
              boxShadow: 'var(--shadow-navy)',
            }}>
              {initials}
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {user.firstName} {user.lastName}
            </h2>
            <p style={{ color: 'var(--grey-400)', fontSize: '0.875rem' }}>{user.email}</p>
            <div style={{ marginTop: '0.75rem' }}>
              <span className="badge badge-blue">{user.role?.replace('_', ' ')}</span>
            </div>
          </div>

          <hr className="divider" />

          <div>
            {[
              ['Phone',       user.phone || 'Not provided'],
              ['Member since', formatDate(user.createdAt)],
            ].map(([label, value]) => (
              <div className="info-row" key={label}>
                <span className="info-label">{label}</span>
                <span className="info-value" style={{ fontSize: '0.875rem' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* KYC Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">KYC Verification</div>
                <div className="card-subtitle">Identity verification status</div>
              </div>
              <ShieldIcon size={20} style={{ color: ob?.status === 'APPROVED' ? 'var(--success)' : 'var(--grey-300)' }} />
            </div>

            {!ob ? (
              <div>
                <div className="status-banner info" style={{ marginBottom: '1rem' }}>
                  <div className="status-banner-icon">📋</div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--grey-900)', marginBottom: '0.25rem' }}>Not started</div>
                    <p style={{ color: 'var(--grey-500)', fontSize: '0.875rem' }}>Complete verification to unlock all banking features.</p>
                  </div>
                </div>
                <Link to="/onboarding" className="btn btn-primary btn-sm">Start verification</Link>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span className={onboardingBadgeClass(ob.status)}>{ob.status}</span>
                  {ob.status === 'APPROVED' && <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>✓ Fully verified</span>}
                </div>

                <div>
                  {ob.reviewNote && (
                    <div className="info-row">
                      <span className="info-label">Review note</span>
                      <span className="info-value" style={{ fontSize: '0.85rem', textAlign: 'right', maxWidth: '65%' }}>{ob.reviewNote}</span>
                    </div>
                  )}
                  {ob.reviewedAt && (
                    <div className="info-row">
                      <span className="info-label">Reviewed on</span>
                      <span className="info-value" style={{ fontSize: '0.85rem' }}>{formatDate(ob.reviewedAt)}</span>
                    </div>
                  )}
                </div>

                {ob.status === 'REJECTED' && (
                  <Link to="/onboarding" className="btn btn-sm" style={{ background: 'var(--error)', color: 'white', marginTop: '0.75rem', display: 'inline-flex' }}>
                    Resubmit application
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Security info */}
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-500) 100%)', border: 'none', color: 'white' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', background: 'rgba(0,196,180,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldIcon size={22} style={{ color: 'var(--teal)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Account Security</div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  Your account is protected with bcrypt password hashing, JWT authentication, and full audit logging.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
