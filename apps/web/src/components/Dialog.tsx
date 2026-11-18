'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Loader2,
} from 'lucide-react';

export type DialogVariant = 'danger' | 'warning' | 'info' | 'success';

/* -------------------------------------------------------------------------- */
/* Common Dialog Props & Options                                              */
/* -------------------------------------------------------------------------- */

export interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  confirmTestId?: string;
  cancelTestId?: string;
  icon?: ReactNode;
  closeOnBackdrop?: boolean;
}

export interface AlertOptions {
  title: string;
  message?: ReactNode;
  description?: string;
  buttonText?: string;
  variant?: DialogVariant;
  buttonTestId?: string;
  icon?: ReactNode;
  closeOnBackdrop?: boolean;
}

export interface DialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export function useDialog(): DialogContextType {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

/* -------------------------------------------------------------------------- */
/* Base Dialog Component                                                      */
/* -------------------------------------------------------------------------- */

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  variant?: DialogVariant;
  icon?: ReactNode;
  testId?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  variant,
  icon,
  testId = 'dialog-container',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[maxWidth];

  const variantIcons: Record<DialogVariant, ReactNode> = {
    danger: <AlertTriangle className="w-5 h-5 text-status-danger" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    info: <Info className="w-5 h-5 text-ink" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  };

  const variantIconBadges: Record<DialogVariant, string> = {
    danger: 'bg-red-50 border-red-200 text-status-danger',
    warning: 'bg-amber-50 border-amber-200 text-amber-600',
    info: 'bg-subtle border-border text-ink',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-600',
  };

  const activeIcon = icon ?? (variant ? variantIcons[variant] : null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid={testId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 select-none font-sans"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        data-testid="dialog-card"
        className={`w-full ${maxWidthClasses} bg-surface border border-border rounded-xl shadow-2xl overflow-hidden p-5 space-y-4 animate-in zoom-in-95 duration-150 select-text`}
      >
        {/* Header */}
        {(title || activeIcon || showCloseButton) && (
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              {activeIcon && (
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                    variant ? variantIconBadges[variant] : 'bg-subtle border-border'
                  }`}
                >
                  {activeIcon}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                {title && (
                  <h3
                    data-testid="dialog-title"
                    className="text-sm font-semibold text-ink leading-snug truncate"
                  >
                    {title}
                  </h3>
                )}
                {description && (
                  <p
                    data-testid="dialog-description"
                    className="text-xs text-ink-secondary mt-0.5"
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                data-testid="dialog-close-btn"
                title="Close Dialog"
                className="p-1 text-ink-secondary hover:text-ink hover:bg-subtle rounded transition-colors -mr-1 -mt-1 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        {children && <div className="text-xs text-ink-secondary leading-relaxed">{children}</div>}

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Declarative ConfirmDialog                                                  */
/* -------------------------------------------------------------------------- */

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message?: ReactNode;
  children?: ReactNode;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  isLoading?: boolean;
  confirmTestId?: string;
  cancelTestId?: string;
  closeOnBackdrop?: boolean;
  icon?: ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  children,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  confirmTestId = 'dialog-confirm-btn',
  cancelTestId = 'dialog-cancel-btn',
  closeOnBackdrop = true,
  icon,
}: ConfirmDialogProps) {
  const confirmBtnStyles: Record<DialogVariant, string> = {
    danger: 'bg-status-danger hover:bg-red-800 text-white focus:ring-red-500',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
    info: 'bg-ink hover:bg-ink-secondary text-white focus:ring-zinc-500',
    success: 'bg-emerald-700 hover:bg-emerald-800 text-white focus:ring-emerald-500',
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        data-testid={cancelTestId}
        className="px-3 py-1.5 text-xs text-ink-secondary hover:text-ink rounded hover:bg-subtle border border-transparent hover:border-border transition-colors disabled:opacity-50"
      >
        {cancelText}
      </button>

      <button
        type="button"
        onClick={async () => {
          await onConfirm();
        }}
        disabled={isLoading}
        data-testid={confirmTestId}
        className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center space-x-1.5 font-medium disabled:opacity-50 shadow-2xs ${confirmBtnStyles[variant]}`}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        <span>{confirmText}</span>
      </button>
    </>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant={variant}
      icon={icon}
      footer={footer}
      closeOnBackdrop={closeOnBackdrop && !isLoading}
      showCloseButton={!isLoading}
    >
      {message && <div className="space-y-1">{message}</div>}
      {children}
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Declarative AlertDialog                                                    */
/* -------------------------------------------------------------------------- */

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: ReactNode;
  children?: ReactNode;
  description?: string;
  buttonText?: string;
  variant?: DialogVariant;
  buttonTestId?: string;
  closeOnBackdrop?: boolean;
  icon?: ReactNode;
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  children,
  description,
  buttonText = 'OK',
  variant = 'info',
  buttonTestId = 'dialog-alert-btn',
  closeOnBackdrop = true,
  icon,
}: AlertDialogProps) {
  const buttonStyles: Record<DialogVariant, string> = {
    danger: 'bg-status-danger hover:bg-red-800 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    info: 'bg-ink hover:bg-ink-secondary text-white',
    success: 'bg-emerald-700 hover:bg-emerald-800 text-white',
  };

  const footer = (
    <button
      type="button"
      onClick={onClose}
      data-testid={buttonTestId}
      className={`px-3.5 py-1.5 text-xs rounded transition-colors font-medium shadow-2xs ${buttonStyles[variant]}`}
    >
      {buttonText}
    </button>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant={variant}
      icon={icon}
      footer={footer}
      closeOnBackdrop={closeOnBackdrop}
      showCloseButton={true}
    >
      {message && <div className="space-y-1">{message}</div>}
      {children}
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* DialogProvider & Imperative Hook System                                     */
/* -------------------------------------------------------------------------- */

interface ActiveConfirmState {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

interface ActiveAlertState {
  options: AlertOptions;
  resolve: () => void;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [activeConfirm, setActiveConfirm] = useState<ActiveConfirmState | null>(null);
  const [activeAlert, setActiveAlert] = useState<ActiveAlertState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setActiveConfirm({ options, resolve });
    });
  }, []);

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise<void>((resolve) => {
      setActiveAlert({ options, resolve });
    });
  }, []);

