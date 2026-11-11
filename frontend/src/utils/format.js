/**
 * Format integer paise as a currency string.
 */
export const formatCurrency = (paise) => {
  if (paise == null) return '₹0.00';
  const rupees = paise / 100;
  return rupees.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
};

/**
 * Format a date string for display.
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

/**
 * Format a date with time.
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

/**
 * Extract a readable error message from an Axios error.
 */
export const getErrorMessage = (err) => {
  return err?.response?.data?.message || err?.message || 'An unexpected error occurred';
};

/**
 * Map onboarding status to badge class.
 */
export const onboardingBadgeClass = (status) => {
  if (status === 'APPROVED') return 'badge badge-green';
  if (status === 'REJECTED') return 'badge badge-red';
  return 'badge badge-yellow';
};

/**
 * Map account status to badge class.
 */
export const accountBadgeClass = (status) => {
  if (status === 'ACTIVE') return 'badge badge-green';
  if (status === 'SUSPENDED') return 'badge badge-yellow';
  return 'badge badge-grey';
};

/**
 * Map transaction status to badge class.
 */
export const txBadgeClass = (status) => {
  if (status === 'COMPLETED') return 'badge badge-green';
  if (status === 'FAILED') return 'badge badge-red';
  if (status === 'REVERSED') return 'badge badge-grey';
  return 'badge badge-yellow';
};

/**
 * Generate a UUID-like idempotency key.
 */
export const generateIdempotencyKey = () => {
  return `idem-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};
