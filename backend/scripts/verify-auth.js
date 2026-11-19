/**
 * Phase 4 auth verification — runs against a live local server.
 * Usage: node scripts/verify-auth.js
 * Requires: backend server running on port 5000 with a seeded DB.
 */
const http = require('http');

const BASE = 'http://localhost:5000/api/auth';
let passed = 0;
let failed = 0;

async function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    const url = new URL(BASE + path);
    const req = http.request(url, opts, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

const TEST_EMAIL = `verify_${Date.now()}@test.com`;
const TEST_PASS  = 'TestPass123!';
let accessToken;

async function run() {
  console.log('\n── Phase 4 Auth Verification ────────────────────────────────\n');

  // 1. Register
  {
    const r = await request('POST', '/register', { name: 'Test User', email: TEST_EMAIL, password: TEST_PASS });
    assert('Register returns 201', r.status === 201);
    assert('Register returns token', !!r.body.data?.token);
    assert('Register does not return password', !r.body.data?.user?.password);
    accessToken = r.body.data?.token;
  }

  // 2. Duplicate register
  {
    const r = await request('POST', '/register', { name: 'Dup', email: TEST_EMAIL, password: TEST_PASS });
    assert('Duplicate email returns 409', r.status === 409);
  }

  // 3. Login with wrong password
  {
    const r = await request('POST', '/login', { email: TEST_EMAIL, password: 'wrongpass' });
    assert('Wrong password returns 401', r.status === 401);
  }

  // 4. Login correct
  {
    const r = await request('POST', '/login', { email: TEST_EMAIL, password: TEST_PASS });
    assert('Login returns 200', r.status === 200);
    assert('Login returns token', !!r.body.data?.token);
    assert('Login returns refreshToken', !!r.body.data?.refreshToken);
    assert('Login does not return password', !r.body.data?.user?.password);
    accessToken = r.body.data?.token;
  }

  // 5. GET /me with valid token
  {
    const r = await request('GET', '/me', null, { Authorization: `Bearer ${accessToken}` });
    assert('GET /me with valid token returns 200', r.status === 200);
    assert('GET /me returns email', r.body.data?.email === TEST_EMAIL);
  }

  // 6. GET /me without token
  {
    const r = await request('GET', '/me', null);
    assert('GET /me without token returns 401', r.status === 401);
  }

  // 7. GET /me with garbage token
  {
    const r = await request('GET', '/me', null, { Authorization: 'Bearer garbage.token.here' });
    assert('GET /me with bad token returns 401', r.status === 401);
  }

  // 8. Forgot password (stub)
  {
    const r = await request('POST', '/forgot-password', { email: TEST_EMAIL });
    assert('Forgot password returns 200 (stub)', r.status === 200);
    assert('Forgot password returns generic message', typeof r.body.data?.message === 'string');
  }

  // 9. Reset password (501 stub)
  {
    const r = await request('POST', '/reset-password', { token: 'any', password: 'newpass' });
    assert('Reset password returns 501 (stub)', r.status === 501);
  }

  // 10. Validation — short password
  {
    const r = await request('POST', '/register', { name: 'X', email: 'bad@test.com', password: '123' });
    assert('Short password rejected (422)', r.status === 422);
  }

  console.log(`\n── Result: ${passed} passed, ${failed} failed ──────────────────────────\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('\nFailed to connect to server:', e.message);
  console.error('Make sure the backend is running: npm run dev (in backend/)');
  process.exit(1);
});
