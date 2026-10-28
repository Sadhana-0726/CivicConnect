const { Complaint, CATEGORIES, STATUSES, DEPARTMENTS, normalizeStatus } = require('../models/Complaint');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');
const { classifyComplaint } = require('../services/classificationService');
const { routeDepartment } = require('../services/departmentRoutingService');
const { findNearbyDuplicates } = require('../services/duplicateDetectionService');

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isEmpty = (value) => value === undefined || value === null || value === '';

/**
 * Validate and sanitize citizen complaint submission.
 */
const validateCreateInput = (body) => {
  const errors = [];
  const data = {};
  const addError = (field, message) => errors.push({ field, message });

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) addError('title', 'Title is required');
  else if (title.length < 3 || title.length > 120)
    addError('title', 'Title must be between 3 and 120 characters');
  else data.title = title;

  const description =
    typeof body.description === 'string' ? body.description.trim() : '';
  if (!description) addError('description', 'Description is required');
  else if (description.length < 5 || description.length > 2000)
    addError('description', 'Description must be between 5 and 2000 characters');
  else data.description = description;

  if (!body.category || typeof body.category !== 'string') {
    addError('category', `Category is required`);
  } else {
    data.category = body.category.trim();
  }

  // Location validation (supports address and coordinates { lat, lng })
  data.location = {};
  if (body.location && isPlainObject(body.location)) {
    if (typeof body.location.address === 'string') {
      data.location.address = body.location.address.trim();
    }

    const coords = body.location.coordinates;
    if (coords && isPlainObject(coords)) {
      const lat = Number(coords.lat);
      const lng = Number(coords.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        data.location.coordinates = { lat, lng };
      }
    }
  } else if (typeof body.address === 'string') {
    data.location.address = body.address.trim();
  }

  if (!isEmpty(body.priority) && typeof body.priority === 'string') {
    data.priority = body.priority.trim();
  }

  if (!isEmpty(body.photo) && typeof body.photo === 'string') {
    data.photo = body.photo.trim();
  }

  return { errors, data };
};

/**
 * GET /api/complaints
 * Returns complaints list. Supports query filters: status, category, department.
 */
