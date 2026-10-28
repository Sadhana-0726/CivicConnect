/**
 * escalationService.js
 * Idempotent escalation of overdue unresolved complaints.
 *
 * Design guarantees:
 *  - Checks the last statusHistory entry for an 'Auto-escalated' note before
 *    adding a new one → prevents duplicate escalation entries.
 *  - Updates priority to 'urgent' only when not already 'urgent'.
 *  - Exposed as an async function; NOT run via setInterval or cron at startup
 *    to avoid uncontrolled timers on server restart.
 *  - Callers trigger escalation manually (e.g., via the admin API).
 */

'use strict';

// Complaints unresolved for this many hours are eligible for escalation.
const ESCALATION_THRESHOLD_HOURS = Number(process.env.ESCALATION_THRESHOLD_HOURS) || 48;

const ACTIVE_STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress'];

/**
 * Check whether a complaint has already been escalated (idempotency guard).
 * @param {object} complaint - Mongoose document
 * @returns {boolean}
 */
function isAlreadyEscalated(complaint) {
  if (!complaint.statusHistory || complaint.statusHistory.length === 0) return false;
  const lastEntry = complaint.statusHistory[complaint.statusHistory.length - 1];
  return typeof lastEntry.notes === 'string' && lastEntry.notes.includes('Auto-escalated');
}

/**
 * Return a list of complaints that WOULD be escalated (preview).
 * @param {object} ComplaintModel
 * @returns {Promise<Array>}
 */
async function previewEscalation(ComplaintModel) {
  const cutoff = new Date(Date.now() - ESCALATION_THRESHOLD_HOURS * 60 * 60 * 1000);
  const candidates = await ComplaintModel.find({
    status: { $in: ACTIVE_STATUSES },
    createdAt: { $lt: cutoff },
  })
    .select('_id title status priority department createdAt statusHistory')
    .lean();

  return candidates.filter((c) => !isAlreadyEscalated(c));
}

/**
 * Escalate overdue complaints.
 * For each eligible complaint:
 *   - Appends a statusHistory entry with notes 'Auto-escalated: overdue by Xh'
 *   - Sets priority to 'urgent' if it isn't already
 *
 * @param {object} ComplaintModel
 * @returns {Promise<{ escalated: number, skipped: number, ids: string[] }>}
 */
async function escalateOverdueComplaints(ComplaintModel) {
  const cutoff = new Date(Date.now() - ESCALATION_THRESHOLD_HOURS * 60 * 60 * 1000);

  const candidates = await ComplaintModel.find({
    status: { $in: ACTIVE_STATUSES },
    createdAt: { $lt: cutoff },
  });

  let escalated = 0;
  let skipped = 0;
  const ids = [];

  for (const complaint of candidates) {
    if (isAlreadyEscalated(complaint)) {
      skipped++;
      continue;
    }

    const ageHours = Math.round((Date.now() - complaint.createdAt.getTime()) / (1000 * 60 * 60));

    complaint.statusHistory.push({
      status: complaint.status,
      changedBy: null,
      changedByName: 'System',
      notes: `Auto-escalated: overdue by ${ageHours}h (threshold: ${ESCALATION_THRESHOLD_HOURS}h)`,
      timestamp: new Date(),
    });

    if (complaint.priority !== 'urgent') {
      complaint.priority = 'urgent';
    }

    await complaint.save();
    ids.push(complaint._id.toString());
    escalated++;
  }

  return { escalated, skipped, ids };
}

module.exports = {
  escalateOverdueComplaints,
  previewEscalation,
  ESCALATION_THRESHOLD_HOURS,
  ACTIVE_STATUSES,
};

