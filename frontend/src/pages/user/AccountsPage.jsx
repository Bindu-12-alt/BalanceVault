import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { accountsAPI } from '../../services/api';
import { formatCurrency, formatDate, getErrorMessage, accountBadgeClass } from '../../utils/format';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import { PlusIcon, BankIcon, XIcon } from '../../components/common/Icons';

export default function AccountsPage() {
  const { user, refreshUser } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [accountType, setAccountType] = useState('SAVINGS');
  const isApproved = user?.onboarding?.status === 'APPROVED';

  const load = async () => {
    try {
      const res = await accountsAPI.list();
      setAccounts(res.data.data.accounts);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isApproved) load(); else setLoading(false); }, [isApproved]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true); setError('');
    try {
      await accountsAPI.create({ accountType });
      setSuccess('Account created successfully!');
      setShowCreate(false);
      await load();
      await refreshUser();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setCreating(false); }
  };

  if (loading) return <LoadingSpinner text="Loading accounts…" />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Accounts</h1>
          <p>Manage your bank accounts and balances</p>
        </div>
        {isApproved && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <PlusIcon size={16} /> Open Account
          </button>
        )}
      </div>

      <Alert type="error"   message={error}   onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {!isApproved && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔐</div>
            <h3>Verification required</h3>
            <p>Complete KYC onboarding before you can open accounts.</p>
          </div>
        </div>
      )}

      {isApproved && accounts.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏦</div>
            <h3>No accounts yet</h3>
            <p>Open your first account to start banking.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowCreate(true)}>
              <PlusIcon size={15} /> Open Account
            </button>
          </div>
        </div>
      )}

      {isApproved && accounts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {accounts.map((acc) => (
            <div key={acc.id} style={{
              background: acc.status === 'ACTIVE'
                ? 'linear-gradient(135deg, var(--navy) 0%, var(--navy-500) 100%)'
                : 'var(--white)',
              border: acc.status !== 'ACTIVE' ? '1px solid var(--border)' : 'none',
              borderRadius: 'var(--r-xl)',
              padding: '1.75rem',
              color: acc.status === 'ACTIVE' ? 'white' : 'var(--grey-700)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: acc.status === 'ACTIVE' ? 'var(--shadow-navy)' : 'var(--shadow-sm)',
              transition: 'all var(--t)',
            }}>
              {acc.status === 'ACTIVE' && (
                <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: 180, height: 180, background: 'radial-gradient(circle, rgba(0,196,180,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', position: 'relative' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className={accountBadgeClass(acc.status)}>{acc.status}</span>
                  <span className="badge badge-blue">{acc.accountType}</span>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BankIcon size={18} style={{ color: acc.status === 'ACTIVE' ? 'rgba(255,255,255,0.8)' : 'var(--grey-400)' }} />
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', opacity: 0.6 }}>
                  Current Balance
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '1.25rem' }}>
                  {formatCurrency(acc.balance)}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.08em', opacity: 0.7 }}>
                  {acc.accountNumber}
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.3rem', opacity: 0.5 }}>
                  Opened {formatDate(acc.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">Open New Account</div>
                <div className="modal-subtitle">Choose the type of account you need</div>
              </div>
              <button className="modal-close" onClick={() => setShowCreate(false)}><XIcon size={16} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Account Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {['SAVINGS', 'CURRENT'].map((type) => (
                      <label key={type} style={{
                        display: 'flex', flexDirection: 'column', gap: '0.4rem',
                        padding: '1rem',
                        border: `2px solid ${accountType === type ? 'var(--teal)' : 'var(--border)'}`,
                        borderRadius: 'var(--r)',
                        cursor: 'pointer',
                        background: accountType === type ? 'rgba(0,196,180,0.06)' : 'transparent',
                        transition: 'all var(--t)',
                      }}>
                        <input type="radio" name="accountType" value={type} checked={accountType === type} onChange={() => setAccountType(type)} className="sr-only" />
                        <span style={{ fontWeight: 700, color: 'var(--grey-900)' }}>{type}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--grey-400)' }}>
                          {type === 'SAVINGS' ? 'Best for personal savings' : 'Best for business use'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <><span className="spinner spinner-sm" /> Creating…</> : <><PlusIcon size={15} /> Open Account</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
