import { Routes, Route, NavLink } from 'react-router-dom';
import Overview from './pages/Overview';
import Agents from './pages/Agents';
import Queue from './pages/Queue';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`;

export default function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: '#f3f4f6' }}>
      <nav style={{ backgroundColor: '#1f2937', borderBottom: '1px solid #374151' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: '56px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', marginRight: '32px' }}>🏭 Dark Factory</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <NavLink to="/" end className={linkClass}>Overview</NavLink>
              <NavLink to="/agents" className={linkClass}>Agents</NavLink>
              <NavLink to="/queue" className={linkClass}>Queue</NavLink>
              <NavLink to="/reviews" className={linkClass}>Reviews</NavLink>
              <NavLink to="/settings" className={linkClass}>Settings</NavLink>
            </div>
          </div>
        </div>
      </nav>
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agents/:id" element={<Agents />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
