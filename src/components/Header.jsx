import './Header.css'

function Header({ onBack, onHome, showLogo }) {
    return (
        <header className="header">
            <div className="header-content">
                {onBack && (
                    <button
                        className="header-btn back-btn"
                        onClick={onBack}
                        aria-label="Voltar"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                <div
                    className={`logo ${showLogo ? 'logo-visible' : ''}`}
                    onClick={onHome}
                >
                    <div className="logo-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="10" r="3" fill="currentColor" />
                        </svg>
                    </div>
                    <span className="logo-text">BookSum</span>
                </div>

                <div className="header-spacer"></div>
            </div>
        </header>
    )
}

export default Header
