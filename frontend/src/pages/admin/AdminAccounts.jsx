import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { formatCurrency, formatDate, getErrorMessage, accountBadgeClass } from '../../utils/format';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';

const AdminAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.accounts({ page, limit: LIMIT, status: statusFilter || undefined });
      setAccounts(res.data.data.accounts);
      setTotal(res.data.data.total);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try {
      await adminAPI.updateAccountStatus(id, status);
      setSuccess(`Account status updated to ${status}`);
      load();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setUpdating(null); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Accounts</h1>
          <p style={{ color: 'var(--grey-500)' }}>Manage all bank accounts</p>
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {loading ? <LoadingSpinner /> : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Account Number</th>
                  <th>Owner</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Balance</th>
                  <th>Status</th>
                  <th>Opened</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600 }}>{acc.accountNumber}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{acc.user?.firstName} {acc.user?.lastName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--grey-400)' }}>{acc.user?.email}</div>
                    </td>
                    <td>{acc.accountType}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--navy)' }}>{formatCurrency(acc.balance)}</td>
                    <td><span className={accountBadgeClass(acc.status)}>{acc.status}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--grey-500)' }}>{formatDate(acc.createdAt)}</td>
                    <td>
                      <select
                        className="form-select"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
                        value={acc.status}
                        disabled={updating === acc.id}
                        onChange={(e) => handleStatusChange(acc.id, e.target.value)}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </td>
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

export default AdminAccounts;
