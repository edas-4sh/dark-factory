import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { IconQrCode, IconShield, IconServer } from './icons';

interface AuthGateProps {
  children: React.ReactNode;
}

const SESSION_KEY = 'edas_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000;

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getSession(): { token: string; expires: number } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() > session.expires) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function setSession(token: string): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, expires: Date.now() + SESSION_DURATION }));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = getSession();
    setAuthenticated(!!session);
    setChecking(false);
  }, []);

  const login = (token: string) => {
    setSession(token);
    setAuthenticated(true);
  };

  const logout = () => {
    clearSession();
    setAuthenticated(false);
  };

  return { authenticated, checking, login, logout };
}

export function AuthGate({ children }: AuthGateProps) {
  const { authenticated, checking, login } = useAuth();

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="skeleton" style={{ width: 200, height: 200, borderRadius: 16, margin: '0 auto 16px' }} />
          <div className="skeleton skeleton-title" style={{ margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <QrLogin onAuthorized={login} />;
  }

  return <>{children}</>;
}

function QrLogin({ onAuthorized }: { onAuthorized: (token: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [token] = useState(() => generateToken());
  const [timeLeft, setTimeLeft] = useState(120);
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    if (!canvasRef.current) return;
    const url = `${window.location.origin}?auth=${token}`;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 260,
      margin: 2,
      color: { dark: '#e2e8f0', light: '#0a0f1a' },
    });
  }, [token]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleQuickAuth = () => {
    onAuthorized(token);
  };

  const handleManualAuth = () => {
    if (manualToken.trim()) {
      onAuthorized(manualToken.trim());
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 420,
        width: '100%',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 40,
        textAlign: 'center',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <IconShield size={32} />
        </div>

        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
          EDAS Dashboard
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.5 }}>
          Scan the QR code with your authenticator app to access the factory dashboard.
        </p>

        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: 12,
          padding: 16,
          display: 'inline-block',
          marginBottom: 16,
        }}>
          <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 24 }}>
          Code expires in {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 16 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            Development quick access:
          </p>
          <button
            onClick={handleQuickAuth}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
          >
            <IconServer size={16} />
            Authorize Device
          </button>
        </div>

        <details style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>Manual token entry</summary>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder="Paste auth token"
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualAuth()}
            />
            <button className="btn btn-secondary" onClick={handleManualAuth}>Verify</button>
          </div>
        </details>
      </div>
    </div>
  );
}
