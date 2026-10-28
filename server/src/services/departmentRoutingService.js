/**
 * departmentRoutingService.js
 * Maps complaint categories to responsible departments.
 * This mapping is the canonical source of truth for smart routing.
 */

'use strict';

const CATEGORY_DEPT_MAP = {
  road: 'Roads & Infrastructure',
  streetlight: 'Electrical & Streetlights',
  sanitation: 'Sanitation & Solid Waste',
  water: 'Water & Sewage',
  drainage: 'Water & Sewage',
  electricity: 'Electrical & Streetlights',
  public_safety: 'Public Safety & General',
  other: 'Public Safety & General',
};

/**
 * Return the department responsible for a given category.
 * Returns null if category is not recognised (callers must handle this).
 * @param {string} category
 * @returns {string|null}
 */
function routeDepartment(category) {
  if (!category || typeof category !== 'string') return null;
  return CATEGORY_DEPT_MAP[category.trim().toLowerCase()] || null;
}

module.exports = { routeDepartment, CATEGORY_DEPT_MAP };

