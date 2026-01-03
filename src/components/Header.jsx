import './Header.css'

function Header({ onBack, onHome, showLogo }) {
    return (
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

                <button className="header-btn profile-btn" aria-label="Perfil">
                    <span className="material-symbols-rounded">person</span>
                </button>
            </div>
        </header>
    )
}

export default Header
