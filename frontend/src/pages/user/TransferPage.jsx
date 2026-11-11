import React, { useEffect, useState } from 'react';
import { accountsAPI, transfersAPI } from '../../services/api';
import { formatCurrency, getErrorMessage, generateIdempotencyKey } from '../../utils/format';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import { TransferIcon, SendIcon, XIcon } from '../../components/common/Icons';

export default function TransferPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ fromAccountId: '', toAccountId: '', amount: '', description: '' });

  useEffect(() => {
    accountsAPI.list()
      .then((res) => {
        const active = res.data.data.accounts.filter((a) => a.status === 'ACTIVE');
        setAccounts(active);
        if (active.length) setForm((f) => ({ ...f, fromAccountId: active[0].id }));
      })
      .catch(() => setError('Could not load accounts'))
      .finally(() => setLoading(false));
  }, []);

  const handle = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const validate = () => {
    if (!form.fromAccountId) return 'Select a source account';
    if (!form.toAccountId.trim()) return 'Enter the destination account ID';
    if (form.fromAccountId === form.toAccountId.trim()) return 'Source and destination cannot be the same account';
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) return 'Enter a valid positive amount';
    if (!/^\d+(\.\d{1,2})?$/.test(form.amount)) return 'Amount can have at most 2 decimal places';
    return null;
  };

  const handleSubmitAttempt = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setError(''); setSuccess('');
    try {
      await transfersAPI.initiate({
        fromAccountId: form.fromAccountId,
        toAccountId: form.toAccountId.trim(),
        amount: form.amount,
        description: form.description || undefined,
        idempotencyKey: generateIdempotencyKey(),
      });
      setSuccess(`₹${form.amount} transferred successfully!`);
      setForm((f) => ({ ...f, toAccountId: '', amount: '', description: '' }));
      const res = await accountsAPI.list();
      setAccounts(res.data.data.accounts.filter((a) => a.status === 'ACTIVE'));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setSubmitting(false); }
  };

  const selectedAcc = accounts.find((a) => a.id === form.fromAccountId);

  if (loading) return <LoadingSpinner text="Loading accounts…" />;

  return (
    <div>
      <div className="page-header">
        <h1>Transfer Money</h1>
        <p>Send funds securely to any BalanceVault account</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form */}
        <div className="card">
          <Alert type="error"   message={error}   onClose={() => setError('')} />
          <Alert type="success" message={success} onClose={() => setSuccess('')} />

          {accounts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <h3>No active accounts</h3>
              <p>You need an active account to make transfers.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitAttempt} noValidate>
              {/* From */}
              <div className="form-group">
                <label className="form-label" htmlFor="fromAccountId">From account</label>
                <select id="fromAccountId" name="fromAccountId" className="form-select"
                  value={form.fromAccountId} onChange={handle}>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} — {formatCurrency(acc.balance)}
                    </option>
                  ))}
                </select>
                {selectedAcc && (
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem 1rem', background: 'var(--grey-50)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--grey-500)', fontWeight: 600 }}>Available balance</span>
                    <span style={{ fontWeight: 800, color: 'var(--teal)', fontSize: '1.1rem' }}>{formatCurrency(selectedAcc.balance)}</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.5rem 0 1.25rem', gap: '0.75rem' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grey-100)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TransferIcon size={16} style={{ color: 'var(--grey-400)', transform: 'rotate(90deg)' }} />
                </div>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              {/* To */}
              <div className="form-group">
                <label className="form-label" htmlFor="toAccountId">To account ID</label>
                <input id="toAccountId" name="toAccountId" type="text" className="form-input"
                  value={form.toAccountId} onChange={handle}
                  placeholder="Paste the recipient's Account ID" />
                <p className="form-hint">Ask the recipient to share their Account ID from their Accounts page.</p>
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label" htmlFor="amount">Amount</label>
                <div className="input-wrapper">
                  <span className="input-prefix">₹</span>
                  <input id="amount" name="amount" type="number" className="form-input input-with-prefix"
                    value={form.amount} onChange={handle}
                    placeholder="0.00" min="0.01" step="0.01" />
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Description <span style={{ color: 'var(--grey-400)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input id="description" name="description" type="text" className="form-input"
                  value={form.description} onChange={handle}
                  placeholder="e.g. Rent payment, Invoice #123" maxLength={200} />
              </div>

              <button type="submit" className="btn btn-primary btn-xl w-full" disabled={submitting}>
                {submitting
                  ? <><span className="spinner spinner-sm" /> Processing…</>
                  : <><SendIcon size={16} /> Review Transfer</>}
              </button>
            </form>
          )}
        </div>

        {/* Info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: '1rem' }}>Transfer Information</div>
            {[
              ['Processing', 'Instant — real-time settlement'],
              ['Transfer limit', '₹1,00,00,000 per transaction'],
              ['Fees', 'No transfer fees'],
              ['Security', 'Cryptographically secured'],
              ['Idempotency', 'Duplicate transfers prevented'],
            ].map(([k, v]) => (
              <div className="info-row" key={k}>
                <span className="info-label">{k}</span>
                <span className="info-value" style={{ fontSize: '0.85rem', textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '1rem 1.25rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--r)', fontSize: '0.82rem', color: '#92400e' }}>
            <strong>⚠ Important:</strong> Always verify the account ID before confirming. Transfers cannot be reversed once completed.
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title" id="confirm-title">Confirm Transfer</div>
                <div className="modal-subtitle">Please review before confirming</div>
              </div>
              <button className="modal-close" onClick={() => setShowConfirm(false)} aria-label="Close"><XIcon size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="transfer-summary">
                <div className="transfer-summary-row">
                  <span style={{ color: 'var(--grey-500)', fontWeight: 500 }}>From account</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {accounts.find((a) => a.id === form.fromAccountId)?.accountNumber}
                  </span>
                </div>
                <div className="transfer-summary-row">
                  <span style={{ color: 'var(--grey-500)', fontWeight: 500 }}>To account ID</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', maxWidth: '55%', textAlign: 'right', wordBreak: 'break-all', fontWeight: 600 }}>
                    {form.toAccountId}
                  </span>
                </div>
                {form.description && (
                  <div className="transfer-summary-row">
                    <span style={{ color: 'var(--grey-500)', fontWeight: 500 }}>Description</span>
                    <span style={{ fontWeight: 500 }}>{form.description}</span>
                  </div>
                )}
                <div className="transfer-summary-row total">
                  <span>Transfer amount</span>
                  <span style={{ color: 'var(--teal)', fontSize: '1.3rem' }}>₹{form.amount}</span>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--grey-400)', lineHeight: 1.6 }}>
                This transfer is irreversible. Ensure the account ID is correct before proceeding.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirm}>
                <SendIcon size={15} /> Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
