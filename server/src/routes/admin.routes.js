/**
 * admin.routes.js
 * Administrative endpoints for escalation and system operations.
 * Phase 5: Escalation endpoints (manual trigger, preview).
 */

const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { Complaint } = require('../models/Complaint');
const {
  escalateOverdueComplaints,
  previewEscalation,
} = require('../services/escalationService');

/**
 * GET /api/admin/escalate/preview
 * Returns list of complaints that would be escalated.
 * Restricted to department_admin and super_admin.
 */
router.get(
  '/escalate/preview',
  protect,
  restrictTo('department_admin', 'super_admin'),
  async (req, res, next) => {
    try {
      const candidates = await previewEscalation(Complaint);
      res.json({
        success: true,
        count: candidates.length,
        complaints: candidates,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/admin/escalate
 * Triggers idempotent escalation of overdue complaints.
 * Restricted to department_admin and super_admin.
 */
router.post(
  '/escalate',
  protect,
  restrictTo('department_admin', 'super_admin'),
  async (req, res, next) => {
    try {
      const result = await escalateOverdueComplaints(Complaint);
      res.json({
        success: true,
        message: `Escalation complete: ${result.escalated} escalated, ${result.skipped} already escalated`,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

