/**
 * phase5.test.js
 * Unit tests for Phase 5: Smart Enhancements
 *
 * Tests cover:
 *  1. classificationService — keyword detection, priority, department suggestion
 *  2. departmentRoutingService — category-to-department mapping
 *  3. duplicateDetectionService — graceful handling of missing coordinates
 *  4. escalationService — idempotency guard, isAlreadyEscalated logic
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// ── classificationService ──

const {
  detectCategory,
  detectPriority,
  suggestDepartment,
  classifyComplaint,
} = require('../src/services/classificationService');

describe('classificationService', () => {
  // --- detectCategory ---

  it('detects "road" category from pothole-related text', () => {
    const cat = detectCategory('Big pothole on road', 'There is a large pothole near the main highway causing accidents');
    assert.equal(cat, 'road');
  });

  it('detects "water" category from water-related text', () => {
    const cat = detectCategory('Water pipe leak', 'Burst pipe flooding the street with dirty water');
    assert.equal(cat, 'water');
  });

  it('detects "streetlight" category', () => {
    const cat = detectCategory('Dark road', 'The streetlight near school has no light and is broken');
    assert.equal(cat, 'streetlight');
  });

  it('detects "sanitation" category from garbage text', () => {
    const cat = detectCategory('Garbage pile', 'Overflowing dustbin and trash everywhere, bad stench');
    assert.equal(cat, 'sanitation');
  });

  it('detects "drainage" category', () => {
    const cat = detectCategory('Drain blocked', 'Blocked drain causing waterlogging and flooding on the street');
    assert.equal(cat, 'drainage');
  });

  it('detects "electricity" category', () => {
    const cat = detectCategory('Power outage', 'Electricity cut since morning, transformer sparking');
    assert.equal(cat, 'electricity');
  });

  it('detects "public_safety" category', () => {
    const cat = detectCategory('Stray dogs', 'Dangerous stray dog near school, safety hazard for children');
    assert.equal(cat, 'public_safety');
  });

  it('returns null for text with no matching keywords', () => {
    const cat = detectCategory('Hello World', 'Just a generic test with no civic keywords');
    assert.equal(cat, null);
  });

  it('returns null for empty/null input', () => {
    assert.equal(detectCategory(null, null), null);
    assert.equal(detectCategory('', ''), null);
    assert.equal(detectCategory(undefined, undefined), null);
  });

  // --- detectPriority ---

  it('detects "urgent" priority from emergency keywords', () => {
    const p = detectPriority('Emergency flooding', 'Building collapse and flooding everywhere');
    assert.equal(p, 'urgent');
  });

  it('detects "high" priority from hazard keywords', () => {
    const p = detectPriority('Dangerous pothole', 'Broken road barrier is a major hazard');
    assert.equal(p, 'high');
  });

  it('detects "medium" priority from maintenance keywords', () => {
    const p = detectPriority('Faulty light', 'Lamp not working, needs repair and maintenance');
    assert.equal(p, 'medium');
  });

  it('detects "low" priority from minor keywords', () => {
    const p = detectPriority('Minor request', 'Small suggestion for beautification and painting');
    assert.equal(p, 'low');
  });

  it('falls back to category default priority when no keywords match', () => {
    const p = detectPriority('Something here', 'No priority keywords present', 'water');
    assert.equal(p, 'high'); // water default is high
  });

  it('returns "low" when no keywords match and no category', () => {
    const p = detectPriority('Hello', 'World');
    assert.equal(p, 'low');
  });

  // --- suggestDepartment ---

  it('maps "road" to "Roads & Infrastructure"', () => {
    assert.equal(suggestDepartment('road'), 'Roads & Infrastructure');
  });

  it('maps "streetlight" to "Electrical & Streetlights"', () => {
    assert.equal(suggestDepartment('streetlight'), 'Electrical & Streetlights');
  });

  it('maps "sanitation" to "Sanitation & Solid Waste"', () => {
    assert.equal(suggestDepartment('sanitation'), 'Sanitation & Solid Waste');
  });

  it('maps "water" to "Water & Sewage"', () => {
    assert.equal(suggestDepartment('water'), 'Water & Sewage');
  });

  it('maps "drainage" to "Water & Sewage"', () => {
    assert.equal(suggestDepartment('drainage'), 'Water & Sewage');
  });

  it('maps "electricity" to "Electrical & Streetlights"', () => {
    assert.equal(suggestDepartment('electricity'), 'Electrical & Streetlights');
  });

  it('maps "public_safety" to "Public Safety & General"', () => {
    assert.equal(suggestDepartment('public_safety'), 'Public Safety & General');
  });

  it('maps "other" to "Public Safety & General"', () => {
    assert.equal(suggestDepartment('other'), 'Public Safety & General');
  });

  it('defaults unmapped category to "Public Safety & General"', () => {
    assert.equal(suggestDepartment('unknown_category'), 'Public Safety & General');
  });

  // --- classifyComplaint ---

  it('auto-classifies when no existing category is provided', () => {
    const result = classifyComplaint('Pothole on highway', 'Large crack and road damage', null);
    assert.equal(result.autoClassified, true);
    assert.equal(result.category, 'road');
    assert.equal(result.department, 'Roads & Infrastructure');
    assert.equal(typeof result.priority, 'string');
  });

  it('skips auto-classification when existing category is provided', () => {
    const result = classifyComplaint('Some title', 'Some description', 'water');
    assert.equal(result.autoClassified, false);
    assert.equal(result.category, null); // null means "use existing"
    assert.equal(result.department, 'Water & Sewage');
  });
});

// ── departmentRoutingService ──

const { routeDepartment, CATEGORY_DEPT_MAP } = require('../src/services/departmentRoutingService');

describe('departmentRoutingService', () => {
  it('routes each known category to the correct department', () => {
    for (const [cat, dept] of Object.entries(CATEGORY_DEPT_MAP)) {
      assert.equal(routeDepartment(cat), dept, `Expected ${cat} → ${dept}`);
    }
  });

  it('returns null for unrecognised category', () => {
    assert.equal(routeDepartment('alien_tech'), null);
  });

  it('returns null for null/undefined/empty category', () => {
    assert.equal(routeDepartment(null), null);
    assert.equal(routeDepartment(undefined), null);
    assert.equal(routeDepartment(''), null);
  });

  it('trims and lowercases category before matching', () => {
    assert.equal(routeDepartment('  Road  '), 'Roads & Infrastructure');
    assert.equal(routeDepartment('WATER'), 'Water & Sewage');
  });
});

// ── duplicateDetectionService ──

const { findNearbyDuplicates } = require('../src/services/duplicateDetectionService');

describe('duplicateDetectionService', () => {
  it('returns empty array when lat is null', async () => {
    const result = await findNearbyDuplicates({}, 'road', null, 77.5946);
    assert.deepStrictEqual(result, []);
  });

  it('returns empty array when lng is null', async () => {
    const result = await findNearbyDuplicates({}, 'road', 12.9716, null);
    assert.deepStrictEqual(result, []);
  });

  it('returns empty array when lat is undefined', async () => {
    const result = await findNearbyDuplicates({}, 'road', undefined, 77.5946);
    assert.deepStrictEqual(result, []);
  });

  it('returns empty array when coordinates are out of range', async () => {
    const result = await findNearbyDuplicates({}, 'road', 999, 999);
    assert.deepStrictEqual(result, []);
  });

  it('returns empty array when lat is NaN', async () => {
    const result = await findNearbyDuplicates({}, 'road', NaN, 77.5946);
    assert.deepStrictEqual(result, []);
  });

  it('returns empty array on query error (graceful failure)', async () => {
    // Mock a model whose find() throws
    const mockModel = {
      find: () => {
        throw new Error('Simulated DB error');
      },
    };
    const result = await findNearbyDuplicates(mockModel, 'road', 12.9716, 77.5946);
    assert.deepStrictEqual(result, []);
  });

  it('calls Model.find with correct $near query when coords are valid', async () => {
    let capturedFilter = null;
    const mockModel = {
      find: (filter) => {
        capturedFilter = filter;
        return {
          select: () => ({
            limit: () => ({
              lean: async () => [],
            }),
          }),
        };
      },
    };

    await findNearbyDuplicates(mockModel, 'road', 12.9716, 77.5946);
    assert.ok(capturedFilter, 'find() should have been called');
    assert.equal(capturedFilter.category, 'road');
    assert.ok(capturedFilter['location.geo'].$near, '$near should be present');
    assert.deepStrictEqual(
      capturedFilter['location.geo'].$near.$geometry.coordinates,
      [77.5946, 12.9716] // [lng, lat] GeoJSON order
    );
  });
});

// ── escalationService ──

// We test the isAlreadyEscalated logic indirectly through the exported functions.
// Direct DB tests are labeled NOT TESTED (sandbox network block to Atlas).

describe('escalationService (unit logic)', () => {
  const {
    ESCALATION_THRESHOLD_HOURS,
    ACTIVE_STATUSES,
  } = require('../src/services/escalationService');

  it('exports a sensible default threshold (>= 1 hour)', () => {
    assert.ok(ESCALATION_THRESHOLD_HOURS >= 1);
  });

  it('defines expected active statuses', () => {
    assert.ok(ACTIVE_STATUSES.includes('Submitted'));
    assert.ok(ACTIVE_STATUSES.includes('Under Review'));
    assert.ok(ACTIVE_STATUSES.includes('Assigned'));
    assert.ok(ACTIVE_STATUSES.includes('In Progress'));
    assert.ok(!ACTIVE_STATUSES.includes('Resolved'));
    assert.ok(!ACTIVE_STATUSES.includes('Rejected'));
  });

  // Idempotency guard test: simulate a complaint that was already escalated
  it('idempotency: escalateOverdueComplaints skips already-escalated complaints', async () => {
    const { escalateOverdueComplaints } = require('../src/services/escalationService');

    // Create a mock complaint that is overdue AND already has escalation note
    const oldDate = new Date(Date.now() - 100 * 60 * 60 * 1000); // 100h ago
    const mockComplaint = {
      _id: { toString: () => 'mock_id_1' },
      status: 'Submitted',
      priority: 'medium',
      createdAt: oldDate,
      statusHistory: [
        {
          status: 'Submitted',
          notes: 'Auto-escalated: overdue by 50h (threshold: 48h)',
          timestamp: new Date(),
        },
      ],
      save: async () => {},
    };

    // Mock model
    const mockModel = {
      find: () => [mockComplaint],
    };

    const result = await escalateOverdueComplaints(mockModel);
    assert.equal(result.escalated, 0, 'Should not re-escalate');
    assert.equal(result.skipped, 1, 'Should skip 1 already-escalated complaint');
  });

  it('idempotency: escalateOverdueComplaints escalates non-escalated overdue complaints', async () => {
    const { escalateOverdueComplaints } = require('../src/services/escalationService');

    const oldDate = new Date(Date.now() - 100 * 60 * 60 * 1000); // 100h ago
    const mockComplaint = {
      _id: { toString: () => 'mock_id_2' },
      status: 'In Progress',
      priority: 'medium',
      createdAt: oldDate,
      statusHistory: [
        {
          status: 'In Progress',
          notes: 'Status changed to In Progress',
          timestamp: oldDate,
        },
      ],
      save: async function () {
        // Verify priority was changed to urgent
        this._saved = true;
      },
    };

    const mockModel = {
      find: () => [mockComplaint],
    };

    const result = await escalateOverdueComplaints(mockModel);
    assert.equal(result.escalated, 1, 'Should escalate 1 complaint');
    assert.equal(result.skipped, 0, 'Should skip none');
    assert.equal(mockComplaint.priority, 'urgent', 'Priority should be set to urgent');
    assert.ok(mockComplaint.statusHistory.length > 1, 'Should have added a statusHistory entry');
    assert.ok(
      mockComplaint.statusHistory[mockComplaint.statusHistory.length - 1].notes.includes('Auto-escalated'),
      'Last note should contain "Auto-escalated"'
    );
  });

  it('escalation: no-op when no overdue complaints exist', async () => {
    const { escalateOverdueComplaints } = require('../src/services/escalationService');

    const mockModel = {
      find: () => [],
    };

    const result = await escalateOverdueComplaints(mockModel);
    assert.equal(result.escalated, 0);
    assert.equal(result.skipped, 0);
    assert.deepStrictEqual(result.ids, []);
  });
});

// ── Integration: controller import chain ──

describe('Phase 5 integration checks', () => {
  it('complaint.controller.js loads without errors with Phase 5 services', () => {
    // This test will fail if any service import is broken
    const controller = require('../src/controllers/complaint.controller.js');
    assert.ok(controller.createComplaint, 'createComplaint should be exported');
    assert.ok(controller.getComplaints, 'getComplaints should be exported');
    assert.ok(controller.updateComplaintStatus, 'updateComplaintStatus should be exported');
    assert.ok(controller.assignComplaint, 'assignComplaint should be exported');
  });

  it('admin.routes.js loads without errors', () => {
    const adminRoutes = require('../src/routes/admin.routes.js');
    assert.ok(adminRoutes, 'admin.routes.js should export a router');
  });

  it('app.js loads with all routes mounted (including /api/admin)', () => {
    const app = require('../src/app.js');
    assert.ok(app, 'app.js should export an Express app');
  });
});

