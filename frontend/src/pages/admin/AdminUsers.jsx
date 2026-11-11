import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { formatDate, getErrorMessage, onboardingBadgeClass } from '../../utils/format';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.users({ page, limit: LIMIT, role: 'ACCOUNT_HOLDER' });
      setUsers(res.data.data.users);
      setTotal(res.data.data.total);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await adminAPI.setUserStatus(userId, !currentStatus);
      setSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      load();
    } catch (err) { setError(getErrorMessage(err)); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Users</h1>
        <p style={{ color: 'var(--grey-500)' }}>Manage account holders</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {loading ? <LoadingSpinner /> : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Accounts</th>
                  <th>Onboarding</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</td>
                    <td style={{ color: 'var(--grey-600)', fontSize: '0.85rem' }}>{u.email}</td>
                    <td>{u._count?.accounts ?? 0}</td>
                    <td>
                      {u.onboarding
                        ? <span className={onboardingBadgeClass(u.onboarding.status)}>{u.onboarding.status}</span>
                        : <span className="badge badge-grey">None</span>}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--grey-500)' }}>{formatDate(u.createdAt)}</td>
                    <td>
                      <span className={u.isActive ? 'badge badge-green' : 'badge badge-red'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleStatus(u.id, u.isActive)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>Page {page} of {totalPages} — {total} total users</span>
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

export default AdminUsers;
