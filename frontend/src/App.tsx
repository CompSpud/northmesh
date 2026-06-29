import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import NetworkPage from './pages/NetworkPage'
import FlasherPage from './pages/FlasherPage'
import PortalPage from './pages/PortalPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="network" element={<NetworkPage />} />
        <Route path="flasher" element={<FlasherPage />} />
        <Route path="portal" element={<PortalPage />} />
      </Route>
    </Routes>
  )
}

export default App
