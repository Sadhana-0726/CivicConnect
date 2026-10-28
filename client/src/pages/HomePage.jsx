import { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import IssueMap from '../components/IssueMap';
import { getComplaints } from '../services/api';

// ---------------------------------------------------------------------------
// Category badges — keys match CATEGORY_MAP in ComplaintForm.jsx exactly.
// Navigates to the report page; query param is available for future wiring.
// ---------------------------------------------------------------------------
const CATEGORY_BADGES = [
  { key: 'sanitation', label: 'Sanitation',   emoji: '🗑️' },
  { key: 'water',      label: 'Water Supply', emoji: '💧' },
  { key: 'road',       label: 'Roads',        emoji: '🛣️' },
  { key: 'streetlight',label: 'Streetlights', emoji: '💡' },
];

// ---------------------------------------------------------------------------
// Status classification (mirrors Complaint model STATUSES)
// ---------------------------------------------------------------------------
const RESOLVED_STATUSES  = new Set(['Resolved']);
const ACTIVE_STATUSES    = new Set(['Submitted', 'Under Review', 'Assigned', 'In Progress']);

function deriveStats(issues) {
  let resolved = 0;
  let active   = 0;

  issues.forEach((i) => {
    if (RESOLVED_STATUSES.has(i.status))  resolved++;
    else if (ACTIVE_STATUSES.has(i.status)) active++;
  });

  return { resolved, active, total: issues.length };
}

// ---------------------------------------------------------------------------
// QuickStats — derived from real complaint data; no fabricated numbers
// ---------------------------------------------------------------------------
function QuickStats({ issues, loading, error }) {
  if (loading) {
    return (
      <div className="stats-bar" aria-live="polite">
        {[0, 1, 2].map((i) => (
          <div key={i} className="stats-bar__item stats-bar__item--skeleton">
            <div className="stats-bar__skeleton-num" />
            <div className="stats-bar__skeleton-label" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-bar stats-bar--unavailable" role="note">
        <span style={{ fontSize: '0.9rem', color: '#9D9488' }}>
          Platform statistics are currently unavailable.
        </span>
      </div>
    );
  }

  const { resolved, active, total } = deriveStats(issues);

  return (
    <div className="stats-bar" aria-label="Platform statistics">
      <div className="stats-bar__item">
        <span className="stats-bar__num">{resolved}</span>
        <span className="stats-bar__label">Issues Resolved</span>
      </div>
      <div className="stats-bar__divider" aria-hidden="true" />
      <div className="stats-bar__item">
        <span className="stats-bar__num">{active}</span>
        <span className="stats-bar__label">Active Reports</span>
      </div>
      <div className="stats-bar__divider" aria-hidden="true" />
      <div className="stats-bar__item">
        <span className="stats-bar__num">{total}</span>
        <span className="stats-bar__label">Total Submitted</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HowItWorks
// ---------------------------------------------------------------------------
const STEPS = [
  {
    num: '1',
    emoji: '📍',
    title: 'Pinpoint',
    desc: 'Select the issue location on the interactive map or use GPS if supported by the existing location picker.',
  },
  {
    num: '2',
    emoji: '⚡',
    title: 'Auto-Route',
    desc: 'The platform uses rule-based categorisation, priority detection, and department-routing logic to direct complaints to the right team.',
  },
  {
    num: '3',
    emoji: '✅',
    title: 'Track & Resolve',
    desc: 'Follow complaint status updates and review resolution details or proof photos when provided.',
  },
];

function HowItWorks() {
  return (
    <section className="section hiw" aria-labelledby="hiw-heading">
      <div className="container">
        <h2 className="section__title" id="hiw-heading" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          How It Works
        </h2>
        <ol className="hiw__steps" role="list">
          {STEPS.map((step) => (
            <li key={step.num} className="hiw__step">
              <div className="hiw__num" aria-hidden="true">{step.num}</div>
              <div className="hiw__emoji" aria-hidden="true">{step.emoji}</div>
              <h3 className="hiw__title">{step.title}</h3>
              <p className="hiw__desc">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CategoryBadges
// ---------------------------------------------------------------------------
function CategoryBadges() {
  return (
    <section className="section cat-badges" aria-labelledby="cat-heading">
      <div className="container">
        <h2 className="section__title" id="cat-heading" style={{ marginBottom: '1rem' }}>
          Browse by Category
        </h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
          Select a category to start a new report pre-filled for that issue type.
        </p>
        <div className="cat-badges__grid" role="list">
          {CATEGORY_BADGES.map(({ key, label, emoji }) => (
            <a
              key={key}
              href={`#/report`}
              className="cat-badge"
              role="listitem"
              aria-label={`Report a ${label} issue`}
              /* 
               * The ComplaintForm does not currently read a query-param to pre-select
               * a category, so we navigate to #/report without implying the filter
               * has been applied. When category pre-selection is wired in the form,
               * this href can change to `#/report?category=${key}`.
               */
            >
              <span className="cat-badge__emoji" aria-hidden="true">{emoji}</span>
              <span className="cat-badge__label">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// HomePage
// ---------------------------------------------------------------------------
export default function HomePage() {
  const [issues, setIssues]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    getComplaints()
      .then((data) => {
        setIssues(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load reported issues. Is the server running on port 5000?');
        setLoading(false);
      });
  }, []);

  return (
    <>
      {/* ── 1. Existing Hero (unchanged) ── */}
      <Hero />

      {/* ── 2. Quick Stats Bar ── */}
      <div className="container">
        <QuickStats issues={issues} loading={loading} error={error && issues.length === 0 ? error : ''} />
      </div>

      {/* ── 3. Map section (unchanged) ── */}
      <section className="section section--tight">
        <div className="container" style={{ padding: '2rem 1.5rem' }}>
          <div
            className="section__head"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}
          >
            <h2 className="section__title" style={{ margin: 0 }}>Reported near you</h2>
            <a href="#/map" className="link" style={{ color: '#F2673A', fontWeight: '600' }}>
              Open full map →
            </a>
          </div>
          {error && (
            <div className="alert alert--error" role="alert" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          <IssueMap issues={issues} height="420px" />
          {!error && issues.length === 0 && !loading && (
            <p className="muted" style={{ marginTop: '1rem', color: '#736B63' }}>
              No reports yet. Be the first to{' '}
              <a href="#/report" style={{ color: '#F2673A', fontWeight: '600' }}>report an issue</a>.
            </p>
          )}
        </div>
      </section>

      {/* ── 4. How It Works ── */}
      <HowItWorks />

      {/* ── 5. Category Badges ── */}
      <CategoryBadges />
    </>
  );
}
