import { useEffect } from 'react'
import './Modal.css'

function Modal({ isOpen, title, message, type = 'info', onClose, showCloseButton = true, onRetry = null, retryButtonText = 'Tentar Novamente', actions = null }) {
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
                            paragraph.trim() ? (
                                <p key={index} style={{ color: '#000', fontSize: '16px', margin: '0 0 16px 0' }}>
                                    {paragraph}
                                </p>
                            ) : (
                                <br key={index} />
                            )
                        ))
                    ) : (
                        message
                    )}
                </div>

                {(!actions || actions.length > 0) && (
                    <div className="modal-footer">
                        {actions ? (
                            actions.map((action, index) => (
                                <button 
                                    key={index}
                                    className={action.isGoogle ? 'btn btn-google' : (action.isPrimary ? 'btn btn-primary' : 'btn btn-secondary')}
                                    onClick={action.onClick}
                                >
                                    {action.isGoogle && (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                        </svg>
                                    )}
                                    {action.label}
                                </button>
                            ))
                        ) : (
                            <>
                                {onRetry && (
                                    <button className="btn btn-accent" onClick={() => {
                                        onClose()
                                        onRetry()
                                    }}>
                                        {retryButtonText}
                                    </button>
                                )}
                                <button className="btn btn-primary" onClick={onClose}>
                                    {onRetry ? 'Cancelar' : 'Entendi'}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Modal
