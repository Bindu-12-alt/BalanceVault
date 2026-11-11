import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  if (!user) return null;

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="navbar-brand">
          <span className="brand-icon">🏦</span>
          <span className="brand-name">BalanceVault</span>
          {isAdmin && <span className="brand-badge">Admin</span>}
        </Link>

        {/* Desktop nav */}
        <div className="navbar-links">
          {isAdmin ? (
            <>
              <Link className={`nav-link ${isActive('/admin') ? 'active' : ''}`} to="/admin">Dashboard</Link>
              <Link className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`} to="/admin/users">Users</Link>
              <Link className={`nav-link ${isActive('/admin/onboarding') ? 'active' : ''}`} to="/admin/onboarding">Onboarding</Link>
              <Link className={`nav-link ${isActive('/admin/accounts') ? 'active' : ''}`} to="/admin/accounts">Accounts</Link>
              <Link className={`nav-link ${isActive('/admin/transactions') ? 'active' : ''}`} to="/admin/transactions">Transactions</Link>
              <Link className={`nav-link ${isActive('/admin/audit') ? 'active' : ''}`} to="/admin/audit">Audit Logs</Link>
              <Link className={`nav-link ${isActive('/admin/ledger') ? 'active' : ''}`} to="/admin/ledger">Ledger</Link>
            </>
          ) : (
            <>
              <Link className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} to="/dashboard">Dashboard</Link>
              <Link className={`nav-link ${isActive('/accounts') ? 'active' : ''}`} to="/accounts">Accounts</Link>
              <Link className={`nav-link ${isActive('/transfer') ? 'active' : ''}`} to="/transfer">Transfer</Link>
              <Link className={`nav-link ${isActive('/transactions') ? 'active' : ''}`} to="/transactions">History</Link>
              <Link className={`nav-link ${isActive('/profile') ? 'active' : ''}`} to="/profile">Profile</Link>
            </>
          )}
        </div>

        <div className="navbar-user">
          <span className="user-name">{user.firstName} {user.lastName}</span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout} aria-label="Log out">
            Log out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar-mobile">
          {isAdmin ? (
            <>
              <Link className="nav-link-mobile" to="/admin" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link className="nav-link-mobile" to="/admin/users" onClick={() => setMenuOpen(false)}>Users</Link>
              <Link className="nav-link-mobile" to="/admin/onboarding" onClick={() => setMenuOpen(false)}>Onboarding</Link>
              <Link className="nav-link-mobile" to="/admin/accounts" onClick={() => setMenuOpen(false)}>Accounts</Link>
              <Link className="nav-link-mobile" to="/admin/transactions" onClick={() => setMenuOpen(false)}>Transactions</Link>
              <Link className="nav-link-mobile" to="/admin/audit" onClick={() => setMenuOpen(false)}>Audit Logs</Link>
              <Link className="nav-link-mobile" to="/admin/ledger" onClick={() => setMenuOpen(false)}>Ledger</Link>
            </>
          ) : (
            <>
              <Link className="nav-link-mobile" to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link className="nav-link-mobile" to="/accounts" onClick={() => setMenuOpen(false)}>Accounts</Link>
              <Link className="nav-link-mobile" to="/transfer" onClick={() => setMenuOpen(false)}>Transfer</Link>
              <Link className="nav-link-mobile" to="/transactions" onClick={() => setMenuOpen(false)}>History</Link>
              <Link className="nav-link-mobile" to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
            </>
          )}
          <button className="btn btn-secondary btn-sm" style={{ margin: '0.5rem 1rem' }} onClick={handleLogout}>Log out</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
