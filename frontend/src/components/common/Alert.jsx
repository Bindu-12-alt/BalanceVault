import React from 'react';
import { CheckIcon, XIcon, AlertIcon, InfoIcon } from './Icons';

const configs = {
  success: { icon: CheckIcon,  cls: 'alert-success' },
  error:   { icon: XIcon,      cls: 'alert-error'   },
  warning: { icon: AlertIcon,  cls: 'alert-warning' },
  info:    { icon: InfoIcon,   cls: 'alert-info'    },
};

const Alert = ({ type = 'info', message, onClose }) => {
  if (!message) return null;
  const { icon: Icon, cls } = configs[type] || configs.info;

  return (
    <div className={`alert ${cls}`} role="alert">
      <Icon size={16} className="alert-icon" />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button className="alert-dismiss" onClick={onClose} aria-label="Dismiss">×</button>
      )}
    </div>
  );
};

export default Alert;
