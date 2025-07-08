import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import UrlDetailPage from './pages/UrlDetailPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        {/* Route with dynamic :id to show details of a specific URL */}
        <Route path="/url/:id" element={<UrlDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App