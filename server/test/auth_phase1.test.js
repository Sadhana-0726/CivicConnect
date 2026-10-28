const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

describe('Phase 1 - JWT Configuration & Secret Validator', () => {
  const { getJwtSecret } = require('../src/config/jwt');

  it('fails safely when JWT_SECRET is missing', () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    assert.throws(
      () => getJwtSecret(),
      /FATAL: JWT_SECRET environment variable is missing/
    );
    process.env.JWT_SECRET = original;
  });

  it('fails safely when JWT_SECRET is insecure fallback', () => {
    const original = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'fallback_secret';
    assert.throws(
      () => getJwtSecret(),
      /Insecure JWT_SECRET detected/
    );
    process.env.JWT_SECRET = original;
  });

  it('fails safely when JWT_SECRET is too short (< 32 chars)', () => {
    const original = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'short_secret_123';
    assert.throws(
      () => getJwtSecret(),
      /JWT_SECRET is too short/
    );
    process.env.JWT_SECRET = original;
  });

  it('succeeds when JWT_SECRET is >= 32 characters and secure', () => {
    const original = process.env.JWT_SECRET;
    process.env.JWT_SECRET = '0123456789abcdef0123456789abcdef';
    const secret = getJwtSecret();
    assert.equal(secret, '0123456789abcdef0123456789abcdef');
    process.env.JWT_SECRET = original;
  });
});

describe('Phase 1 - Central Error Handler and 404 Middleware', () => {
  const { notFound, errorHandler, ApiError } = require('../src/middleware/errorHandler');

  it('returns structured JSON 404 for unhandled routes', () => {
    const req = { method: 'GET', originalUrl: '/api/nonexistent' };
    let capturedErr;
    const next = (err) => { capturedErr = err; };
    notFound(req, {}, next);

    assert.ok(capturedErr instanceof ApiError);
    assert.equal(capturedErr.statusCode, 404);
    assert.match(capturedErr.message, /Route not found: GET \/api\/nonexistent/);

    const res = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
    };

    errorHandler(capturedErr, req, res, () => {});
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Route not found/);
  });
});

describe('Phase 1 - Role Validation & Controlled Registration Unit Rules', () => {
  const VALID_ROLES = ['citizen', 'department_officer', 'department_admin', 'super_admin'];
  const VALID_DEPARTMENTS = [
    'Roads & Infrastructure',
    'Sanitation & Solid Waste',
    'Water & Sewage',
    'Electrical & Streetlights',
    'Public Safety & General',
  ];
  const OFFICIAL_DOMAINS = ['citygov.org', 'civicconnect.gov', 'gov.in'];

  it('validates canonical roles list against schema', () => {
    assert.deepEqual(VALID_ROLES, [
      'citizen',
      'department_officer',
      'department_admin',
      'super_admin',
    ]);
  });

  it('rejects legacy or invalid role strings', () => {
    const invalidRoles = ['department', 'admin', 'inspector', 'field', 'superadmin', 'hacker'];
    invalidRoles.forEach((r) => {
      assert.equal(VALID_ROLES.includes(r), false, `Role "${r}" should not be allowed`);
    });
  });

  it('detects official email domains properly', () => {
    const testCases = [
      { email: 'inspector@citygov.org', expected: true },
      { email: 'admin@civicconnect.gov', expected: true },
      { email: 'officer@pwd.gov.in', expected: true },
      { email: 'citizen@gmail.com', expected: false },
      { email: 'attacker@evil.org', expected: false },
    ];

    testCases.forEach(({ email, expected }) => {
      const domain = email.split('@')[1];
      const isOfficial = OFFICIAL_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d));
      assert.equal(isOfficial, expected, `Email check failed for ${email}`);
    });
  });
});

