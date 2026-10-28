const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('stream');

// In-process mock HTTP dispatcher to test Express routes without network sockets
function dispatch(app, { method = 'GET', url = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    let req;
    const bodyStr = body !== null ? JSON.stringify(body) : null;

    if (bodyStr !== null) {
      req = Readable.from([Buffer.from(bodyStr)]);
    } else {
      req = Readable.from([]);
    }

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

describe('Phase 1 - In-Process Express Route Integration Tests', () => {
  process.env.JWT_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef';
  process.env.STAFF_REGISTRATION_KEY = 'test_staff_key_12345678';

  const app = require('../src/app');

  it('GET /api/health returns 200 with status ok', async () => {
    const res = await dispatch(app, { method: 'GET', url: '/api/health' });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  it('GET /api/unknown-endpoint triggers notFound with 404', async () => {
    const res = await dispatch(app, { method: 'GET', url: '/api/unknown-endpoint' });
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Route not found/);
  });

  it('POST /api/auth/register fails with 400 when missing required fields', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/auth/register',
      body: { email: 'user@example.com' },
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Please fill in all fields/);
  });

  it('POST /api/auth/register rejects invalid role with 400', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/auth/register',
      body: {
        name: 'Alex',
        email: 'alex@example.com',
        password: 'password123',
        role: 'invalid_role_xyz',
      },
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Invalid role/);
  });

  it('POST /api/auth/register rejects super_admin public self-registration with 403', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/auth/register',
      body: {
        name: 'Super User',
        email: 'super@example.com',
        password: 'password123',
        role: 'super_admin',
      },
    });
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /restricted/);
  });

  it('POST /api/auth/register rejects department_officer without department with 400 when staffKey is provided', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/auth/register',
      body: {
        name: 'Officer John',
        email: 'john@citygov.org',
        password: 'password123',
        role: 'department_officer',
        staffKey: 'test_staff_key_12345678',
      },
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Department is required/);
  });

  it('POST /api/auth/register rejects department_officer without staff key with 403', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/auth/register',
      body: {
        name: 'Fake Officer',
        email: 'fake@yahoo.com',
        password: 'password123',
        role: 'department_officer',
        department: 'Roads & Infrastructure',
      },
    });
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /restricted/);
  });

  it('POST /api/auth/login fails with 400 when credentials are missing', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/auth/login',
      body: {},
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Please provide email and password/);
  });
});
