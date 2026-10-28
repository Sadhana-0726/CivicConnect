// client/src/pages/MapPage.jsx
import { useEffect, useState } from 'react';
import IssueMap from '../components/IssueMap';
import { getComplaints, getLatLng } from '../services/api';

export default function MapPage() {
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [heatmapMode, setHeatmapMode] = useState(false);

  useEffect(() => {
    getComplaints()
      .then(setIssues)
      .catch(() => setError('Could not load reported issues. Is the server running on port 5000?'))
      .finally(() => setLoading(false));
  }, []);

  const issuesWithLocation = issues.filter((i) => getLatLng(i) !== null);

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">Map view</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <p className="page-lead" style={{ margin: 0 }}>
            {loading
              ? 'Loading reports...'
              : `${issues.length} reported ${issues.length === 1 ? 'issue' : 'issues'}${
                  issuesWithLocation.length < issues.length
                    ? ` (${issuesWithLocation.length} with location data)`
                    : ''
                }`}
          </p>
          {!loading && issuesWithLocation.length > 0 && (
            <button
              onClick={() => setHeatmapMode(!heatmapMode)}
              style={{
                background: heatmapMode ? '#E74C3C' : '#3498DB',
                color: '#fff',
                border: 'none',
                padding: '0.45rem 1rem',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {heatmapMode ? '📍 Switch to Marker View' : '🔥 Switch to Heatmap View'}
            </button>
          )}
        </div>
        {error && <div className="alert alert--error" role="alert">{error}</div>}
        {!loading && issuesWithLocation.length === 0 && issues.length > 0 && (
          <div style={{ padding: '1rem', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: '8px', marginBottom: '0.75rem', color: '#795548' }}>
            No location data available for map visualization. Complaints exist but have no coordinates.
          </div>
        )}
        <IssueMap issues={issues} height="70vh" heatmapMode={heatmapMode} />
      </div>
    </section>
  );
}
