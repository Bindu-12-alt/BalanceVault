import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import { UsersIcon, AccountsIcon, TransferIcon, AuditIcon, OnboardingIcon, VerifyIcon, TrendUpIcon, BankIcon, StatsIcon } from '../../components/common/Icons';

const StatCard = ({ label, value, sub, icon: Icon, iconColor, iconBg, trend }) => (
  <div className="stat-card">
    <div className={`stat-card-icon ${iconBg}`}>
      <Icon size={22} style={{ color: iconColor }} />
    </div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    {trend !== undefined && (
      <div className={`stat-trend ${trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-flat'}`}>
        {trend > 0 && <TrendUpIcon size={11} />} {sub}
      </div>
    )}
    {trend === undefined && sub && (
      <div className="stat-trend trend-flat">{sub}</div>
    )}
  </div>
);

const ActionCard = ({ to, icon: Icon, label, desc, color, badge }) => (
  <Link to={to} style={{
    display: 'flex', alignItems: 'center', gap: '1rem',
    padding: '1.1rem 1.25rem',
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)',
    color: 'inherit', textDecoration: 'none',
    transition: 'all var(--t)',
    position: 'relative',
  }}
  onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 4px 16px ${color}22`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
    <div style={{ width: 42, height: 42, borderRadius: 'var(--r-sm)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} style={{ color }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--grey-900)' }}>{label}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--grey-400)' }}>{desc}</div>
    </div>
    {badge > 0 && <span className="badge badge-red">{badge} pending</span>}
  </Link>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI.stats()
      .then((r) => setStats(r.data.data))
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard…" />;

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>System overview and management — BalanceVault TrustLedger</p>
      </div>

      <Alert type="error" message={error} />

      {stats && (
        <>
          {/* Stats */}
          <div className="stats-grid">
            <StatCard label="Total Users"      value={stats.users?.total ?? 0}         sub={`${stats.users?.active ?? 0} active`}        icon={UsersIcon}    iconColor="var(--teal)"    iconBg="icon-teal"   trend={1} />
            <StatCard label="Pending KYC"      value={stats.onboarding?.pending ?? 0}  sub="awaiting review"                              icon={OnboardingIcon} iconColor="var(--warning)" iconBg="icon-amber"  trend={stats.onboarding?.pending > 0 ? 1 : 0} />
            <StatCard label="Total Accounts"   value={stats.accounts?.total ?? 0}       sub={`${stats.accounts?.active ?? 0} active`}      icon={BankIcon}     iconColor="var(--info)"    iconBg="icon-blue"   trend={0} />
            <StatCard label="Transactions"     value={stats.transactions?.total ?? 0}   sub="completed"                                    icon={TransferIcon} iconColor="var(--success)" iconBg="icon-green"  trend={1} />
            <StatCard label="Total Volume"     value={formatCurrency(stats.transactions?.totalVolumePaise ?? 0)} sub="processed"           icon={StatsIcon}    iconColor="var(--navy-400)" iconBg="icon-blue"  trend={1} />
            <StatCard label="Audit Events"     value={stats.auditLogs?.last24Hours ?? 0} sub="last 24 hours"                               icon={AuditIcon}    iconColor="#8b5cf6"        iconBg="icon-purple" trend={0} />
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Management</div>
                <div className="card-subtitle">Quick access to all admin functions</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
              <ActionCard to="/admin/onboarding"   icon={OnboardingIcon} label="Review Onboarding"   desc="Approve or reject KYC applications"   color="var(--warning)"  badge={stats.onboarding?.pending} />
              <ActionCard to="/admin/users"        icon={UsersIcon}      label="Manage Users"        desc="View, activate or deactivate users"    color="var(--teal)" />
              <ActionCard to="/admin/accounts"     icon={AccountsIcon}   label="Manage Accounts"     desc="Monitor and update account statuses"   color="var(--info)" />
              <ActionCard to="/admin/transactions" icon={TransferIcon}   label="All Transactions"    desc="Monitor every transfer in the system"  color="var(--success)" />
              <ActionCard to="/admin/audit"        icon={AuditIcon}      label="Audit Logs"          desc="Immutable event log and security trail" color="#8b5cf6" />
              <ActionCard to="/admin/ledger"       icon={VerifyIcon}     label="Ledger Verification" desc="Verify double-entry bookkeeping integrity" color="var(--navy-400)" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
