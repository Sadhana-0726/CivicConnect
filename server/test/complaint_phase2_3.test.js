const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('stream');
const jwt = require('jsonwebtoken');
const { Complaint, CATEGORIES, STATUSES, DEPARTMENTS, normalizeStatus } = require('../src/models/Complaint');
const { protect, restrictTo } = require('../src/middleware/auth');
const { getJwtSecret } = require('../src/config/jwt');

function dispatch(app, { method = 'GET', url = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const bodyStr = body !== null ? JSON.stringify(body) : null;
    const req = bodyStr !== null ? Readable.from([Buffer.from(bodyStr)]) : Readable.from([]);

    req.method = method;
    req.url = url;
    req.originalUrl = url;
    req.headers = {
      ...(bodyStr !== null ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(bodyStr) } : {}),
      ...headers,
    };

    let statusCode = 200;
    let resHeaders = {};
    let rawBody = '';

    const res = {
      statusCode: 200,
      status(code) {
        statusCode = code;
        this.statusCode = code;
        return this;
      },
      setHeader(k, v) {
        resHeaders[k.toLowerCase()] = v;
        return this;
      },
      getHeader(k) {
        return resHeaders[k.toLowerCase()];
      },
      write(chunk) {
        if (chunk) rawBody += chunk.toString();
        return true;
      },
      end(chunk) {
        if (chunk) rawBody += chunk.toString();
        let parsed = rawBody;
        try {
          parsed = JSON.parse(rawBody);
        } catch (e) {}
        resolve({ status: statusCode, headers: resHeaders, body: parsed });
      },
      json(obj) {
        resHeaders['content-type'] = 'application/json';
        statusCode = this.statusCode || 200;
        resolve({ status: statusCode, headers: resHeaders, body: obj });
      },
      send(data) {
        this.end(data);
      },
    };

    app(req, res, (err) => {
      if (err) reject(err);
    });
  });
}

describe('Phase 2 — Complaint Schema, GIS & Model Integrity', () => {
  it('correctly exports Complaint model, CATEGORIES, STATUSES, and DEPARTMENTS', () => {
    assert.ok(Complaint);
    assert.ok(typeof Complaint.find === 'function');
    assert.ok(Array.isArray(CATEGORIES));
    assert.ok(Array.isArray(STATUSES));
    assert.ok(Array.isArray(DEPARTMENTS));
    assert.equal(STATUSES.length, 6);
    assert.deepEqual(STATUSES, [
      'Submitted',
      'Under Review',
      'Assigned',
      'In Progress',
      'Resolved',
      'Rejected',
    ]);
  });

  it('normalizes legacy and mixed-case status strings safely', () => {
    assert.equal(normalizeStatus('submitted'), 'Submitted');
    assert.equal(normalizeStatus('Submitted'), 'Submitted');
    assert.equal(normalizeStatus('under_review'), 'Under Review');
    assert.equal(normalizeStatus('under review'), 'Under Review');
    assert.equal(normalizeStatus('in_progress'), 'In Progress');
    assert.equal(normalizeStatus('in progress'), 'In Progress');
    assert.equal(normalizeStatus('pending'), 'In Progress');
    assert.equal(normalizeStatus('Pending'), 'In Progress');
    assert.equal(normalizeStatus('resolved'), 'Resolved');
    assert.equal(normalizeStatus('Resolved'), 'Resolved');
    assert.equal(normalizeStatus('rejected'), 'Rejected');
    assert.equal(normalizeStatus('invalid_status_xyz'), null);
    assert.equal(normalizeStatus(null), null);
    assert.equal(normalizeStatus(''), null);
  });

  it('synchronizes coordinates { lat, lng } into GeoJSON Point [lng, lat] without flipping', () => {
    const doc = new Complaint({
      title: 'Pothole on Main St',
      category: 'road',
      description: 'Deep road hazard near corner',
      location: {
        address: '100 Main St',
        coordinates: { lat: 12.9716, lng: 77.5946 },
      },
    });

    const preHooks = doc.schema.s.hooks._pres.get('save') || [];
    preHooks.forEach((h) => h.fn.call(doc));

    assert.ok(doc.location.geo);
    assert.equal(doc.location.geo.type, 'Point');
    // GeoJSON coordinate order must strictly be [longitude, latitude]
    assert.equal(doc.location.geo.coordinates[0], 77.5946); // Longitude first
    assert.equal(doc.location.geo.coordinates[1], 12.9716); // Latitude second

    // Backward compatibility: lat & lng remain untouched
    assert.equal(doc.location.coordinates.lat, 12.9716);
    assert.equal(doc.location.coordinates.lng, 77.5946);
    assert.equal(doc.location.address, '100 Main St');
  });

  it('populates coordinates { lat, lng } if GeoJSON Point is provided directly', () => {
    const doc = new Complaint({
      title: 'Broken streetlight',
      category: 'streetlight',
      description: 'Lamp fixture detached',
      location: {
        address: '2nd Cross',
        geo: {
          type: 'Point',
          coordinates: [77.601, 12.982], // [lng, lat]
        },
      },
    });

    const preHooks = doc.schema.s.hooks._pres.get('save') || [];
    preHooks.forEach((h) => h.fn.call(doc));

    assert.ok(doc.location.coordinates);
    assert.equal(doc.location.coordinates.lat, 12.982);
    assert.equal(doc.location.coordinates.lng, 77.601);
  });

  it('initializes statusHistory with default Submitted entry', () => {
    const doc = new Complaint({
      title: 'Garbage dump',
      category: 'sanitation',
      description: 'Uncollected waste accumulation',
    });

    const preHooks = doc.schema.s.hooks._pres.get('save') || [];
    preHooks.forEach((h) => h.fn.call(doc));

    assert.ok(Array.isArray(doc.statusHistory));
    assert.equal(doc.statusHistory.length, 1);
    assert.equal(doc.statusHistory[0].status, 'Submitted');
    assert.equal(doc.statusHistory[0].changedByName, 'Citizen');
  });
});

