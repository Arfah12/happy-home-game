import type { ReactNode } from 'react';
import { useUiStore } from '../../game/store/uiStore';
import { IconButton } from './Button';

interface ModalProps {
  title: string;
  icon?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg';
  onClose?: () => void;
  closable?: boolean;
}

const WIDTH = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' };

export function Modal({ title, icon, children, footer, width = 'md', onClose, closable = true }: ModalProps) {
  const close = onClose ?? useUiStore.getState().closeModal;
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-6 animate-fade-in" role="presentation">
      <div className="absolute inset-0 bg-[#5b3d66]/35 backdrop-blur-[3px]" onClick={closable ? close : undefined} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`panel relative w-full ${WIDTH[width]} max-h-[92dvh] flex flex-col animate-pop-in`}
      >
        <div className="flex items-center gap-3 px-5 pt-4 pb-3">
          {icon && (
            <div className="grid place-items-center w-11 h-11 rounded-2xl bg-candy-light text-2xl shadow-[0_3px_0_#f3b7cf]" aria-hidden>
              {icon}
            </div>
          )}
          <h2 className="flex-1 text-2xl font-bold tracking-tight">{title}</h2>
          {closable && <IconButton label="Tutup" icon="✕" onClick={close} className="!w-10 !h-10 !text-base" />}
        </div>
        <div className="flex-1 overflow-y-auto scroll-soft px-5 pb-5">{children}</div>
        {footer && <div className="px-5 pb-5 pt-1">{footer}</div>}
      </div>
    </div>
  );
}
