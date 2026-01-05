import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Modal from './Modal'
import './Header.css'

function Header({ onBack, onHome, showLogo }) {
    const { user, signInWithGoogle, signOut } = useAuth()
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)

    const handleProfileClick = () => {
        if (user) {
            setShowProfileMenu(!showProfileMenu)
        } else {
            setShowAuthModal(true)
        }
    }

    const handleSignIn = async () => {
        try {
            await signInWithGoogle()
            setShowAuthModal(false)
        } catch (error) {
            console.error('Error signing in:', error)
            alert('Erro ao fazer login. Tente novamente.')
        }
    }

    const handleSignOut = async () => {
        try {
            await signOut()
            setShowProfileMenu(false)
        } catch (error) {
            console.error('Error signing out:', error)
            alert('Erro ao sair. Tente novamente.')
        }
    }

    return (
        <>
            <header className="header">
                <div className="header-content">
                    {onBack ? (
                        <button
                            className="header-btn back-btn"
                            onClick={onBack}
                            aria-label="Voltar"
                        >
                            <span className="material-symbols-rounded">arrow_back</span>
                        </button>
                    ) : (
                        <div className="logo" onClick={onHome}>
                            <div className="logo-icon">
                                <span className="material-symbols-rounded">menu_book</span>
                            </div>
                            <h1 className="logo-text">
                                Resume<span className="logo-accent">Aí</span>
                            </h1>
                        </div>
                    )}

                    {onBack && (
                        <div 
                            className="logo logo-center" 
                            onClick={onHome}
                        >
                            <div className="logo-icon logo-icon-small">
                                <span className="material-symbols-rounded">menu_book</span>
                            </div>
                            <span className="logo-text logo-text-small">
                                Resume<span className="logo-accent">Aí</span>
                            </span>
                        </div>
                    )}

                    <div className="profile-container">
                        <button 
                            className="header-btn profile-btn" 
                            aria-label="Perfil"
                            onClick={handleProfileClick}
                        >
                            {user?.user_metadata?.avatar_url ? (
                                <img 
                                    src={user.user_metadata.avatar_url} 
                                    alt={user.user_metadata.full_name || 'Usuário'}
                                    className="profile-avatar"
                                />
                            ) : (
                                <span className="material-symbols-rounded">person</span>
                            )}
                        </button>

                        {showProfileMenu && user && (
                            <div className="profile-menu">
                                <div className="profile-info">
                                    <p className="profile-name">{user.user_metadata?.full_name || 'Usuário'}</p>
                                    <p className="profile-email">{user.email}</p>
                                </div>
                                <button className="profile-menu-item" onClick={handleSignOut}>
                                    <span className="material-symbols-rounded">logout</span>
                                    Sair
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {showAuthModal && (
                <Modal
                    title="Login"
                    onClose={() => setShowAuthModal(false)}
                    width="400px"
                >
                    <div className="auth-modal-content">
                        <p className="auth-description">
                            Faça login para salvar seus resumos e acessá-los de qualquer dispositivo.
                        </p>
                        <button 
                            className="google-signin-btn"
                            onClick={handleSignIn}
                        >
                            <svg className="google-icon" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continuar com Google
                        </button>
                    </div>
                </Modal>
            )}
        </>
    )
}

export default Header
