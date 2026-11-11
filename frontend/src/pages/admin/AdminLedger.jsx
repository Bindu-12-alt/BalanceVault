import React, { useState } from 'react';
import { adminAPI } from '../../services/api';
import { formatDateTime, getErrorMessage } from '../../utils/format';
import Alert from '../../components/common/Alert';
import { VerifyIcon, CheckIcon, XIcon } from '../../components/common/Icons';

export default function AdminLedger() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setLoading(true); setError('');
    try {
      const res = await adminAPI.verifyLedger();
      setReport(res.data.data);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Ledger Verification</h1>
        <p>Verify double-entry bookkeeping integrity across all transactions</p>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Run verification */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Run Verification</div>
              <div className="card-subtitle">Checks all completed transactions for ledger integrity</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              ['Debit ↔ Credit matching',       'Each transaction must have exactly one DEBIT and one CREDIT entry'],
              ['Amount consistency',             'DEBIT and CREDIT amounts must equal the transaction amount'],
              ['Balance continuity',             'balanceAfter = balanceBefore ± amount for every entry'],
              ['Orphan entry detection',         'No ledger entries should exist without a parent transaction'],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: '0.75rem', padding: '0.9rem', background: 'var(--grey-50)', borderRadius: 'var(--r-sm)' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,196,180,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckIcon size={12} style={{ color: 'var(--teal)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--grey-900)' }}>{title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--grey-400)', marginTop: '2px' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary btn-lg w-full" onClick={handleVerify} disabled={loading}>
            {loading
              ? <><span className="spinner spinner-sm" /> Verifying ledger…</>
              : <><VerifyIcon size={17} /> Run Ledger Verification</>}
          </button>
        </div>

        {/* Right: Report */}
        <div>
          {!report ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h3>No report yet</h3>
                <p>Run a verification to see the ledger health report.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Health banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1.25rem',
                padding: '1.5rem',
                background: report.isHealthy ? 'var(--success-bg)' : 'var(--error-bg)',
                border: `1px solid ${report.isHealthy ? 'var(--success-border)' : 'var(--error-border)'}`,
                borderRadius: 'var(--r-lg)',
                marginBottom: '1rem',
              }}>
                <div style={{
                  width: 56, height: 56,
                  borderRadius: '50%',
                  background: report.isHealthy ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.75rem', flexShrink: 0,
                }}>
                  {report.isHealthy ? '✅' : '⚠️'}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: report.isHealthy ? '#065f46' : '#991b1b' }}>
                    {report.isHealthy ? 'Ledger is Healthy' : 'Integrity Issues Found'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: report.isHealthy ? '#047857' : '#b91c1c', marginTop: '3px' }}>
                    Verified {formatDateTime(report.verifiedAt)}
                  </div>
                </div>
              </div>

              {/* Summary stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  ['Transactions', report.summary?.totalTransactions ?? 0, 'var(--grey-900)'],
                  ['Verified',     report.summary?.verifiedTransactions ?? 0, 'var(--success)'],
                  ['Issues',       report.summary?.issueCount ?? 0, report.summary?.issueCount > 0 ? 'var(--error)' : 'var(--grey-900)'],
                  ['Orphan Entries', report.summary?.orphanEntries ?? 0, report.summary?.orphanEntries > 0 ? 'var(--error)' : 'var(--grey-900)'],
                ].map(([label, val, color]) => (
                  <div key={label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{val}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--grey-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '3px' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Issues */}
              {report.issues?.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title" style={{ color: 'var(--error)' }}>
                      <XIcon size={16} style={{ color: 'var(--error)', verticalAlign: 'middle', marginRight: '0.4rem' }} />
                      Issues ({report.issues.length})
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {report.issues.map((issue, i) => (
                      <div key={i} style={{ padding: '0.9rem', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--r-sm)' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#991b1b', fontSize: '0.78rem', marginBottom: '0.3rem' }}>{issue.type}</div>
                        {issue.transactionId && <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginBottom: '0.2rem' }}>TX: {issue.transactionId}</div>}
                        <div style={{ fontSize: '0.82rem', color: '#991b1b' }}>{issue.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
