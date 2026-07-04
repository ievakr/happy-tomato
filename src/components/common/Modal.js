import React, { useEffect } from 'react';
import Icon from './Icon';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * Reusable modal component using Bootstrap styling.
 * @param {Object} props
 * @param {string} [props.title] - Modal header title
 * @param {string} [props.icon] - Material icon name for header
 * @param {function} props.onClose - Close handler
 * @param {React.ReactNode} props.children - Modal body content
 * @param {React.ReactNode} [props.footer] - Modal footer content
 * @param {string} [props.size] - 'sm' | 'md' | 'lg'
 * @param {boolean} [props.scrollable] - Enable modal-dialog-scrollable
 * @param {string} [props.className] - Additional class for modal wrapper
 * @param {number} [props.zIndex] - Custom z-index for nested modals
 * @param {boolean} [props.closeDisabled] - Disable close button
 * @param {'h5'|'h6'} [props.titleTag='h5'] - Heading level for title
 * @param {Object} [props.form] - When provided, wrap content in <form {...form}>
 * @param {React.ReactNode} [props.headerExtra] - Extra content in header (e.g. action buttons)
 */
export default function Modal({
  title,
  icon,
  onClose,
  children,
  footer,
  size = 'md',
  scrollable = false,
  className = '',
  zIndex,
  closeDisabled = false,
  titleTag: TitleTag = 'h5',
  form,
  headerExtra,
}) {
  const { t } = useTranslation();
  const sizeClass = size === 'sm' ? 'modal-sm' : size === 'lg' ? 'modal-lg' : '';
  const scrollableClass = scrollable ? 'modal-dialog-scrollable' : '';

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !closeDisabled && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, closeDisabled]);

  const modalStyle = zIndex ? { zIndex: zIndex + 10 } : undefined;
  const backdropStyle = zIndex ? { zIndex } : undefined;

  return (
    <>
      <div
        className={`modal fade show d-block ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        style={modalStyle}
      >
        <div className={`modal-dialog modal-dialog-centered ${sizeClass} ${scrollableClass}`.trim()}>
          <div className="modal-content">
            {form ? (
              <form {...form}>
                {(title || icon || onClose || headerExtra) && (
                  <div className="modal-header d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2 flex-grow-1">
                  {icon && (
                    <Icon name={icon} className="text-muted" />
                  )}
                      {title && <TitleTag className="modal-title mb-0">{title}</TitleTag>}
                    </div>
                    <div className="d-flex align-items-center gap-1 ms-auto flex-shrink-0">
                      {headerExtra}
                      {onClose && (
                        <button
                          type="button"
                          className="btn-close"
                          onClick={onClose}
                          aria-label={t('common.close')}
                          disabled={closeDisabled}
                        />
                      )}
                    </div>
                  </div>
                )}
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
              </form>
            ) : (
              <>
                {(title || icon || onClose || headerExtra) && (
                  <div className="modal-header d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2 flex-grow-1">
                  {icon && (
                    <Icon name={icon} className="text-muted" />
                  )}
                      {title && <TitleTag className="modal-title mb-0">{title}</TitleTag>}
                    </div>
                    <div className="d-flex align-items-center gap-1 ms-auto flex-shrink-0">
                      {headerExtra}
                      {onClose && (
                        <button
                          type="button"
                          className="btn-close"
                          onClick={onClose}
                          aria-label={t('common.close')}
                          disabled={closeDisabled}
                        />
                      )}
                    </div>
                  </div>
                )}
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={backdropStyle} />
    </>
  );
}
