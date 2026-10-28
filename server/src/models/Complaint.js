const mongoose = require('mongoose');

const STATUSES = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected',
];

const CATEGORIES = [
  'road',
  'streetlight',
  'sanitation',
  'water',
  'drainage',
  'electricity',
  'public_safety',
  'other',
];

const DEPARTMENTS = [
  'Roads & Infrastructure',
  'Sanitation & Solid Waste',
  'Water & Sewage',
  'Electrical & Streetlights',
  'Public Safety & General',
];

const STATUS_MAP = {
  submitted: 'Submitted',
  'under review': 'Under Review',
  under_review: 'Under Review',
  assigned: 'Assigned',
  'in progress': 'In Progress',
  in_progress: 'In Progress',
  pending: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

const normalizeStatus = (str) => {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (STATUSES.includes(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  return STATUS_MAP[lower] || null;
};

const statusHistoryEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: STATUSES,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    changedByName: {
      type: String,
      default: 'System',
    },
    notes: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    // GeoJSON Point representation for 2dsphere indexing and geospatial operations ($near, $geoWithin)
    geo: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: {
      type: locationSchema,
      default: () => ({}),
    },
    priority: { type: String, default: 'Medium' },
    status: {
      type: String,
      enum: STATUSES,
      default: 'Submitted',
    },
    department: {
      type: String,
      enum: [...DEPARTMENTS, null],
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    photo: { type: String, default: null },
    officerNotes: { type: String, default: '' },
    resolutionNotes: { type: String, default: '' },
    resolutionPhoto: { type: String, default: null },
    statusHistory: {
      type: [statusHistoryEntrySchema],
      default: [],
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Phase 5: Smart classification tracking fields
    autoClassified: { type: Boolean, default: false },
    autoPriority: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Synchronize GeoJSON Point and coordinates before saving
complaintSchema.pre('save', function () {
  if (
    this.location &&
    this.location.coordinates &&
    typeof this.location.coordinates.lat === 'number' &&
    typeof this.location.coordinates.lng === 'number'
  ) {
    const lat = this.location.coordinates.lat;
    const lng = this.location.coordinates.lng;
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      this.location.geo = {
        type: 'Point',
        coordinates: [lng, lat],
      };
    }
  } else if (
    this.location &&
    this.location.geo &&
    Array.isArray(this.location.geo.coordinates) &&
    this.location.geo.coordinates.length === 2
  ) {
    const [lng, lat] = this.location.geo.coordinates;
    if (!this.location.coordinates || typeof this.location.coordinates.lat !== 'number') {
      this.location.coordinates = { lat, lng };
    }
  }

  // Initialize status history if empty
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [
      {
        status: this.status || 'Submitted',
        changedBy: this.citizen || null,
        changedByName: 'Citizen',
        notes: 'Complaint submitted',
        timestamp: this.createdAt || new Date(),
      },
    ];
  }
});

// Geospatial index for MongoDB $near and $geoWithin queries
complaintSchema.index({ 'location.geo': '2dsphere' }, { sparse: true });
complaintSchema.index({ department: 1, status: 1 });
complaintSchema.index({ citizen: 1, createdAt: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

// Support both `const Complaint = require(...)` and `const { Complaint, CATEGORIES, STATUSES } = require(...)`
Complaint.Complaint = Complaint;
Complaint.STATUSES = STATUSES;
Complaint.CATEGORIES = CATEGORIES;
Complaint.DEPARTMENTS = DEPARTMENTS;
Complaint.normalizeStatus = normalizeStatus;

module.exports = Complaint;
