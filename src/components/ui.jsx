import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <header className="page-head reveal">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="actions">{children}</div>}
    </header>
  );
}

export function ProgressBar({ value, tone = '', label, marker }) {
  return (
    <div
      className={`progress ${tone ? `progress--${tone}` : ''}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="progress__bar" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      {marker != null && <span className="progress__marker" style={{ left: `${marker}%` }} title={`Mínimo para aprobar: ${marker}`} />}
    </div>
  );
}

export function Badge({ tone, children, icon: Icon }) {
  return (
    <span className={`badge badge--${tone}`}>
      {Icon && <Icon size={12} aria-hidden />}
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="empty">
      {Icon && <Icon size={34} aria-hidden />}
      <strong>{title}</strong>
      {children && <p className="small">{children}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector('input, select, textarea, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <div className="modal__head">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, error, children, id }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="error" role="alert">{error}</span>}
    </div>
  );
}

export const initials = (name) =>
  name
    .replace(/^(Dra?\.|Mtro\.|Ing\.|Lic\.)\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
