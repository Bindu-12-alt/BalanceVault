import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { formatDateTime, getErrorMessage } from '../../utils/format';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.auditLogs({ page, limit: LIMIT, outcome: outcomeFilter || undefined });
      setLogs(res.data.data.logs);
      setTotal(res.data.data.total);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [page, outcomeFilter]);

  useEffect(() => { load(); }, [load]);
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Audit Logs</h1>
          <p style={{ color: 'var(--grey-500)' }}>Immutable record of all system events</p>
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={outcomeFilter}
          onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}>
          <option value="">All Outcomes</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILURE">Failure</option>
        </select>
      </div>

      {error && <Alert type="error" message={error} />}

      {loading ? <LoadingSpinner /> : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Outcome</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.78rem', color: 'var(--grey-500)', whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</td>
                    <td>
                      {log.actor
                        ? <div>
                            <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{log.actor.firstName} {log.actor.lastName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--grey-400)' }}>{log.actorRole}</div>
                          </div>
                        : <span style={{ color: 'var(--grey-400)', fontSize: '0.85rem' }}>System</span>}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: 'var(--grey-100)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--grey-600)' }}>
                      {log.targetType && <span>{log.targetType}</span>}
                    </td>
                    <td>
                      <span className={log.outcome === 'SUCCESS' ? 'badge badge-green' : 'badge badge-red'}>
                        {log.outcome}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--grey-400)', fontFamily: 'var(--font-mono)' }}>
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>Page {page} of {totalPages} — {total} events</span>
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

export default AdminAuditLogs;
