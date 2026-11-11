import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { formatCurrency, formatDateTime, getErrorMessage, txBadgeClass } from '../../utils/format';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const LIMIT = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.transactions({ page, limit: LIMIT });
      setTransactions(res.data.data.transactions);
      setTotal(res.data.data.total);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>All Transactions</h1>
        <p style={{ color: 'var(--grey-500)' }}>Monitor every transfer in the system</p>
      </div>
      {error && <Alert type="error" message={error} />}

      {loading ? <LoadingSpinner /> : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>From Account</th>
                  <th>To Account</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--grey-500)', whiteSpace: 'nowrap' }}>{formatDateTime(tx.createdAt)}</td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{tx.fromAccount?.accountNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--grey-400)' }}>{tx.fromAccount?.user?.firstName} {tx.fromAccount?.user?.lastName}</div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{tx.toAccount?.accountNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--grey-400)' }}>{tx.toAccount?.user?.firstName} {tx.toAccount?.user?.lastName}</div>
                    </td>
                    <td style={{ color: 'var(--grey-600)', fontSize: '0.85rem' }}>{tx.description || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--teal)' }}>{formatCurrency(tx.amount)}</td>
                    <td><span className={txBadgeClass(tx.status)}>{tx.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>Page {page} of {totalPages} — {total} total</span>
            <div className="pagination-controls">
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
