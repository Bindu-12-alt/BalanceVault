import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { accountsAPI } from '../../services/api';
import { formatCurrency, formatDateTime, txBadgeClass, accountBadgeClass } from '../../utils/format';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import { TransferIcon, PlusIcon, HistoryIcon, AccountsIcon, ArrowRightIcon, TrendUpIcon, BankIcon } from '../../components/common/Icons';

const QuickAction = ({ to, icon: Icon, label, color }) => (
  <Link to={to} style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
    padding: '1.25rem 1rem',
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)',
    color: 'var(--grey-700)',
    fontWeight: 600,
    fontSize: '0.82rem',
    transition: 'all var(--t)',
    textDecoration: 'none',
    flex: 1,
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.borderColor = color;
    e.currentTarget.style.boxShadow = `0 4px 16px ${color}22`;
    e.currentTarget.style.transform = 'translateY(-2px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = 'var(--border)';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.transform = 'translateY(0)';
  }}>
    <div style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={20} style={{ color }} />
    </div>
    {label}
  </Link>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const obStatus = user?.onboarding?.status;
  const isApproved = obStatus === 'APPROVED';
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE');

  useEffect(() => {
    if (!isApproved) { setLoading(false); return; }
    (async () => {
      try {
        const accRes = await accountsAPI.list();
        const accs = accRes.data.data.accounts;
        setAccounts(accs);
        const active = accs.find((a) => a.status === 'ACTIVE');
        if (active) {
          const txRes = await accountsAPI.transactions(active.id, { limit: 6 });
          setRecentTx(txRes.data.data.transactions || []);
        }
      } catch { setError('Could not load dashboard data'); }
      finally { setLoading(false); }
    })();
  }, [isApproved]);

  if (loading) return <LoadingSpinner text="Loading your dashboard…" />;

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.firstName}! Here's your financial overview.</p>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {/* Onboarding banners */}
      {!obStatus && (
        <div className="status-banner info" style={{ marginBottom: '1.75rem' }}>
          <div className="status-banner-icon">📋</div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--grey-900)', marginBottom: '0.3rem' }}>Complete your KYC verification</div>
            <p style={{ color: 'var(--grey-600)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              Verify your identity to unlock account creation and money transfers.
            </p>
            <Link to="/onboarding" className="btn btn-primary btn-sm">Start verification</Link>
          </div>
        </div>
      )}

      {obStatus === 'PENDING' && (
        <div className="status-banner pending" style={{ marginBottom: '1.75rem' }}>
          <div className="status-banner-icon">⏳</div>
          <div>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '0.3rem' }}>Application under review</div>
            <p style={{ color: '#78350f', fontSize: '0.875rem' }}>
              Your KYC application is being reviewed by our team. You'll be notified once approved.
            </p>
          </div>
        </div>
      )}

      {obStatus === 'REJECTED' && (
        <div className="status-banner rejected" style={{ marginBottom: '1.75rem' }}>
          <div className="status-banner-icon">❌</div>
          <div>
            <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '0.3rem' }}>Verification rejected</div>
            <p style={{ color: '#7f1d1d', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              {user?.onboarding?.reviewNote || 'Your application was rejected. Please resubmit with accurate information.'}
            </p>
            <Link to="/onboarding" className="btn btn-sm" style={{ background: 'var(--error)', color: 'white' }}>Resubmit application</Link>
          </div>
        </div>
      )}

      {isApproved && (
        <>
          {/* Balance Hero + Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem', alignItems: 'stretch' }}>
            {/* Hero balance card */}
            <div className="balance-card">
              <div className="balance-label">Total Portfolio Balance</div>
              <div className="balance-amount">
                <span className="balance-currency">₹</span>
                {(totalBalance / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="balance-sub">{activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''}</div>
              <div className="balance-card-actions">
                <Link to="/transfer" className="btn-teal-solid">
                  <TransferIcon size={15} /> Transfer
                </Link>
                <Link to="/accounts" className="btn-glass">
                  <AccountsIcon size={15} /> Accounts
                </Link>
              </div>
            </div>

            {/* Stat: Active Accounts */}
            <div className="stat-card">
              <div className="stat-card-icon icon-teal">
                <BankIcon size={22} style={{ color: 'var(--teal)' }} />
              </div>
              <div className="stat-label">Accounts</div>
              <div className="stat-value">{accounts.length}</div>
              <div className="stat-trend trend-flat">{activeAccounts.length} active</div>
            </div>

            {/* Stat: Recent Transactions */}
            <div className="stat-card">
              <div className="stat-card-icon icon-blue">
                <HistoryIcon size={22} style={{ color: 'var(--info)' }} />
              </div>
              <div className="stat-label">Transactions</div>
              <div className="stat-value">{recentTx.length}</div>
              <div className="stat-trend trend-up"><TrendUpIcon size={12} /> Recent</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ marginBottom: '1.75rem' }}>
            <div className="card-header">
              <div>
                <div className="card-title">Quick Actions</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <QuickAction to="/transfer"    icon={TransferIcon}  label="Send Money"       color="var(--teal)" />
              <QuickAction to="/accounts"    icon={PlusIcon}      label="New Account"      color="var(--info)" />
              <QuickAction to="/transactions"icon={HistoryIcon}   label="Transaction Log"  color="var(--warning)" />
              <QuickAction to="/profile"     icon={AccountsIcon}  label="View Profile"     color="var(--success)" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
            {/* Accounts */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">My Accounts</div>
                  <div className="card-subtitle">{accounts.length} total account{accounts.length !== 1 ? 's' : ''}</div>
                </div>
                <Link to="/accounts" className="btn btn-ghost btn-sm" style={{ gap: '4px' }}>
                  View all <ArrowRightIcon size={14} />
                </Link>
              </div>

              {accounts.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <div className="empty-state-icon">🏦</div>
                  <h3>No accounts yet</h3>
                  <p>Open your first account to start banking.</p>
                  <Link to="/accounts" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>Open account</Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {accounts.map((acc) => (
                    <div key={acc.id} className="account-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <span className={accountBadgeClass(acc.status)}>{acc.status}</span>
                            <span className="badge badge-blue">{acc.accountType}</span>
                          </div>
                          <div className="account-number">{acc.accountNumber}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--grey-400)', marginBottom: '0.2rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance</div>
                          <div className="account-balance">{formatCurrency(acc.balance)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Recent Transactions</div>
                  <div className="card-subtitle">Latest activity</div>
                </div>
                <Link to="/transactions" className="btn btn-ghost btn-sm" style={{ gap: '4px' }}>
                  View all <ArrowRightIcon size={14} />
                </Link>
              </div>

              {recentTx.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <div className="empty-state-icon">💳</div>
                  <h3>No transactions yet</h3>
                  <p>Your activity will appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {recentTx.map((tx, i) => {
                    const isCredit = accounts.some((a) => a.id === tx.toAccountId);
                    return (
                      <div key={tx.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.9rem',
                        padding: '0.9rem 0',
                        borderBottom: i < recentTx.length - 1 ? '1px solid var(--border-light)' : 'none',
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 'var(--r-sm)',
                          background: isCredit ? 'var(--success-bg)' : 'var(--error-bg)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <TransferIcon size={16} style={{ color: isCredit ? 'var(--success)' : 'var(--error)' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--grey-900)', marginBottom: '2px' }}>
                            {tx.description || (isCredit ? 'Money received' : 'Money sent')}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--grey-400)' }}>
                            {formatDateTime(tx.createdAt)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isCredit ? 'var(--success)' : 'var(--error)' }}>
                            {isCredit ? '+' : '−'}{formatCurrency(tx.amount)}
                          </div>
                          <div style={{ marginTop: '2px' }}>
                            <span className={txBadgeClass(tx.status)}>{tx.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
