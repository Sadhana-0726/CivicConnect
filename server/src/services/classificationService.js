/**
 * classificationService.js
 * Rule-based complaint categorization and priority detection.
 * Uses keyword matching — no external AI/ML integrations.
 */

'use strict';

const CATEGORY_KEYWORDS = {
  road: [
    'pothole', 'road', 'asphalt', 'pavement', 'footpath', 'sidewalk',
    'highway', 'street', 'tar', 'concrete', 'crack', 'bump', 'diversion',
    'barrier', 'median', 'divider', 'speed breaker',
  ],
  streetlight: [
    'streetlight', 'street light', 'lamp', 'lamppost', 'light post',
    'lighting', 'dark road', 'no light', 'bulb', 'tube light', 'led light',
  ],
  sanitation: [
    'garbage', 'trash', 'waste', 'dustbin', 'bin', 'litter', 'rubbish',
    'sewage', 'drain overflow', 'dump', 'open defecation', 'stench', 'smell',
    'sanitation', 'hygiene', 'toilet',
  ],
  water: [
    'water', 'pipe', 'leak', 'leakage', 'burst pipe', 'no water supply',
    'water supply', 'tap', 'water tank', 'contamination', 'dirty water',
    'drinking water', 'borewell', 'handpump',
  ],
  drainage: [
    'drain', 'drainage', 'flood', 'flooding', 'waterlogging', 'overflow',
    'blocked drain', 'clogged', 'stagnant water', 'puddle', 'gutter',
    'manhole', 'cover missing',
  ],
  electricity: [
    'electricity', 'electric', 'power', 'power cut', 'outage', 'blackout',
    'transformer', 'wire', 'cable', 'pole', 'substation', 'meter', 'spark',
    'short circuit',
  ],
  public_safety: [
    'safety', 'accident', 'crime', 'theft', 'robbery', 'violence', 'fire',
    'danger', 'hazard', 'security', 'police', 'animal', 'stray dog',
    'construction hazard', 'abandoned vehicle', 'illegal parking',
  ],
};

const PRIORITY_KEYWORDS = {
  urgent: [
    'emergency', 'fire', 'collapse', 'flooding', 'burst', 'electrocution',
    'accident', 'injury', 'dead', 'death', 'critical', 'explosion',
    'gas leak', 'short circuit', 'live wire',
  ],
  high: [
    'dangerous', 'hazard', 'major', 'severe', 'broken', 'blocked',
    'no water', 'power cut', 'waterlogging', 'dark road', 'stray animal',
    'robbery', 'crime', 'large pothole',
  ],
  medium: [
    'damaged', 'repair', 'maintenance', 'overdue', 'not working',
    'faulty', 'complaint', 'issue', 'problem',
  ],
  low: [
    'minor', 'small', 'request', 'suggestion', 'improve',
    'beautification', 'painting', 'trimming',
  ],
};

/**
 * Tokenize text into lowercase words.
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text.toLowerCase().split(/\s+|[,;.!?]/);
}

/**
 * Count how many keywords from a list appear in text tokens.
 * @param {string[]} tokens
 * @param {string[]} keywords
 * @returns {number}
 */
function countMatches(tokens, keywords) {
  let count = 0;
  const text = tokens.join(' ');
  for (const kw of keywords) {
    if (text.includes(kw)) count++;
  }
  return count;
}

/**
 * Detect the best-matching complaint category from title + description.
 * Returns the category string or null if no keywords match.
 * @param {string} title
 * @param {string} description
 * @returns {string|null}
 */
function detectCategory(title, description) {
  const tokens = tokenize(`${title || ''} ${description || ''}`);
  if (tokens.length === 0) return null;

  let bestCategory = null;
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = countMatches(tokens, keywords);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  return bestScore > 0 ? bestCategory : null;
}

/**
 * Detect complaint priority from title + description (and optionally category).
 * Returns 'low' | 'medium' | 'high' | 'urgent'.
 * @param {string} title
 * @param {string} description
 * @param {string} [category]
 * @returns {string}
 */
function detectPriority(title, description, category) {
  const tokens = tokenize(`${title || ''} ${description || ''}`);

  // Check priorities from highest to lowest
  for (const level of ['urgent', 'high', 'medium', 'low']) {
    const score = countMatches(tokens, PRIORITY_KEYWORDS[level]);
    if (score > 0) return level;
  }

  // Default priority by category
  const categoryDefaults = {
    road: 'medium',
    streetlight: 'medium',
    sanitation: 'medium',
    water: 'high',
    drainage: 'high',
    electricity: 'high',
    public_safety: 'high',
    other: 'low',
  };

  return (category && categoryDefaults[category]) || 'low';
}

/**
 * Suggest a department based on category.
 * @param {string} category
 * @returns {string}
 */
function suggestDepartment(category) {
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
  return CATEGORY_DEPT_MAP[category] || 'Public Safety & General';
}

/**
 * Run full classification on a complaint's text fields.
 * @param {string} title
 * @param {string} description
 * @param {string} [existingCategory] - if already set, skip auto-categorization
 * @returns {{ category: string|null, priority: string, department: string, autoClassified: boolean, autoPriority: boolean }}
 */
function classifyComplaint(title, description, existingCategory) {
  const autoClassified = !existingCategory;
  const detectedCategory = autoClassified
    ? detectCategory(title, description)
    : existingCategory;

  const finalCategory = detectedCategory || existingCategory || 'other';
  const priority = detectPriority(title, description, finalCategory);
  const department = suggestDepartment(finalCategory);

  return {
    category: autoClassified ? detectedCategory : null, // null = use existing
    priority,
    department,
    autoClassified: autoClassified && !!detectedCategory,
    autoPriority: true,
  };
}

module.exports = {
  detectCategory,
  detectPriority,
  suggestDepartment,
  classifyComplaint,
  CATEGORY_KEYWORDS,
  PRIORITY_KEYWORDS,
};

