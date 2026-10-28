import { useState } from 'react';
import IssueMap from './IssueMap';
import { createComplaint } from '../services/api';

const CATEGORY_MAP = {
  road: {
    label: 'Roads & Potholes',
    issues: [
      'Pothole / Damaged Road',
      'Damaged Footpath / Sidewalk',
      'Bridges / Flyover Issue',
      'Road Safety / Missing Signs',
    ],
  },
  streetlight: {
    label: 'Street Lights',
    issues: [
      'Broken / Non-functional Light',
      'Exposed Electrical Wire',
      'Flickering Light',
    ],
  },
  sanitation: {
    label: 'Garbage & Sanitation',
    issues: [
      'Uncollected Garbage Pile',
      'Overflowing Dustbin',
      'Public Toilet Maintenance',
    ],
  },
  water: {
    label: 'Water Supply',
    issues: [
      'Pipe Leakage / Contamination',
      'No Water Supply',
      'Low Pressure',
    ],
  },
  drainage: {
    label: 'Drainage & Sewage',
    issues: [
      'Blocked Drain / Overflowing',
      'Waterlogging / Flooding',
    ],
  },
  electricity: {
    label: 'Electricity / Power',
    issues: [
      'Power Outage',
      'Transformer Sparking',
      'Meter Box Damage',
    ],
  },
  public_safety: {
    label: 'Public Safety & Hazards',
    issues: [
      'Open Manhole',
      'Fallen Tree / Branch Risk',
      'Hazardous Construction Material',
    ],
  },
  other: {
    label: 'Other Issues',
    issues: [
      'Stray Animals / Menace',
      'Illegal Encroachment',
      'Other General Issue',
    ],
  },
};

const PRIORITIES = [
  { value: 'low', label: 'Low (Minor cosmetic issue)' },
  { value: 'medium', label: 'Medium (Standard repair request)' },
  { value: 'high', label: 'High (Urgent hazard / Public danger)' },
  { value: 'urgent', label: 'Urgent (Immediate critical emergency)' },
];

const EMPTY_FORM = { 
  title: '', 
  category: '', 
  subIssue: '',
  description: '', 
  address: '', 
  priority: 'medium', 
  photo: '' 
};

function buildPayload(form, position) {
  const fullDescription = form.subIssue 
    ? `[Specific Issue: ${form.subIssue}]\n${form.description.trim()}`
    : form.description.trim();

  const generatedTitle = form.title.trim() || `${form.subIssue || 'Civic Issue'} near ${form.address.trim()}`;

  return {
    title: generatedTitle,
    category: form.category || 'other',
    description: fullDescription,
    priority: form.priority,
    photo: form.photo.trim() || null,
    location: {
      address: form.address.trim(),
      coordinates: position ? { lat: position.lat, lng: position.lng } : undefined,
    },
  };
}