  const handleConfirmClose = () => {
    if (activeConfirm) {
      activeConfirm.resolve(false);
      setActiveConfirm(null);
    }
  };

  const handleConfirmAccept = () => {
    if (activeConfirm) {
      activeConfirm.resolve(true);
      setActiveConfirm(null);
    }
  };

  const handleAlertClose = () => {
    if (activeAlert) {
      activeAlert.resolve();
      setActiveAlert(null);
    }
  };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}

      {/* Global Confirm Dialog */}
      {activeConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={handleConfirmClose}
          onConfirm={handleConfirmAccept}
          title={activeConfirm.options.title}
          message={activeConfirm.options.message}
          description={activeConfirm.options.description}
          confirmText={activeConfirm.options.confirmText}
          cancelText={activeConfirm.options.cancelText}
          variant={activeConfirm.options.variant || 'danger'}
          confirmTestId={activeConfirm.options.confirmTestId || 'dialog-confirm-btn'}
          cancelTestId={activeConfirm.options.cancelTestId || 'dialog-cancel-btn'}
          closeOnBackdrop={activeConfirm.options.closeOnBackdrop ?? true}
          icon={activeConfirm.options.icon}
        />
      )}

      {/* Global Alert Dialog */}
      {activeAlert && (
        <AlertDialog
          isOpen={true}
          onClose={handleAlertClose}
          title={activeAlert.options.title}
          message={activeAlert.options.message}
          description={activeAlert.options.description}
          buttonText={activeAlert.options.buttonText || 'OK'}
          variant={activeAlert.options.variant || 'info'}
          buttonTestId={activeAlert.options.buttonTestId || 'dialog-alert-btn'}
          closeOnBackdrop={activeAlert.options.closeOnBackdrop ?? true}
          icon={activeAlert.options.icon}
        />
      )}
    </DialogContext.Provider>
  );
}
