import React, { useEffect, useState } from 'react';
import { accountsAPI } from '../../services/api';
import { formatCurrency, formatDateTime, txBadgeClass, getErrorMessage } from '../../utils/format';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import { TransferIcon } from '../../components/common/Icons';

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState('');
  const LIMIT = 15;

  useEffect(() => {
    accountsAPI.list()
      .then((res) => {
        const accs = res.data.data.accounts;
        setAccounts(accs);
        if (accs.length) setSelectedAccount(accs[0].id);
      })
      .catch(() => setError('Failed to load accounts'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAccount) return;
    setTxLoading(true);
    accountsAPI.transactions(selectedAccount, { page, limit: LIMIT })
      .then((res) => {
        setTransactions(res.data.data.transactions || []);
        setTotal(res.data.data.total || 0);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setTxLoading(false));
  }, [selectedAccount, page]);

  const totalPages = Math.ceil(total / LIMIT);
  const selectedAcc = accounts.find((a) => a.id === selectedAccount);

  if (loading) return <LoadingSpinner text="Loading…" />;

  return (
    <div>
      <div className="page-header">
        <h1>Transaction History</h1>
        <p>Complete record of all your account activity</p>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {accounts.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon">🏦</div><h3>No accounts</h3><p>Open an account to see transactions.</p></div></div>
      ) : (
        <>
          {/* Account selector */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label className="form-label" htmlFor="acc-sel">Account</label>
                <select id="acc-sel" className="form-select"
                  value={selectedAccount}
                  onChange={(e) => { setSelectedAccount(e.target.value); setPage(1); }}>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} — {acc.accountType}
                    </option>
                  ))}
                </select>
              </div>
              {selectedAcc && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--grey-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--teal)' }}>{formatCurrency(selectedAcc.balance)}</div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Transactions</div>
                <div className="card-subtitle">{total} total records</div>
              </div>
            </div>

            {txLoading ? <LoadingSpinner text="Loading transactions…" /> : (
              transactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💳</div>
                  <h3>No transactions</h3>
                  <p>No activity found for this account.</p>
                </div>
              ) : (
                <>
                  <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Details</th>
                          <th>Description</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => {
                          const isCredit = accounts.some((a) => a.id === tx.toAccountId);
                          return (
                            <tr key={tx.id}>
                              <td className="td-muted" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(tx.createdAt)}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                  <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: isCredit ? 'var(--success-bg)' : 'var(--error-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <TransferIcon size={14} style={{ color: isCredit ? 'var(--success)' : 'var(--error)', transform: isCredit ? 'none' : 'rotate(180deg)' }} />
                                  </div>
                                  <div>
                                    <div className="td-primary" style={{ fontSize: '0.82rem' }}>{isCredit ? 'Received from' : 'Sent to'}</div>
                                    <div className="td-mono">{isCredit ? tx.fromAccount?.accountNumber : tx.toAccount?.accountNumber}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="td-muted">{tx.description || '—'}</td>
                              <td style={{ textAlign: 'right' }}>
                                <span className={`td-amount ${isCredit ? 'td-amount-credit' : 'td-amount-debit'}`}>
                                  {isCredit ? '+' : '−'}{formatCurrency(tx.amount)}
                                </span>
                              </td>
                              <td><span className={txBadgeClass(tx.status)}>{tx.status}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="pagination">
                    <span>Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
                    <div className="pagination-controls">
                      <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                      <span style={{ padding: '0 0.5rem', fontSize: '0.82rem', color: 'var(--grey-500)', alignSelf: 'center' }}>
                        {page} / {totalPages}
                      </span>
                      <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
