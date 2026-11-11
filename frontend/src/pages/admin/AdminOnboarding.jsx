import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { formatDate, getErrorMessage, onboardingBadgeClass } from '../../utils/format';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';

const AdminOnboarding = () => {
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewing, setReviewing] = useState(null); // { id, decision }
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.onboarding({ status: statusFilter || undefined, page, limit: LIMIT });
      setApplications(res.data.data.applications);
      setTotal(res.data.data.total);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleReview = async () => {
    setSubmitting(true);
    try {
      await adminAPI.reviewOnboarding(reviewing.id, { decision: reviewing.decision, reviewNote });
      setSuccess(`Application ${reviewing.decision}d successfully`);
      setReviewing(null);
      setReviewNote('');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Onboarding Applications</h1>
          <p style={{ color: 'var(--grey-500)' }}>Review and approve KYC applications</p>
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {loading ? <LoadingSpinner text="Loading applications..." /> : (
        <div className="card">
          {applications.length === 0 ? (
            <div className="empty-state"><h3>No applications found</h3></div>
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>ID Type</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td style={{ fontWeight: 500 }}>{app.fullName}</td>
                        <td style={{ color: 'var(--grey-600)', fontSize: '0.85rem' }}>{app.user?.email}</td>
                        <td>{app.idType}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--grey-500)' }}>{formatDate(app.createdAt)}</td>
                        <td><span className={onboardingBadgeClass(app.status)}>{app.status}</span></td>
                        <td>
                          {app.status === 'PENDING' && (
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button className="btn btn-success btn-sm" onClick={() => { setReviewing({ id: app.id, decision: 'approve' }); setReviewNote(''); }}>
                                Approve
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => { setReviewing({ id: app.id, decision: 'reject' }); setReviewNote(''); }}>
                                Reject
                              </button>
                            </div>
                          )}
                          {app.status !== 'PENDING' && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--grey-400)' }}>{app.reviewNote || '—'}</span>
                          )}
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
            </>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewing && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: reviewing.decision === 'approve' ? 'var(--success)' : 'var(--error)' }}>
                {reviewing.decision === 'approve' ? '✓ Approve' : '✕ Reject'} Application
              </h2>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reviewNote">
                Review Note {reviewing.decision === 'reject' ? '(required)' : '(optional)'}
              </label>
              <textarea
                id="reviewNote"
                className="form-input"
                style={{ minHeight: 80 }}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={reviewing.decision === 'approve' ? 'All documents verified' : 'Reason for rejection...'}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setReviewing(null)}>Cancel</button>
              <button
                className={`btn ${reviewing.decision === 'approve' ? 'btn-success' : 'btn-danger'}`}
                disabled={submitting || (reviewing.decision === 'reject' && !reviewNote.trim())}
                onClick={handleReview}
              >
                {submitting ? 'Processing...' : (reviewing.decision === 'approve' ? 'Confirm Approval' : 'Confirm Rejection')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOnboarding;
