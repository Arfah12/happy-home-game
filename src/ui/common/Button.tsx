import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { sfx } from '../../game/events';

export type ButtonVariant = 'pink' | 'mint' | 'lilac' | 'butter' | 'sky' | 'white';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  silent?: boolean;
}

export function Button({ variant = 'white', className = '', children, onClick, silent, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${variant !== 'white' && variant !== 'butter' ? 'btn-text-shadow' : ''} ${className}`}
      onClick={(e) => {
        if (!silent) sfx('click');
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, icon, variant = 'white', className = '', ...rest }: Omit<Props, 'children'> & { label: string; icon: ReactNode }) {
  return (
    <Button variant={variant} className={`icon-btn ${className}`} aria-label={label} title={label} {...rest}>
      <span aria-hidden>{icon}</span>
    </Button>
  );
}
