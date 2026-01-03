import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App isAdminMode={false} />} />
        <Route path="/adm030973" element={<App isAdminMode={true} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Router
