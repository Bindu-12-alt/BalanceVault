import React from 'react';
import { Link } from 'react-router-dom';
import '../auth/AuthPages.css';

const metrics = [
  { label: 'Portfolio balance', value: '₹18,42,560', tone: 'teal' },
  { label: 'Monthly inflow', value: '₹3,24,180', tone: 'blue' },
  { label: 'Transaction velocity', value: '1,280', tone: 'green' },
];

const features = [
  { title: 'Secure account operations', text: 'Manage current, savings, and multi-role account access with audit-ready controls.' },
  { title: 'Real-time visibility', text: 'Track balances, transfers, and payment history across the full customer lifecycle.' },
  { title: 'KYC-first onboarding', text: 'Guide every customer through controlled onboarding and verification workflows.' },
  { title: 'Financial-grade oversight', text: 'Keep admins in control with transaction monitoring, audit events, and ledger checks.' },
];

const steps = [
  { number: '01', title: 'Create your profile', text: 'Open your trusted account with secure onboarding and identity verification.' },
  { number: '02', title: 'Add your accounts', text: 'Create savings and payment accounts with clear balances and account status.' },
  { number: '03', title: 'Transfer with confidence', text: 'Initiate transfers, monitor activity, and keep every action traceable.' },
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-brand">
          <div className="landing-brand-mark">BV</div>
          <div>
            <div className="landing-brand-name">BalanceVault</div>
            <div className="landing-brand-tag">TrustLedger</div>
          </div>
        </div>

        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#security">Security</a>
        </nav>

        <div className="landing-actions">
          <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-copy">
            <div className="eyebrow">Banking infrastructure for modern teams</div>
            <h1>Financial clarity designed for trust, speed, and growth.</h1>
            <p>
              BalanceVault helps customers and administrators manage accounts, run secure transfers,
              and monitor activity with full audit visibility in one enterprise-ready platform.
            </p>

            <div className="landing-cta-row">
              <Link to="/register" className="btn btn-primary btn-lg">Open account</Link>
              <Link to="/login" className="btn btn-outline btn-lg">Explore portal</Link>
            </div>

            <div className="landing-trust-row">
              <span>PCI-aware architecture</span>
              <span>Role-based access</span>
              <span>Ledger integrity</span>
            </div>
          </div>

          <div className="landing-visual">
            <div className="portfolio-panel">
              <div className="portfolio-head">
                <span>Portfolio overview</span>
                <span className="live-pill">Live</span>
              </div>

              <div className="portfolio-balance">₹ 18,42,560</div>
              <div className="portfolio-change positive">+12.6% this quarter</div>

              <div className="mini-stats">
                {metrics.map((item) => (
                  <div key={item.label} className={`mini-stat ${item.tone}`}>
                    <label>{item.label}</label>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>

              <div className="faint-chart" aria-hidden="true">
                <span className="bar one" />
                <span className="bar two" />
                <span className="bar three" />
                <span className="bar four" />
                <span className="bar five" />
                <span className="bar six" />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="landing-section">
          <div className="section-heading">
            <span className="eyebrow">Why teams choose BalanceVault</span>
            <h2>Built for secure modern financial operations.</h2>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <div className="feature-card" key={feature.title}>
                <div className="feature-icon">✓</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="landing-section alt">
          <div className="section-heading">
            <span className="eyebrow">Simple workflow</span>
            <h2>From onboarding to transfer in three clear steps.</h2>
          </div>

          <div className="steps-grid">
            {steps.map((step) => (
              <div className="step-card" key={step.number}>
                <div className="step-number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="security" className="landing-section">
          <div className="security-panel">
            <div>
              <span className="eyebrow">Built with accountability</span>
              <h2>Security and visibility are at the core of every transaction.</h2>
            </div>

            <div className="security-bullets">
              <div><strong>Audit logs</strong><span>Track every critical action taken by users and admins.</span></div>
              <div><strong>Verified ledger</strong><span>Automated checks keep the system economically consistent.</span></div>
              <div><strong>Controlled access</strong><span>Apply permissions so only the right users act on the right data.</span></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div>© 2026 BalanceVault • TrustLedger</div>
        <div className="footer-links">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </footer>
    </div>
  );
}
