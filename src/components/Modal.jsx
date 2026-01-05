import { useEffect } from 'react'
import './Modal.css'

function Modal({ isOpen, title, message, type = 'info', onClose, showCloseButton = true }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    const icons = {
        success: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
        ),
        error: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
        ),
        warning: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
        info: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
        )
    }

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && showCloseButton) {
            onClose()
        }
    }

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className={`modal modal-${type}`}>
                <div className="modal-header">
                    <div className="modal-icon">
                        {icons[type]}
                    </div>
                    {showCloseButton && (
                        <button className="modal-close" onClick={onClose} aria-label="Fechar modal">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>

                {title && <h2 className="modal-title">{title}</h2>}

                <div className="modal-content">
                    {typeof message === 'string' ? (
                        message.split('\n').map((paragraph, index) => (
                            paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
                        ))
                    ) : (
                        message
                    )}
                </div>

                {showCloseButton && (
                    <div className="modal-footer">
                        <button className="btn btn-primary" onClick={onClose}>
                            Entendi
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Modal