export default function ComplaintForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [position, setPosition] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const [uploadMode, setUploadMode] = useState('file');

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleCategorySelect = (catKey) => {
    setForm((f) => ({ ...f, category: catKey, subIssue: '' }));
    setErrors((er) => ({ ...er, category: undefined, subIssue: undefined }));
  };

  const handleSubIssueSelect = (issue) => {
    setForm((f) => ({ ...f, subIssue: issue }));
    setErrors((er) => ({ ...er, subIssue: undefined }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((f) => ({ ...f, photo: reader.result }));
        setErrors((er) => ({ ...er, photo: undefined }));
      };
      reader.readAsDataURL(file);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setErrors((er) => ({ ...er, position: 'Geolocation is not supported by your browser.' }));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setErrors((er) => ({ ...er, position: undefined }));
        setLocating(false);
      },
      () => {
        setErrors((er) => ({ ...er, position: 'Could not retrieve location. Please grant permission or pick on the map.' }));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validate = () => {
    const er = {};
    if (!form.category) er.category = 'Please select a primary category.';
    if (!form.subIssue) er.subIssue = 'Please select a specific issue type.';
    if (!form.description.trim() || form.description.trim().length < 10) {
      er.description = 'Description must be at least 10 characters long.';
    }
    if (!form.address.trim() || form.address.trim().length < 5) {
      er.address = 'Landmark or address must be at least 5 characters long.';
    }
    if (!position) {
      er.position = 'Please drop a pin on the map or click "Use my location".';
    }
    return er;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    
    if (Object.keys(er).length > 0) {
      setStatus('error');
      setMessage('Please address the highlighted validation errors before submitting.');
      return;
    }

    setStatus('submitting');
    setMessage('');
    try {
      await createComplaint(buildPayload(form, position));
      setStatus('success');
      setMessage('Report submitted successfully! Your issue has been logged with local municipal authorities.');
      setForm(EMPTY_FORM);
      setPosition(null);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Failed to submit report. Please check your network connection.');
    }
  };

  const busy = status === 'submitting';

  return (
    <form className="form" onSubmit={onSubmit} noValidate style={{ background: '#ffffff', padding: '1.75rem', borderRadius: '12px', border: '1px solid #E5E0D8' }}>
      {status === 'success' && (
        <div className="alert alert--success" role="status" style={{ marginBottom: '1.25rem', background: '#E6F4EA', border: '1px solid #A8DADC', padding: '1rem', borderRadius: '8px', color: '#137333' }}>
          {message} <a href="#/my-reports" style={{ color: '#137333', fontWeight: '700', marginLeft: '0.5rem' }}>Track status in My Reports &rarr;</a>
        </div>
      )}
      {status === 'error' && (
        <div className="alert alert--error" role="alert" style={{ marginBottom: '1.25rem', background: '#FDF2F2', border: '1px solid #F87171', padding: '1rem', borderRadius: '8px', color: '#991B1B' }}>
          {message}
        </div>
      )}

      {/* Category Grid */}
      <div className="field" style={{ marginBottom: '1.25rem' }}>
        <label style={{ fontWeight: '700', color: '#29221F', display: 'block', marginBottom: '0.5rem' }}>
          Category <span className="required-star" style={{ color: '#E53E3E' }}>*</span>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.6rem' }}>
          {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
            const isSelected = form.category === key;
            return (
              <button
                key={key}
                type="button"
                style={{
                  padding: '0.65rem 0.5rem',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  fontWeight: isSelected ? '700' : '500',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isSelected ? '#F2673A' : '#FAF8F5',
                  color: isSelected ? '#ffffff' : '#29221F',
                  border: isSelected ? '2px solid #F2673A' : '1px solid #D1CDC7',
                  transition: 'all 0.15s ease-in-out'
                }}
                onClick={() => handleCategorySelect(key)}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
        {errors.category && <p className="field__error" style={{ color: '#E53E3E', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.category}</p>}
      </div>

      {/* Specific Issue Selection */}
      {form.category && (
        <div className="field" style={{ background: '#FAF8F5', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E0D8', marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '700', color: '#29221F', marginBottom: '0.5rem', display: 'block' }}>
            Select Specific Issue <span className="required-star" style={{ color: '#E53E3E' }}>*</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {CATEGORY_MAP[form.category]?.issues.map((issue) => {
              const isSelected = form.subIssue === issue;
              return (
                <button
                  key={issue}
                  type="button"
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    background: isSelected ? '#29221F' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#29221F',
                    border: isSelected ? '1px solid #29221F' : '1px solid #C4C0B9',
                    fontWeight: isSelected ? '600' : '400'
                  }}
                  onClick={() => handleSubIssueSelect(issue)}
                >
                  {issue}
                </button>
              );
            })}
          </div>
          {errors.subIssue && <p className="field__error" style={{ color: '#E53E3E', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.subIssue}</p>}
        </div>
      )}

      {/* Optional Custom Title */}
      <div className="field" style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="title" style={{ fontWeight: '700', color: '#29221F', display: 'block', marginBottom: '0.3rem' }}>
          Report Title <span style={{ fontWeight: 'normal', color: '#736B63', fontSize: '0.85rem' }}>(Optional)</span>
        </label>
        <input 
          id="title" 
          name="title" 
          value={form.title} 
          onChange={update} 
          maxLength={120}
          placeholder="e.g. Large pothole near bus stop" 
          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #D1CDC7', boxSizing: 'border-box' }}
        />
      </div>

      {/* Priority Level */}
      <div className="field" style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="priority" style={{ fontWeight: '700', color: '#29221F', display: 'block', marginBottom: '0.3rem' }}>
          Priority Level <span className="required-star" style={{ color: '#E53E3E' }}>*</span>
        </label>
        <select 
          id="priority" 
          name="priority" 
          value={form.priority} 
          onChange={update} 
          required
          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #D1CDC7', background: '#ffffff', boxSizing: 'border-box' }}
        >
          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {/* Detailed Description */}
      <div className="field" style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="description" style={{ fontWeight: '700', color: '#29221F', display: 'block', marginBottom: '0.3rem' }}>
          Description <span className="required-star" style={{ color: '#E53E3E' }}>*</span>
        </label>
        <textarea 
          id="description" 
          name="description" 
          rows={4} 
          value={form.description} 
          onChange={update}
          placeholder="Provide additional details (e.g. size of hazard, how long it's been present)..." 
          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: errors.description ? '1px solid #E53E3E' : '1px solid #D1CDC7', boxSizing: 'border-box' }}
          required 
        />
        {errors.description && <p className="field__error" style={{ color: '#E53E3E', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.description}</p>}
      </div>

      {/* Photo Attachment Mode */}
      <div className="field" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <label htmlFor="photo" style={{ fontWeight: '700', color: '#29221F' }}>Photo / Photo Proof</label>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #D1CDC7', background: uploadMode === 'file' ? '#29221F' : '#ffffff', color: uploadMode === 'file' ? '#ffffff' : '#29221F', cursor: 'pointer' }}
              onClick={() => { setUploadMode('file'); setForm((f) => ({ ...f, photo: '' })); }}
            >
              Upload Image
            </button>
            <button
              type="button"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #D1CDC7', background: uploadMode === 'url' ? '#29221F' : '#ffffff', color: uploadMode === 'url' ? '#ffffff' : '#29221F', cursor: 'pointer' }}
              onClick={() => { setUploadMode('url'); setForm((f) => ({ ...f, photo: '' })); }}
            >
              URL Link
            </button>
          </div>
        </div>

        {uploadMode === 'file' ? (
          <input id="photo" type="file" accept="image/*" capture="environment" onChange={handleFileUpload} style={{ width: '100%' }} />
        ) : (
          <input
            id="photo" name="photo" type="url" value={form.photo} onChange={update}
            placeholder="https://images.unsplash.com/photo-..."
            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #D1CDC7', boxSizing: 'border-box' }}
          />
        )}
      </div>

      {/* Address & Landmark */}
      <div className="field" style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="address" style={{ fontWeight: '700', color: '#29221F', display: 'block', marginBottom: '0.3rem' }}>
          Landmark / Street Address <span className="required-star" style={{ color: '#E53E3E' }}>*</span>
        </label>
        <input 
          id="address" 
          name="address" 
          value={form.address} 
          onChange={update}
          placeholder="e.g. Opposite Main Gate, Ring Road Junction" 
          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: errors.address ? '1px solid #E53E3E' : '1px solid #D1CDC7', boxSizing: 'border-box' }}
          required 
        />
        {errors.address && <p className="field__error" style={{ color: '#E53E3E', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.address}</p>}
      </div>

      {/* Map Location Picker */}
      <div className="field" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <label style={{ fontWeight: '700', color: '#29221F' }}>
            Location Marker <span className="required-star" style={{ color: '#E53E3E' }}>*</span>
          </label>
          <button 
            type="button" 
            onClick={useMyLocation} 
            disabled={locating}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #29221F', background: '#29221F', color: '#ffffff', cursor: 'pointer' }}
          >
            {locating ? 'Locating...' : 'Use My GPS Location'}
          </button>
        </div>
        <IssueMap pickMode value={position} onPick={(p) => { setPosition(p); setErrors((er) => ({ ...er, position: undefined })); }} height="300px" />
        <p style={{ fontSize: '0.8rem', color: '#736B63', marginTop: '0.3rem' }}>
          {position ? `Selected Coordinates: ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : 'Click anywhere on the map above to set the exact issue location.'}
        </p>
        {errors.position && <p className="field__error" style={{ color: '#E53E3E', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.position}</p>}
      </div>

      {/* Submit CTA */}
      <button 
        type="submit" 
        disabled={busy}
        style={{ width: '100%', background: '#F2673A', color: '#ffffff', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}
      >
        {busy ? 'Submitting Report...' : 'Submit Report'}
      </button>
    </form>
  );
}