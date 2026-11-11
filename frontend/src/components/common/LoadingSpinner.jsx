import React from 'react';

export const LoadingScreen = ({ text = 'Loading…' }) => (
  <div className="loading-screen">
    <div style={{
      width: 48, height: 48,
      background: 'linear-gradient(135deg, #0a1628 0%, #1a3a5c 100%)',
      borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '0.5rem',
      boxShadow: '0 8px 32px rgba(10,22,40,0.2)',
    }}>
      <span style={{ fontSize: '1.4rem' }}>🏦</span>
    </div>
    <div className="spinner spinner-lg" />
    <p style={{ color: 'var(--grey-400)', fontSize: '0.875rem', fontWeight: 500 }}>{text}</p>
  </div>
);

const LoadingSpinner = ({ size = 'md', text }) => {
  const cls = size === 'lg' ? 'spinner spinner-lg' : size === 'sm' ? 'spinner spinner-sm' : 'spinner';
  return (
    <div className="loading-center" role="status" aria-label={text || 'Loading'}>
      <div className={cls} />
      {text && <p style={{ color: 'var(--grey-400)', fontSize: '0.875rem', fontWeight: 500 }}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
