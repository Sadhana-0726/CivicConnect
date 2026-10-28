/**
 * duplicateDetectionService.js
 * Detects near-duplicate complaints using MongoDB geospatial ($near) queries.
 * Falls back gracefully when coordinates are missing.
 */

'use strict';

const DEFAULT_RADIUS_METERS = 200; // 200 m radius
const DEFAULT_MAX_AGE_HOURS = 72; // Within the last 72 hours

/**
 * Find existing complaints near the same location with the same category.
 *
 * Uses the sparse `2dsphere` index on `location.geo`.
 * If lat/lng are not finite numbers, returns [] (no crash).
 *
 * @param {object} ComplaintModel - Mongoose Complaint model
 * @param {string} category - Complaint category to match
 * @param {number|null} lat - Latitude
 * @param {number|null} lng - Longitude
 * @param {number} [radiusMeters] - Search radius in metres
 * @param {number} [maxAgeHours] - Only look at complaints newer than this
 * @returns {Promise<Array>} Array of nearby duplicate complaint summaries
 */
async function findNearbyDuplicates(
  ComplaintModel,
  category,
  lat,
  lng,
  radiusMeters = DEFAULT_RADIUS_METERS,
  maxAgeHours = DEFAULT_MAX_AGE_HOURS
) {
  // Guard: skip spatial check if coordinates are missing or invalid
  if (
    lat == null ||
    lng == null ||
    !Number.isFinite(Number(lat)) ||
    !Number.isFinite(Number(lng))
  ) {
    return [];
  }

  const numLat = Number(lat);
  const numLng = Number(lng);

  // Validate coordinate ranges
  if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
    return [];
  }

  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  try {
    const duplicates = await ComplaintModel.find({
      category,
      createdAt: { $gte: cutoff },
      status: { $nin: ['Resolved', 'Rejected'] },
      'location.geo': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [numLng, numLat], // GeoJSON is [lng, lat]
          },
          $maxDistance: radiusMeters,
        },
      },
    })
      .select('_id title status location createdAt')
      .limit(5)
      .lean();

    return duplicates;
  } catch (err) {
    // If the 2dsphere index is unavailable or the query fails for any reason,
    // log a warning but do NOT crash the complaint submission flow.
    console.warn('[duplicateDetection] Geospatial query failed:', err.message);
    return [];
  }
}

module.exports = { findNearbyDuplicates, DEFAULT_RADIUS_METERS, DEFAULT_MAX_AGE_HOURS };

