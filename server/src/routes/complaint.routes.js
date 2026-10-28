const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getComplaints,
  getMyComplaints,
  createComplaint,
  updateComplaintStatus,
  assignComplaint,
} = require('../controllers/complaint.controller');

// Optional authentication helper: extracts user when token is provided, permits guest otherwise
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return protect(req, res, next);
  }
  return next();
};

// GET /api/complaints (All reports, supports filters: ?status=&category=&department=)
router.get('/', optionalAuth, getComplaints);

// GET /api/complaints/my-reports (Authenticated citizen's reports)
router.get('/my-reports', protect, getMyComplaints);

// POST /api/complaints (Submit report - links citizen if logged in)
router.post('/', optionalAuth, createComplaint);

// PATCH /api/complaints/:id/status (Update status & resolution proof - staff only)
router.patch(
  '/:id/status',
  protect,
  restrictTo('department_officer', 'department_admin', 'super_admin'),
  updateComplaintStatus
);

// PATCH /api/complaints/:id/assign (Assign department/officer - admins only)
router.patch(
  '/:id/assign',
  protect,
  restrictTo('department_admin', 'super_admin'),
  assignComplaint
);

module.exports = router;
