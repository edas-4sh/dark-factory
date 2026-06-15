import { Routes, Route, NavLink } from 'react-router-dom';
import { AuthGate } from './components/AuthGate';
import { IconDashboard, IconAgents, IconQueue, IconReviews, IconSettings, IconServer } from './components/icons';
import Overview from './pages/Overview';
import Agents from './pages/Agents';
import Queue from './pages/Queue';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';

const NAV_ITEMS = [
  { to: '/', end: true, label: 'Dashboard', icon: IconDashboard },
  { to: '/agents', label: 'Agents', icon: IconAgents },
  { to: '/queue', label: 'Queue', icon: IconQueue },
  { to: '/reviews', label: 'Reviews', icon: IconReviews },
  { to: '/settings', label: 'Settings', icon: IconSettings },
];

export default function App() {
  return (
    <AuthGate>
      <div className="app-container">
        <nav className="navbar">
          <div className="navbar-inner">
            <div className="navbar-brand">
              <div className="navbar-brand-icon">
                <IconServer size={16} />
              </div>
              EDAS
            </div>
            <div className="navbar-links">
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <item.icon size={14} />
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
    </AuthGate>
  );
}