const getComplaints = async (req, res, next) => {
  try {
    const { status, category, department } = req.query;
    const filter = {};

    if (status) {
      const canonical = normalizeStatus(status);
      if (canonical) filter.status = canonical;
    }

    if (category) {
      filter.category = category;
    }

    if (department) {
      filter.department = department;
    }

    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name email')
      .populate('assignedTo', 'name email department')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/complaints/my-reports
 * Returns complaints submitted by the authenticated user.
 */
const getMyComplaints = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Not authorized. Please log in.' });
    }

    const complaints = await Complaint.find({ citizen: req.user._id })
      .populate('assignedTo', 'name department')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/complaints
 * Creates a new complaint. Authenticated users are linked as citizen.
 * Phase 5: Integrates auto-classification, priority detection,
 *          department routing, and duplicate detection.
 */
const createComplaint = async (req, res, next) => {
  try {
    const { errors, data } = validateCreateInput(req.body || {});

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const citizenId = req.user ? req.user._id : null;
    const citizenName = req.user ? req.user.name : 'Citizen';

    // --- Phase 5: Smart classification & department routing ---
    const classification = classifyComplaint(data.title, data.description, data.category);

    // Apply auto-detected category if citizen didn't pick one (or it was empty)
    if (classification.autoClassified && classification.category) {
      data.category = classification.category;
    }

    // Apply auto-detected priority if citizen didn't explicitly set one
    if (!data.priority || data.priority === 'Medium') {
      data.priority = classification.priority;
      data.autoPriority = true;
    }

    // Smart department routing — only when no department was explicitly set
    const routedDept = routeDepartment(data.category);
    if (routedDept && !data.department) {
      data.department = routedDept;
    }

    data.autoClassified = classification.autoClassified || false;

    // --- Phase 5: Duplicate detection ---
    let duplicates = [];
    const lat = data.location && data.location.coordinates ? data.location.coordinates.lat : null;
    const lng = data.location && data.location.coordinates ? data.location.coordinates.lng : null;

    try {
      duplicates = await findNearbyDuplicates(Complaint, data.category, lat, lng);
    } catch (dupErr) {
      // Never block submission due to duplicate detection failure
      console.warn('[createComplaint] Duplicate detection skipped:', dupErr.message);
    }

    data.citizen = citizenId;
    data.status = 'Submitted';
    data.statusHistory = [
      {
        status: 'Submitted',
        changedBy: citizenId,
        changedByName: citizenName,
        notes: 'Complaint submitted by citizen',
        timestamp: new Date(),
      },
    ];

    const complaint = await Complaint.create(data);

    // Build response with classification and duplicate metadata
    const response = complaint.toObject ? complaint.toObject() : complaint;
    response.classification = {
      autoClassified: data.autoClassified,
      autoPriority: data.autoPriority || false,
      detectedCategory: classification.category,
      detectedPriority: classification.priority,
      routedDepartment: data.department || null,
    };

    if (duplicates.length > 0) {
      response.duplicates = {
        found: true,
        count: duplicates.length,
        nearby: duplicates.map((d) => ({
          _id: d._id,
          title: d.title,
          status: d.status,
          createdAt: d.createdAt,
        })),
      };
    }

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/complaints/:id/status
 * Updates status, remarks, and resolution proof.
 * Restricted to department officers, department admins, and super admins.
 */
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, officerNotes, resolutionNotes, resolutionPhoto, notes } = req.body || {};

    if (!OBJECT_ID_REGEX.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID format' });
    }

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const canonicalStatus = normalizeStatus(status);
    if (!canonicalStatus) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Allowed statuses: ${STATUSES.join(', ')}`,
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Role & Department Access Control
    const userRole = req.user.role;
    const userDept = req.user.department;

    if (userRole === 'citizen') {
      return res.status(403).json({
        success: false,
        message: 'Citizens are not permitted to modify administrative complaint status',
      });
    }

    // Cross-department check: officers & dept admins can only update tickets within their department
    if (userRole !== 'super_admin' && complaint.department && userDept && complaint.department !== userDept) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only update complaints for your assigned department (${userDept}).`,
      });
    }

    const remarks = officerNotes || resolutionNotes || notes || '';

    // Apply updates
    complaint.status = canonicalStatus;
    if (remarks) {
      complaint.officerNotes = remarks;
      if (canonicalStatus === 'Resolved') {
        complaint.resolutionNotes = remarks;
      }
    }

    if (resolutionPhoto) {
      complaint.resolutionPhoto = resolutionPhoto;
    }

    // Record audit trail
    complaint.statusHistory.push({
      status: canonicalStatus,
      changedBy: req.user._id,
      changedByName: req.user.name,
      notes: remarks || `Status changed to ${canonicalStatus}`,
      timestamp: new Date(),
    });

    await complaint.save();

    res.json({
      success: true,
      message: `Complaint status updated to ${canonicalStatus}`,
      complaint,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/complaints/:id/assign
 * Assigns a complaint to a department and/or officer.
 * Restricted to department admins and super admins.
 */
const assignComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { department, assignedTo } = req.body || {};

    if (!OBJECT_ID_REGEX.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID format' });
    }

    const userRole = req.user.role;
    const userDept = req.user.department;

    if (userRole !== 'department_admin' && userRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Department Administrators and Super Admins can assign complaints',
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Target department determination
    const targetDept = department || (userRole === 'department_admin' ? userDept : complaint.department);

    if (targetDept && !DEPARTMENTS.includes(targetDept)) {
      return res.status(400).json({
        success: false,
        message: `Invalid department. Must be one of: ${DEPARTMENTS.join(', ')}`,
      });
    }

    // Department admin cross-department prevention
    if (userRole === 'department_admin') {
      if (complaint.department && complaint.department !== userDept) {
        return res.status(403).json({
          success: false,
          message: `Cannot reassign complaint belonging to another department (${complaint.department})`,
        });
      }
      if (department && department !== userDept) {
        return res.status(403).json({
          success: false,
          message: `Department admins can only assign tickets within their own department (${userDept})`,
        });
      }
    }

    let assignedOfficer = null;
    if (assignedTo) {
      if (!OBJECT_ID_REGEX.test(assignedTo)) {
        return res.status(400).json({ success: false, message: 'Invalid assigned officer ID format' });
      }

      assignedOfficer = await User.findById(assignedTo);
      if (!assignedOfficer) {
        return res.status(404).json({ success: false, message: 'Assigned officer not found' });
      }

      if (assignedOfficer.role !== 'department_officer' && assignedOfficer.role !== 'department_admin') {
        return res.status(400).json({
          success: false,
          message: 'Complaints can only be assigned to department officers or department admins',
        });
      }

      if (targetDept && assignedOfficer.department && assignedOfficer.department !== targetDept) {
        return res.status(400).json({
          success: false,
          message: `Officer ${assignedOfficer.name} belongs to ${assignedOfficer.department}, not ${targetDept}`,
        });
      }
    }

    // Apply assignments
    if (targetDept) complaint.department = targetDept;
    if (assignedTo !== undefined) complaint.assignedTo = assignedOfficer ? assignedOfficer._id : null;

    // Transition status to 'Assigned' if currently Submitted or Under Review
    if (complaint.status === 'Submitted' || complaint.status === 'Under Review') {
      complaint.status = 'Assigned';
    }

    const noteDetails = [];
    if (targetDept) noteDetails.push(`Department: ${targetDept}`);
    if (assignedOfficer) noteDetails.push(`Officer: ${assignedOfficer.name}`);

    complaint.statusHistory.push({
      status: complaint.status,
      changedBy: req.user._id,
      changedByName: req.user.name,
      notes: `Assignment updated (${noteDetails.join(', ')})`,
      timestamp: new Date(),
    });

    await complaint.save();

    const populated = await Complaint.findById(complaint._id)
      .populate('citizen', 'name email')
      .populate('assignedTo', 'name email department');

    res.json({
      success: true,
      message: 'Complaint assigned successfully',
      complaint: populated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getComplaints,
  getMyComplaints,
  createComplaint,
  updateComplaintStatus,
  assignComplaint,
};
