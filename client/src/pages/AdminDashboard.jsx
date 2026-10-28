import { useEffect, useState } from 'react';
import { getComplaints, updateComplaintStatus, assignComplaint, getOfficers } from '../services/api';

const STATUS_OPTIONS = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
const DEPARTMENTS = [
  'Roads & Infrastructure',
  'Sanitation & Solid Waste',
  'Water & Sewage',
  'Electrical & Streetlights',
  'Public Safety & General',
];

export default function AdminDashboard({ user }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [officers, setOfficers] = useState([]);
  const [assigningTask, setAssigningTask] = useState(null);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getComplaints();
      setComplaints(Array.isArray(data) ? data : data.complaints || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentOfficers = async () => {
    try {
      const dept = user?.department || undefined;
      const list = await getOfficers(dept);
      setOfficers(Array.isArray(list) ? list : []);
    } catch (e) {
      // Non-fatal if officers cannot be listed yet
      setOfficers([]);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchDepartmentOfficers();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateComplaintStatus(id, { status: newStatus });
      fetchReports();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const openAssignModal = (complaint) => {
    setAssigningTask(complaint);
    setSelectedDept(complaint.department || user?.department || 'Roads & Infrastructure');
    setSelectedOfficer(complaint.assignedTo?._id || complaint.assignedTo || '');
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assigningTask) return;

    setAssigning(true);
    try {
      await assignComplaint(assigningTask._id, {
        department: selectedDept,
        assignedTo: selectedOfficer || null,
      });
      alert('Complaint routed and assigned successfully!');
      setAssigningTask(null);
      await fetchReports();
    } catch (err) {
      alert('Assignment failed: ' + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const filtered = filterStatus === 'all' 
    ? complaints 
    : complaints.filter(c => (c.status || '').toLowerCase() === filterStatus.toLowerCase());

  return (
    <div className="page admin-page" style={{ padding: '2rem 1.5rem', maxWidth: '1150px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Admin Portal Header */}
      <div style={{ background: '#29221F', color: '#FAF8F5', padding: '1.5rem 2rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#F2673A', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Municipal Administration
          </div>
          <h2 style={{ margin: '0.2rem 0 0.3rem 0', fontWeight: '800' }}>🏛️ Department Management Console</h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#A39B92' }}>
            Administrator: <strong>{user?.name || 'Department Lead'}</strong> &bull; Sector: <strong>{user?.department || 'All Municipal Sectors'}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.6rem 1.2rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#F2673A' }}>{complaints.length}</span>
            <div style={{ fontSize: '0.75rem', color: '#A39B92' }}>Total Reports</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.6rem 1.2rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#34D399' }}>
              {complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length}
            </span>
            <div style={{ fontSize: '0.75rem', color: '#A39B92' }}>Resolved</div>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E0D8', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.6rem', color: '#F2673A' }}>{complaints.length}</h3>
          <span style={{ fontSize: '0.85rem', color: '#736B63' }}>Total Tickets</span>
        </div>
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E0D8', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.6rem', color: '#D97706' }}>
            {complaints.filter(c => {
              const s = (c.status || '').toLowerCase();
              return s === 'submitted' || s === 'under review';
            }).length}
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#736B63' }}>New / Unassigned</span>
        </div>
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E0D8', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.6rem', color: '#2563EB' }}>
            {complaints.filter(c => {
              const s = (c.status || '').toLowerCase();
              return s === 'assigned' || s === 'in progress';
            }).length}
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#736B63' }}>Under Action</span>
        </div>
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E0D8', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.6rem', color: '#16A34A' }}>
            {complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length}
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#736B63' }}>Resolved Tickets</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button 
          className={`btn ${filterStatus === 'all' ? 'btn--primary' : 'btn--secondary'}`} 
          onClick={() => setFilterStatus('all')}
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', borderRadius: '6px' }}
        >
          All ({complaints.length})
        </button>
        {STATUS_OPTIONS.map(st => (
          <button 
            key={st}
            className={`btn ${filterStatus === st ? 'btn--primary' : 'btn--secondary'}`} 
            onClick={() => setFilterStatus(st)}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', borderRadius: '6px' }}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Tickets Table */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: '#736B63' }}>Loading complaints data...</p>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #E5E0D8' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#F7F5F0', borderBottom: '1px solid #E5E0D8' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Title & Location</th>
                <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                <th style={{ padding: '0.75rem 1rem' }}>Sector / Officer</th>
                <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                <th style={{ padding: '0.75rem 1rem' }}>Current Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c._id} style={{ borderBottom: '1px solid #F0ECE1' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <strong>{c.title}</strong>
                    <br />
                    <span style={{ color: '#736B63', fontSize: '0.8rem' }}>📍 {c.location?.address || c.address || 'Location on map'}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>{c.category}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.825rem' }}>
                    <div style={{ fontWeight: '600', color: '#29221F' }}>{c.department || 'Unassigned Sector'}</div>
                    <div style={{ color: '#736B63' }}>👷 {c.assignedTo?.name || 'No Officer Assigned'}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background: (c.priority || '').toLowerCase() === 'urgent' || (c.priority || '').toLowerCase() === 'high' ? '#FEE2E2' : '#F3F4F6',
                      color: (c.priority || '').toLowerCase() === 'urgent' || (c.priority || '').toLowerCase() === 'high' ? '#DC2626' : '#374151'
                    }}>
                      {c.priority || 'Medium'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <select 
                      value={c.status || 'Submitted'} 
                      onChange={(e) => handleStatusChange(c._id, e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #D1CDC7', fontSize: '0.85rem' }}
                    >
                      {STATUS_OPTIONS.map(st => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      type="button"
                      onClick={() => openAssignModal(c)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: '#29221F',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      Assign &rarr;
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#736B63' }}>
                    No reports match this status filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ASSIGNMENT MODAL */}
      {assigningTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#29221F' }}>Assign Civic Ticket</h3>
              <button onClick={() => setAssigningTask(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#736B63' }}>✕</button>
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#736B63' }}>
              Assign <strong>{assigningTask.title}</strong> to an authorized department officer.
            </p>

            <form onSubmit={handleAssignSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.3rem', color: '#29221F' }}>
                  Responsible Department
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  disabled={user?.role === 'department_admin'}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #D1CDC7', fontSize: '0.85rem' }}
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.3rem', color: '#29221F' }}>
                  Assign Field Inspector / Officer
                </label>
                <select
                  value={selectedOfficer}
                  onChange={(e) => setSelectedOfficer(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #D1CDC7', fontSize: '0.85rem' }}
                >
                  <option value="">-- Leave Unassigned --</option>
                  {officers.map(off => (
                    <option key={off._id} value={off._id}>
                      {off.name} ({off.department || 'Officer'}) &mdash; {off.email}
                    </option>
                  ))}
                </select>
                {officers.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#736B63', marginTop: '0.3rem' }}>
                    No field officers registered yet. You can assign the department first.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setAssigningTask(null)}
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '6px', border: '1px solid #D1CDC7', background: '#fff', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '6px', border: 'none', background: '#F2673A', color: '#fff', cursor: 'pointer', fontWeight: '700' }}
                >
                  {assigning ? 'Routing...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
