import React, { useState, useEffect } from 'react';
import { getMyComplaints } from '../services/api';

export default function ReportPage() {
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTimelineId, setExpandedTimelineId] = useState(null);

  useEffect(() => {
    getMyComplaints()
      .then((data) => {
        setMyReports(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Please sign in to view your submitted reports.');
        setLoading(false);
      });
  }, []);

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'resolved':
        return { bg: '#E6F4EA', text: '#137333', border: '#A8DADC' };
      case 'in progress':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
      case 'assigned':
        return { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' };
      case 'under review':
        return { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' };
      case 'rejected':
        return { bg: '#FDF2F2', text: '#991B1B', border: '#F87171' };
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };
    }
  };

  const getPriorityBadge = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'urgent':
      case 'high':
        return { bg: '#FDF2F2', color: '#991B1B', label: '🔥 High' };
      case 'medium':
        return { bg: '#FEF3C7', color: '#92400E', label: '⚡ Medium' };
      default:
        return { bg: '#F3F4F6', color: '#4B5563', label: '🟢 Low' };
    }
  };

  const toggleTimeline = (id) => {
    setExpandedTimelineId((prev) => (prev === id ? null : id));
  };

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '850px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#29221F', margin: '0 0 0.3rem 0' }}>
            My Submitted Reports
          </h1>
          <p style={{ color: '#736B63', margin: 0, fontSize: '0.95rem' }}>
            Track real-time status updates and resolution progress for your reported civic issues.
          </p>
        </div>
        <a 
          href="#/report" 
          style={{ background: '#F2673A', color: '#ffffff', padding: '0.65rem 1.25rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem' }}
        >
          + New Report
        </a>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#736B63' }}>Loading your submitted reports...</div>
      ) : error ? (
        <div style={{ background: '#FDF2F2', border: '1px solid #F87171', color: '#991B1B', padding: '1.25rem', borderRadius: '8px', textAlign: 'center' }}>
          {error}
        </div>
      ) : myReports.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid #E5E0D8', borderRadius: '12px', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#29221F' }}>No reports filed yet</h3>
          <p style={{ color: '#736B63', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            You haven't submitted any civic issue reports with this account.
          </p>
          <a href="#/report" style={{ background: '#F2673A', color: '#ffffff', padding: '0.65rem 1.25rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '700' }}>
            Report an Issue Now
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {myReports.map((item, index) => {
            const statusStyle = getStatusColor(item.status);
            const prioStyle = getPriorityBadge(item.priority);
            const isExpanded = expandedTimelineId === (item._id || index);
            const history = item.statusHistory || [];

            return (
              <div 
                key={item._id || index} 
                style={{ background: '#ffffff', border: '1px solid #E5E0D8', padding: '1.4rem', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}
              >
                {/* Header Tags */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', background: '#F7F5F0', border: '1px solid #E5E0D8', color: '#29221F', padding: '0.25rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                      {item.category || 'General'}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', background: prioStyle.bg, color: prioStyle.color, padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                      {prioStyle.label}
                    </span>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    background: statusStyle.bg,
                    color: statusStyle.text,
                    border: `1px solid ${statusStyle.border}`,
                  }}>
                    {item.status || 'Submitted'}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 0.5rem 0', color: '#29221F', fontSize: '1.15rem', fontWeight: '700' }}>
                  {item.title}
                </h3>
                
                <p style={{ margin: '0 0 0.75rem 0', color: '#524B43', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {item.description}
                </p>

                {/* Location and Department Details */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.825rem', color: '#736B63', marginBottom: '0.75rem' }}>
                  {item.location?.address && (
                    <div>📍 <strong>Location:</strong> {item.location.address}</div>
                  )}
                  {item.department && (
                    <div>🏛️ <strong>Sector:</strong> {item.department}</div>
                  )}
                  {item.createdAt && (
                    <div>🗓️ <strong>Filed:</strong> {new Date(item.createdAt).toLocaleDateString()}</div>
                  )}
                </div>

                {/* Photo attachment if available */}
                {item.photo && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <img 
                      src={item.photo} 
                      alt="Complaint proof" 
                      style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '6px', border: '1px solid #E5E0D8', objectFit: 'cover' }} 
                    />
                  </div>
                )}

                {/* Officer Resolution Notes */}
                {(item.officerNotes || item.resolutionNotes) && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#166534' }}>
                    <strong>👷 Field Inspector Remarks:</strong> {item.officerNotes || item.resolutionNotes}
                    {item.resolutionPhoto && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <a href={item.resolutionPhoto} target="_blank" rel="noopener noreferrer" style={{ color: '#166534', fontWeight: '700', textDecoration: 'underline' }}>
                          View Resolution Proof Photo &rarr;
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Status History Timeline Toggle */}
                {history.length > 0 && (
                  <div style={{ borderTop: '1px solid #F0ECE1', paddingTop: '0.65rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => toggleTimeline(item._id || index)}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#F2673A', fontSize: '0.825rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      {isExpanded ? '▲ Hide Status Timeline' : `▼ View Status History (${history.length} update${history.length > 1 ? 's' : ''})`}
                    </button>

                    {isExpanded && (
                      <div style={{ marginTop: '0.75rem', paddingLeft: '0.5rem', borderLeft: '2px solid #E5E0D8' }}>
                        {history.map((entry, hIdx) => (
                          <div key={entry._id || hIdx} style={{ marginBottom: '0.6rem', position: 'relative', paddingLeft: '0.75rem' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.825rem', color: '#29221F' }}>
                              {entry.status} &mdash; <span style={{ fontWeight: 'normal', color: '#736B63', fontSize: '0.75rem' }}>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}</span>
                            </div>
                            {entry.notes && (
                              <div style={{ fontSize: '0.785rem', color: '#736B63', marginTop: '0.15rem' }}>
                                {entry.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
