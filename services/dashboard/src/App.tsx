import { Routes, Route, NavLink } from 'react-router-dom';
import Overview from './pages/Overview';
import Agents from './pages/Agents';
import Queue from './pages/Queue';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';

const NAV_ITEMS = [
  { to: '/', end: true, label: 'Overview', icon: '📊' },
  { to: '/agents', label: 'Agents', icon: '🤖' },
  { to: '/queue', label: 'Queue', icon: '📋' },
  { to: '/reviews', label: 'Reviews', icon: '👁️' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function App() {
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <div className="navbar-brand-icon">🏭</div>
            EDAS — Dark Factory
          </div>
          <div className="navbar-links">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <main className="main-content">
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
