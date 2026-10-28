import React, { useState, useEffect } from 'react';
import { getComplaints, updateComplaintStatus } from '../services/api';

export default function InspectorDashboard({ user }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Inspector Action Modal State
  const [selectedTask, setSelectedTask] = useState(null);
  const [officerNotes, setOfficerNotes] = useState('');
  const [proofPhoto, setProofPhoto] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  useEffect(() => {
    fetchAssignedIssues();
  }, []);

  const fetchAssignedIssues = async () => {
    try {
      setLoading(true);
      const data = await getComplaints();
      setComplaints(Array.isArray(data) ? data : data.complaints || []);
    } catch (err) {
      console.error("Failed to load inspector tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatus = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      await updateComplaintStatus(id, { status: newStatus });
      await fetchAssignedIssues();
    } catch (err) {
      alert("Status update failed: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setSubmittingResolution(true);
    try {
      await updateComplaintStatus(selectedTask._id, {
        status: 'Resolved',
        officerNotes: officerNotes,
        resolutionPhoto: proofPhoto || null,
      });

      alert('Resolution proof logged successfully!');
      setSelectedTask(null);
      setOfficerNotes('');
      setProofPhoto('');
      await fetchAssignedIssues();
    } catch (err) {
      alert('Failed to resolve task: ' + err.message);
    } finally {
      setSubmittingResolution(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'urgent':
      case 'high':
        return { bg: '#FDF2F2', border: '#F87171', color: '#991B1B', label: '🔥 High Priority' };
      case 'medium':
        return { bg: '#FEF3C7', border: '#FCD34D', color: '#92400E', label: '⚡ Medium' };
      default:
        return { bg: '#E2E8F0', border: '#CBD5E1', color: '#475569', label: '🟢 Low' };
    }
  };

  const matchesStatus = (itemStatus, targetKey) => {
    const st = (itemStatus || 'submitted').toLowerCase();
    const target = targetKey.toLowerCase();
    if (target === 'all') return true;
    if (target === 'pending') {
      return st === 'pending' || st === 'submitted' || st === 'under review' || st === 'under_review' || st === 'assigned';
    }
    if (target === 'in progress') {
      return st === 'in progress' || st === 'in_progress';
    }
    if (target === 'resolved') {
      return st === 'resolved';
    }
    return st === target;
  };

  const filteredComplaints = complaints.filter((item) => matchesStatus(item.status, filterStatus));

  const countByStatus = (statusKey) => {
    return complaints.filter((c) => matchesStatus(c.status, statusKey)).length;
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Inspector Operational Header */}
      <div style={{ background: '#29221F', color: '#FAF8F5', padding: '1.5rem 2rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#F2673A', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Field Operations Portal
          </div>
          <h2 style={{ margin: '0.2rem 0 0 0', fontWeight: '800', fontSize: '1.6rem' }}>👷 Field Inspector Task Queue</h2>
          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.875rem', color: '#A39B92' }}>
            Officer: <strong>{user?.name || 'Field Inspector'}</strong> &bull; Department: <strong>{user?.department || 'General Operations'}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.6rem 1.2rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#F2673A' }}>{complaints.length}</span>
            <div style={{ fontSize: '0.75rem', color: '#A39B92' }}>Sector Tasks</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.6rem 1.2rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#34D399' }}>{countByStatus('resolved')}</span>
            <div style={{ fontSize: '0.75rem', color: '#A39B92' }}>Resolved</div>
          </div>
        </div>
      </div>

      {/* Task Queue Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: `All Tasks (${complaints.length})` },
          { key: 'pending', label: `Pending (${countByStatus('pending')})` },
          { key: 'in progress', label: `In Progress (${countByStatus('in progress')})` },
          { key: 'resolved', label: `Resolved (${countByStatus('resolved')})` },
        ].map((tab) => {
          const isActive = filterStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: isActive ? '1px solid #29221F' : '1px solid #D1CDC7',
                background: isActive ? '#29221F' : '#ffffff',
                color: isActive ? '#ffffff' : '#29221F',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Task Queue Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#736B63' }}>Loading field task queue...</div>
      ) : filteredComplaints.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #E5E0D8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
          <h3 style={{ margin: '0 0 0.4rem 0', color: '#29221F' }}>No tasks found in this view</h3>
          <p style={{ margin: 0, color: '#736B63', fontSize: '0.9rem' }}>All assigned tickets in your sector are resolved or cleared.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.25rem' }}>
          {filteredComplaints.map((item) => {
            const badge = getPriorityBadge(item.priority);
            const isBusy = updatingId === item._id;

            return (
              <div 
                key={item._id} 
                style={{ 
                  background: '#ffffff', 
                  borderRadius: '12px', 
                  border: '1px solid #E5E0D8', 
                  padding: '1.25rem', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.725rem', fontWeight: '800', background: '#F7F5F0', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #D1CDC7', textTransform: 'uppercase' }}>
                      {item.category || 'GENERAL'}
                    </span>
                    <span style={{ fontSize: '0.725rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '4px', background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 0.4rem 0', color: '#29221F', fontSize: '1.05rem', fontWeight: '700' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.875rem', color: '#736B63', marginBottom: '1rem', lineHeight: '1.45' }}>{item.description}</p>

                  {item.location?.address && (
                    <div style={{ fontSize: '0.8rem', color: '#29221F', background: '#FAF8F5', border: '1px solid #E5E0D8', padding: '0.55rem 0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>
                      📍 <strong>Inspection Site:</strong> {item.location.address}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #F0ECE1', paddingTop: '0.85rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', fontSize: '0.8rem' }}>
                    <span style={{ color: '#736B63' }}>Current Status:</span>
                    <strong style={{ color: item.status === 'Resolved' ? '#137333' : '#F2673A', textTransform: 'capitalize' }}>
                      {item.status || 'Pending'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      disabled={isBusy || item.status === 'In Progress' || item.status === 'Resolved'}
                      onClick={() => handleQuickStatus(item._id, 'In Progress')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        borderRadius: '6px',
                        border: '1px solid #29221F',
                        background: item.status === 'In Progress' ? '#29221F' : '#ffffff',
                        color: item.status === 'In Progress' ? '#ffffff' : '#29221F',
                        cursor: (isBusy || item.status === 'In Progress' || item.status === 'Resolved') ? 'not-allowed' : 'pointer',
                        opacity: item.status === 'Resolved' ? 0.5 : 1
                      }}
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => setSelectedTask(item)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        borderRadius: '6px',
                        border: 'none',
                        background: item.status === 'Resolved' ? '#137333' : '#F2673A',
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      {item.status === 'Resolved' ? '✓ View Proof' : 'Inspect & Resolve'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INSPECTOR FIELD ACTION MODAL */}
      {selectedTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', maxWidth: '550px', width: '100%', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#F2673A', color: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  FIELD INSPECTION FORM
                </span>
                <h3 style={{ margin: '0.4rem 0 0 0', color: '#29221F' }}>{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#736B63' }}>✕</button>
            </div>

            <div style={{ background: '#FAF8F5', border: '1px solid #E5E0D8', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#29221F' }}>
              <div><strong>Category:</strong> {selectedTask.category}</div>
              <div style={{ marginTop: '0.3rem' }}><strong>Description:</strong> {selectedTask.description}</div>
              {selectedTask.location?.address && <div style={{ marginTop: '0.3rem' }}><strong>Location:</strong> {selectedTask.location.address}</div>}
            </div>

            <form onSubmit={handleResolveSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '0.85rem', color: '#29221F', marginBottom: '0.4rem' }}>
                  Inspector Remarks / Repair Details <span style={{ color: '#E53E3E' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="Detail work performed on site (e.g. Asphalt patch applied, leak sealed)..."
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #D1CDC7', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '0.85rem', color: '#29221F', marginBottom: '0.4rem' }}>
                  Resolution Proof Photo (Image URL or File Path)
                </label>
                <input
                  type="text"
                  value={proofPhoto}
                  onChange={(e) => setProofPhoto(e.target.value)}
                  placeholder="https://..."
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #D1CDC7', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid #D1CDC7', background: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResolution}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: 'none', background: '#137333', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  {submittingResolution ? 'Submitting...' : 'Submit Fix Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}