import './BottomNav.css'

function BottomNav({ currentView, onNavigate }) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-content">
        <button
          className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => onNavigate('home')}
        >
          <span className="material-symbols-rounded">search</span>
          <span className="nav-label">Buscar</span>
        </button>
        
        <button
          className={`nav-item ${currentView === 'library' ? 'active' : ''}`}
          onClick={() => onNavigate('library')}
        >
          <span className="material-symbols-rounded">menu_book</span>
          <span className="nav-label">Biblioteca</span>
        </button>
      </div>
    </nav>
  )
}

export default BottomNav
