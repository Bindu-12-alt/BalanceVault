import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  DashboardIcon, AccountsIcon, TransferIcon, HistoryIcon, ProfileIcon,
  OnboardingIcon, UsersIcon, LedgerIcon, AuditIcon,
  StatsIcon, LogoutIcon, XIcon,
} from './Icons';

const NavItem = ({ to, icon: Icon, label, badge, onClick }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    onClick={onClick}
  >
    <Icon size={17} className="nav-icon" />
    <span>{label}</span>
    {badge > 0 && <span className="nav-badge">{badge}</span>}
  </NavLink>
);

const SidebarContent = ({ onNavigate, pendingCount = 0 }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <>
      <div className="sidebar-logo">
        <div className="logo-mark">BV</div>
        <div className="logo-text">
          <div className="logo-name">BalanceVault</div>
          <div className="logo-tagline">TrustLedger</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {isAdmin ? (
          <>
            <div className="nav-section-label">Overview</div>
            <NavItem to="/admin" icon={StatsIcon} label="Dashboard" onClick={onNavigate} />

            <div className="nav-section-label">Management</div>
            <NavItem to="/admin/users"       icon={UsersIcon}      label="Users"         onClick={onNavigate} />
            <NavItem to="/admin/onboarding"  icon={OnboardingIcon} label="Onboarding"    badge={pendingCount} onClick={onNavigate} />
            <NavItem to="/admin/accounts"    icon={AccountsIcon}   label="Accounts"      onClick={onNavigate} />
            <NavItem to="/admin/transactions"icon={TransferIcon}   label="Transactions"  onClick={onNavigate} />

            <div className="nav-section-label">Security</div>
            <NavItem to="/admin/audit"       icon={AuditIcon}      label="Audit Logs"    onClick={onNavigate} />
            <NavItem to="/admin/ledger"       icon={LedgerIcon}     label="Ledger Verify" onClick={onNavigate} />
          </>
        ) : (
          <>
            <div className="nav-section-label">Overview</div>
            <NavItem to="/dashboard"   icon={DashboardIcon}  label="Dashboard"   onClick={onNavigate} />

            <div className="nav-section-label">Banking</div>
            <NavItem to="/accounts"    icon={AccountsIcon}   label="Accounts"    onClick={onNavigate} />
            <NavItem to="/transfer"    icon={TransferIcon}   label="Transfer"    onClick={onNavigate} />
            <NavItem to="/transactions"icon={HistoryIcon}    label="History"     onClick={onNavigate} />

            <div className="nav-section-label">Account</div>
            <NavItem to="/onboarding"  icon={OnboardingIcon} label="KYC / Onboarding" onClick={onNavigate} />
            <NavItem to="/profile"     icon={ProfileIcon}    label="Profile"     onClick={onNavigate} />
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar" aria-hidden="true">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.firstName} {user?.lastName}</div>
            <div className="user-role">{user?.role?.replace('_', ' ').toLowerCase()}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Log out" aria-label="Log out">
            <LogoutIcon size={16} />
          </button>
        </div>
      </div>
    </>
  );
};

const Sidebar = ({ pendingCount }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button className="hamburger-btn" onClick={() => setOpen(true)} aria-label="Open menu">
          <span /><span /><span />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="logo-mark" style={{ width: 28, height: 28, fontSize: '0.72rem', letterSpacing: '0.06em' }}>BV</div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>BalanceVault</span>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Sidebar */}
      <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Sidebar">
        {/* Mobile close button */}
        {open && (
          <button
            onClick={() => setOpen(false)}
            style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: 'white', cursor: 'pointer', borderRadius: '6px',
              padding: '0.3rem', display: 'flex',
            }}
            aria-label="Close menu"
          >
            <XIcon size={16} />
          </button>
        )}
        <SidebarContent onNavigate={() => setOpen(false)} pendingCount={pendingCount} />
      </aside>

      {/* Overlay */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;
