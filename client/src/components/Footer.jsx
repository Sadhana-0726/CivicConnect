import { useEffect, useState } from 'react';

const API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000/api';

/**
 * Fetches /api/health to determine whether the backend is reachable.
 * Returns one of: 'loading' | 'ok' | 'unavailable'
 */
function usePlatformHealth() {
  const [state, setState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(4000) })
      .then((r) => {
        if (!cancelled) setState(r.ok ? 'ok' : 'unavailable');
      })
      .catch(() => {
        if (!cancelled) setState('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** Category keys match ComplaintForm's CATEGORY_MAP exactly. */
const CATEGORY_BADGES = [
  { key: 'sanitation', label: '🗑️ Sanitation', emoji: '🗑️', name: 'Sanitation' },
  { key: 'road',       label: '🛣️ Roads',       emoji: '🛣️', name: 'Roads' },
  { key: 'water',      label: '💧 Water',        emoji: '💧', name: 'Water' },
  { key: 'streetlight',label: '💡 Streetlights', emoji: '💡', name: 'Streetlights' },
];

export default function Footer() {
  const health = usePlatformHealth();

  const healthIndicator = () => {
    if (health === 'loading') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#9D9488' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6B6560', display: 'inline-block' }} />
          Checking platform status…
        </span>
      );
    }
    if (health === 'ok') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#6FCF97' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6FCF97', boxShadow: '0 0 4px #6FCF97', display: 'inline-block' }} />
          CivicConnect Platform — Online
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#9D9488' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9D9488', display: 'inline-block' }} />
        CivicConnect Platform — Status Unavailable
      </span>
    );
  };

  return (
    <footer className="footer" aria-label="Site footer">
      <div className="footer__inner">
        {/* ── Column 1: Branding ── */}
        <div className="footer__col">
          <a href="#/" className="footer__brand" aria-label="CivicConnect home">
            <span className="footer__brand-mark" aria-hidden="true" />
            CivicConnect
          </a>
          <p className="footer__tagline">Pinpoint. Report. Resolve.</p>
          <p className="footer__mission">
            Connecting citizens and municipal teams to report, track, and resolve civic issues
            transparently.
          </p>
        </div>

        {/* ── Column 2: Quick Links ── */}
        <div className="footer__col">
          <h3 className="footer__heading">Quick Links</h3>
          <nav aria-label="Footer quick links">
            <ul className="footer__list">
              <li><a href="#/"          className="footer__link">Home</a></li>
              <li><a href="#/report"    className="footer__link">Report Issue</a></li>
              <li><a href="#/map"       className="footer__link">Live Map</a></li>
              {/* Staff Portal respects existing RBAC — unauthenticated users are shown a login prompt */}
              <li><a href="#/admin"     className="footer__link">Staff Portal</a></li>
            </ul>
          </nav>
        </div>

        {/* ── Column 3: Departments ── */}
        <div className="footer__col">
          <h3 className="footer__heading">Departments</h3>
          <ul className="footer__list">
            {CATEGORY_BADGES.map(({ key, name }) => (
              <li key={key}>
                {/* Navigate to report page with category hash — handled by ComplaintForm's CATEGORY_MAP */}
                <a
                  href={`#/report?category=${key}`}
                  className="footer__link"
                  aria-label={`Report a ${name} issue`}
                >
                  {name}
                </a>
              </li>
            ))}
            <li>
              <a href="#/report?category=electricity" className="footer__link" aria-label="Report an Electrical issue">
                Electrical
              </a>
            </li>
          </ul>
        </div>

        {/* ── Column 4: Contact & Support ── */}
        <div className="footer__col">
          <h3 className="footer__heading">Contact &amp; Support</h3>
          <p style={{ fontSize: '0.83rem', color: '#9D9488', marginBottom: '0.75rem', lineHeight: '1.55' }}>
            For technical support with the CivicConnect platform, use the report form or contact
            your local administrator.
          </p>
          <p style={{ fontSize: '0.83rem', color: '#9D9488', marginBottom: '0.35rem' }}>
            <strong style={{ color: '#CFC6BA' }}>Helpline (placeholder):</strong>
          </p>
          <p style={{ fontSize: '0.9rem', color: '#CFC6BA', fontWeight: '600', marginBottom: '0.25rem' }}>
            1800-123-4567
          </p>
          <p style={{ fontSize: '0.72rem', color: '#6B6560', fontStyle: 'italic', marginTop: 0 }}>
            * Demo number — not a verified official helpline.
          </p>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="footer__bottom">
        <span className="footer__copy">© 2026 CivicConnect</span>
        <span className="footer__status">{healthIndicator()}</span>
      </div>
    </footer>
  );
}