describe('Phase 3 — Complaint RBAC & Endpoint Authorization Tests', () => {
  const app = require('../src/app');

  it('PATCH /api/complaints/:id/status rejects unauthenticated requests with 401', async () => {
    const res = await dispatch(app, {
      method: 'PATCH',
      url: '/api/complaints/650000000000000000000001/status',
      body: { status: 'In Progress' },
    });
    assert.equal(res.status, 401);
    assert.match(res.body.message, /no token provided/);
  });

  it('PATCH /api/complaints/:id/assign rejects unauthenticated requests with 401', async () => {
    const res = await dispatch(app, {
      method: 'PATCH',
      url: '/api/complaints/650000000000000000000001/assign',
      body: { department: 'Roads & Infrastructure' },
    });
    assert.equal(res.status, 401);
    assert.match(res.body.message, /no token provided/);
  });

  it('GET /api/complaints/my-reports rejects unauthenticated requests with 401', async () => {
    const res = await dispatch(app, {
      method: 'GET',
      url: '/api/complaints/my-reports',
    });
    assert.equal(res.status, 401);
    assert.match(res.body.message, /no token provided/);
  });

  it('PATCH /api/complaints/:id/status rejects malformed token with 401', async () => {
    const res = await dispatch(app, {
      method: 'PATCH',
      url: '/api/complaints/650000000000000000000001/status',
      headers: { authorization: 'Bearer invalid.token.payload' },
      body: { status: 'In Progress' },
    });
    assert.equal(res.status, 401);
    assert.match(res.body.message, /token failed/);
  });

  it('restrictTo middleware blocks citizen from staff status update endpoint with 403', () => {
    const req = { user: { role: 'citizen' } };
    let responseStatus = 200;
    let responseBody = null;
    let nextCalled = false;

    const res = {
      status(code) { responseStatus = code; return this; },
      json(data) { responseBody = data; return this; },
    };
    const next = () => { nextCalled = true; };

    const middleware = restrictTo('department_officer', 'department_admin', 'super_admin');
    middleware(req, res, next);

    assert.equal(responseStatus, 403);
    assert.equal(nextCalled, false);
    assert.match(responseBody.message, /do not have permission/);
  });

  it('restrictTo middleware allows department_officer to proceed on status update', () => {
    const req = { user: { role: 'department_officer', department: 'Roads & Infrastructure' } };
    let nextCalled = false;
    const res = {};
    const next = () => { nextCalled = true; };

    const middleware = restrictTo('department_officer', 'department_admin', 'super_admin');
    middleware(req, res, next);

    assert.equal(nextCalled, true);
  });

  it('restrictTo middleware blocks department_officer from assignment endpoint with 403', () => {
    const req = { user: { role: 'department_officer', department: 'Roads & Infrastructure' } };
    let responseStatus = 200;
    let nextCalled = false;

    const res = {
      status(code) { responseStatus = code; return this; },
      json() { return this; },
    };
    const next = () => { nextCalled = true; };

    const middleware = restrictTo('department_admin', 'super_admin');
    middleware(req, res, next);

    assert.equal(responseStatus, 403);
    assert.equal(nextCalled, false);
  });

  it('restrictTo middleware allows department_admin and super_admin on assignment endpoint', () => {
    ['department_admin', 'super_admin'].forEach((role) => {
      const req = { user: { role } };
      let nextCalled = false;
      const res = {};
      const next = () => { nextCalled = true; };

      const middleware = restrictTo('department_admin', 'super_admin');
      middleware(req, res, next);

      assert.equal(nextCalled, true, `Expected role ${role} to be permitted`);
    });
  });
});

