import React, { useState, useEffect } from 'react';
import { getComplaints, triggerEscalation, previewEscalation } from '../services/api';
import AdminDashboard from './AdminDashboard';

const DEPARTMENTS = [
  'Roads & Infrastructure',
  'Sanitation & Solid Waste',
  'Water & Sewage',
  'Electrical & Streetlights',
  'Public Safety & General',
];

export default function SuperAdminDashboard({ user }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' or 'operations'
  const [escalationResult, setEscalationResult] = useState(null);
  const [escalating, setEscalating] = useState(false);
  const [escalationPreview, setEscalationPreview] = useState(null);

  useEffect(() => {
    fetchSystemMetrics();
  }, []);

  const fetchSystemMetrics = async () => {
    try {
      setLoading(true);
      const data = await getComplaints();
      setComplaints(Array.isArray(data) ? data : data.complaints || []);
    } catch (err) {
      console.error("Failed to load admin metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalReports = complaints.length;
  const resolvedCount = complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;
  const pendingCount = complaints.filter(c => (c.status || '').toLowerCase() !== 'resolved').length;

  const handlePreviewEscalation = async () => {
    try {
      const data = await previewEscalation();
      setEscalationPreview(data);
    } catch (err) {
      setEscalationResult({ error: err.message });
    }
  };

  const handleEscalate = async () => {
    setEscalating(true);
    setEscalationResult(null);
    try {
      const data = await triggerEscalation();
      setEscalationResult(data);
      setEscalationPreview(null);
      fetchSystemMetrics(); // Refresh data after escalation
    } catch (err) {
      setEscalationResult({ error: err.message });
    } finally {
      setEscalating(false);
    }
  };

  const countByDept = (dept) => {
    return complaints.filter(c => c.department === dept).length;
  };

  if (activeTab === 'operations') {
    return (
      <div>
        <div style={{ background: '#2D1810', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#FAF8F5', fontSize: '0.88rem', fontWeight: '700' }}>
            ⚡ Super Admin Mode: Operational Ticket Manager
          </span>
          <button
            onClick={() => setActiveTab('telemetry')}
            style={{ background: '#F2673A', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem' }}
          >
            &larr; Back to System Telemetry
          </button>
        </div>
        <AdminDashboard user={user} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      
      {/* Super Admin Top Header */}
      <div style={{ background: 'linear-gradient(135deg, #2D1810 0%, #1A1513 100%)', color: '#FAF8F5', padding: '1.8rem 2rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#F2673A', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Global Governance & Audit Portal
          </div>
          <h2 style={{ margin: '0.2rem 0 0.4rem 0', fontWeight: '800' }}>⚡ Super Admin System Console</h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#A39B92' }}>Logged in as System Admin: {user?.name || 'Administrator'} ({user?.email})</p>
        </div>
        <button
          onClick={() => setActiveTab('operations')}
          style={{
            background: '#F2673A',
            color: '#FAF8F5',
            border: 'none',
            padding: '0.7rem 1.25rem',
            borderRadius: '6px',
            fontWeight: '700',
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          Open Ticket Operations Grid &rarr;
        </button>
      </div>

      {/* Analytics KPI Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
        <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '10px', border: '1px solid #E5E0D8' }}>
          <div style={{ fontSize: '0.8rem', color: '#736B63', fontWeight: '700' }}>Total City Submissions</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#29221F', marginTop: '0.2rem' }}>{totalReports}</div>
        </div>
        <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '10px', border: '1px solid #E5E0D8' }}>
          <div style={{ fontSize: '0.8rem', color: '#736B63', fontWeight: '700' }}>Resolved Infrastructure Issues</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#137333', marginTop: '0.2rem' }}>{resolvedCount}</div>
        </div>
        <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '10px', border: '1px solid #E5E0D8' }}>
          <div style={{ fontSize: '0.8rem', color: '#736B63', fontWeight: '700' }}>Active Unresolved Tickets</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#991B1B', marginTop: '0.2rem' }}>{pendingCount}</div>
        </div>
      </div>

      {/* Phase 5: Escalation Controls */}
      <div style={{ background: '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #E5E0D8', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: '800', color: '#29221F', fontSize: '0.95rem' }}>
            ⏰ Overdue Complaint Escalation
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handlePreviewEscalation}
              style={{ background: '#3498DB', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}
            >
              Preview Overdue
            </button>
            <button
              onClick={handleEscalate}
              disabled={escalating}
              style={{ background: escalating ? '#999' : '#E74C3C', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '4px', cursor: escalating ? 'default' : 'pointer', fontWeight: '700', fontSize: '0.8rem' }}
            >
              {escalating ? 'Escalating...' : '🚨 Escalate Overdue'}
            </button>
          </div>
        </div>

        {escalationPreview && (
          <div style={{ background: '#EBF5FB', padding: '0.75rem', borderRadius: '6px', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <strong>{escalationPreview.count}</strong> complaint{escalationPreview.count !== 1 ? 's' : ''} eligible for escalation.
            {escalationPreview.count > 0 && (
              <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                {escalationPreview.complaints.slice(0, 5).map((c) => (
                  <li key={c._id} style={{ marginBottom: '0.25rem' }}>
                    {c.title} — <em>{c.status}</em> — {c.priority || 'unset'} priority
                  </li>
                ))}
                {escalationPreview.count > 5 && <li>...and {escalationPreview.count - 5} more</li>}
              </ul>
            )}
          </div>
        )}

        {escalationResult && !escalationResult.error && (
          <div style={{ background: '#E8F5E9', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: '#2E7D32' }}>
            ✅ {escalationResult.message}
          </div>
        )}
        {escalationResult && escalationResult.error && (
          <div style={{ background: '#FFEBEE', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: '#C62828' }}>
            ❌ {escalationResult.error}
          </div>
        )}
      </div>

      {/* Sector Breakdown Grid */}
      <div style={{ background: '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #E5E0D8', marginBottom: '2rem' }}>
        <div style={{ fontWeight: '800', color: '#29221F', marginBottom: '1rem', fontSize: '0.95rem' }}>
          🏛️ Tickets by Municipal Sector
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem' }}>
          {DEPARTMENTS.map(d => (
            <div key={d} style={{ background: '#FAF8F5', border: '1px solid #E5E0D8', padding: '0.8rem 1rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#736B63', fontWeight: '600' }}>{d}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#29221F', marginTop: '0.2rem' }}>
                {countByDept(d)} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#736B63' }}>tickets</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit System Log Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #E5E0D8', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', background: '#F7F5F0', borderBottom: '1px solid #E5E0D8', fontWeight: '800', color: '#29221F' }}>
          📋 System-Wide Telemetry & Audit Trail
        </div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#736B63' }}>Loading system logs...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#29221F', color: '#FAF8F5', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Ticket Title</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Assigned Sector</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date Reported</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((item) => (
                  <tr key={item._id} style={{ borderBottom: '1px solid #F0ECE1' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{item.title}</td>
                    <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>{item.category}</td>
                    <td style={{ padding: '0.75rem 1rem', color: item.department ? '#29221F' : '#736B63' }}>
                      {item.department || 'Unassigned'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: (item.status || '').toLowerCase() === 'resolved' ? '#137333' : '#F2673A' }}>
                      {item.status || 'Submitted'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#736B63' }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                  </tr>
                ))}
                {complaints.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#736B63' }}>
                      No community tickets reported yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
