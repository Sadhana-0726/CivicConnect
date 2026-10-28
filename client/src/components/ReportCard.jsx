import React from 'react';

export default function ReportCard({ complaint }) {
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'alert--success';
      case 'in progress':
      case 'assigned':
        return 'alert--error';
      default:
        return 'btn--secondary';
    }
  };

  return (
    <div className="feature" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 className="feature__title">{complaint.title}</h3>
          <p className="feature__text" style={{ marginBottom: '0.5rem' }}>{complaint.description}</p>
        </div>
        <span className={`btn btn--small ${getStatusBadgeClass(complaint.status)}`} style={{ textTransform: 'capitalize' }}>
          {complaint.status || 'Submitted'}
        </span>
      </div>
      <div className="cc-popup__meta" style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem' }}>
        <span><strong>Category:</strong> {complaint.category}</span>
        {complaint.location?.address && <span><strong>Location:</strong> {complaint.location.address}</span>}
      </div>
    </div>
  );
}