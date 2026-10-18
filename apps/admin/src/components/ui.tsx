import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';

import { UNIT_COLORS, UNIT_ICONS, type UnitColor, type UnitIcon } from '@chao/shared';

import { COLOR_LABELS, ICONS } from '../lib/labels';
import { unitVars } from '../theme';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'unit' | 'ghost';
  size?: 'md' | 'sm' | 'icon';
  loading?: boolean;
  icon?: ReactNode;
};

/** Tactile button with a 3D edge, as in the mobile app. */
export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn-${variant}`, size !== 'md' && `btn-${size}`, className];
  return (
    <button
      type="button"
      className={classes.filter(Boolean).join(' ')}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}>
      {loading ? <span className="spinner" /> : icon}
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone,
  color,
}: {
  children: ReactNode;
  tone?: 'success' | 'xp' | 'info' | 'danger' | 'primary';
  /** Unit color (overrides `tone`). */
  color?: UnitColor;
}) {
  if (color) {
    return (
      <span className="badge badge-unit" style={unitVars(color)}>
        {children}
      </span>
    );
  }
  return <span className={`badge ${tone ? `badge-${tone}` : ''}`}>{children}</span>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">
        <span>{label}</span>
        {hint ? <span className="c-muted">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

/** Unit color swatches. */
export function ColorPicker({
  value,
  onChange,
}: {
  value: UnitColor;
  onChange: (color: UnitColor) => void;
}) {
  return (
    <div className="swatches" role="group" aria-label="Couleur">
      {UNIT_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className="swatch"
          style={unitVars(color)}
          aria-pressed={value === color}
          title={COLOR_LABELS[color]}
          aria-label={COLOR_LABELS[color]}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}

/** Unit illustration picker. */
export function IconPicker({
  value,
  color,
  onChange,
}: {
  value: UnitIcon;
  color: UnitColor;
  onChange: (icon: UnitIcon) => void;
}) {
  return (
    <div className="icon-picker" role="group" aria-label="Icône" style={unitVars(color)}>
      {UNIT_ICONS.map((icon) => {
        const Glyph = ICONS[icon].icon;
        return (
          <button
            key={icon}
            type="button"
            className="icon-option"
            aria-pressed={value === icon}
            title={ICONS[icon].label}
            aria-label={ICONS[icon].label}
            onClick={() => onChange(icon)}>
            <Glyph size={20} />
          </button>
        );
      })}
    </div>
  );
}

/** On/off switch (published…). */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden />
      <span>{label}</span>
    </label>
  );
}

export function Dialog({
  title,
  children,
  actions,
  onClose,
  wide,
}: {
  title: string;
  children: ReactNode;
  actions: ReactNode;
  onClose: () => void;
  /** Larger dialog for forms. */
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`card dialog${wide ? ' dialog-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}>
        <div className="row">
          <h2 className="t-heading grow">{title}</h2>
          <Button variant="ghost" size="icon" aria-label="Fermer" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
        <div className="stack" style={{ marginTop: 16 }}>
          {children}
        </div>
        <div className="dialog-actions">{actions}</div>
      </div>
    </div>
  );
}

// --- Toasts --------------------------------------------------------------------

type Toast = { id: number; tone: 'info' | 'success' | 'error'; message: string };
type ToastFn = (message: string, tone?: Toast['tone']) => void;

const ToastContext = createContext<ToastFn>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback<ToastFn>((message, tone = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, message }]);
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      tone === 'error' ? 7000 : 3500,
    );
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.tone === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
