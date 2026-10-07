// Comprehensive API and Route Verification Suite for AI Radar
const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function fetchRoute(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'localhost:3000',
        'Origin': 'http://localhost:3000',
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const durationMs = Date.now() - start;
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { length: text.length, preview: text.slice(0, 100).replace(/\s+/g, ' ') };
    }
    return {
      path,
      method: options.method || 'GET',
      status: res.status,
      ok: res.ok,
      durationMs,
      contentType,
      data,
    };
  } catch (err) {
    return {
      path,
      method: options.method || 'GET',
      status: 0,
      ok: false,
      durationMs: Date.now() - start,
      error: err.message,
    };
  }
}

async function runVerification() {
  console.log('\n======================================================');
  console.log('       AI RADAR — SYSTEM & API HEALTH AUDIT           ');
  console.log('======================================================\n');

  const pagesToTest = [
    '/',
    '/news',
    '/tools',
    '/research',
    '/coding-agents',
    '/trends',
    '/career',
    '/business',
    '/safety',
    '/briefing',
    '/pricing',
    '/account/billing',
    '/diagnostics',
    '/settings',
    '/login',
    '/signup',
    '/onboarding',
    '/welcome',
  ];

  console.log('--- 1. TESTING FRONTEND ROUTES (SSR / STATIC) ---');
  let pagePassCount = 0;
  for (const page of pagesToTest) {
    const res = await fetchRoute(page);
    const pass = res.status === 200;
    if (pass) pagePassCount++;
    console.log(
      `[${res.status}] ${res.method} ${page.padEnd(20)} (${res.durationMs}ms) ${pass ? '✅ PASS' : '❌ FAIL'}`
    );
  }
  console.log(`\nPage Results: ${pagePassCount}/${pagesToTest.length} passed.`);

  console.log('\n--- 2. TESTING INTELLIGENCE & PRODUCT GET APIs ---');
  const getApis = [
    '/api/billing/plans',
    '/api/search?q=intelligence',
    '/api/trends',
    '/api/career',
    '/api/projects',
    '/api/briefing',
    '/api/auth/me',
    '/api/billing/subscription',
    '/api/billing/usage',
    '/api/billing/invoices',
    '/api/feedback/report',
    '/api/admin/billing',
    '/api/topics',
    '/api/preferences',
    '/api/profile',
    '/api/saved',
  ];

  let getPassCount = 0;
  for (const api of getApis) {
    const res = await fetchRoute(api);
    const isExpected = res.status === 200 || res.status === 401;
    if (isExpected) getPassCount++;
    const summary = res.data && typeof res.data === 'object' 
      ? (res.data.ok !== undefined ? `ok:${res.data.ok}` : Object.keys(res.data).slice(0, 3).join(','))
      : '';
    console.log(
      `[${res.status}] GET ${api.padEnd(28)} (${res.durationMs}ms) ${isExpected ? '✅ PASS' : '❌ FAIL'} [${summary}]`
    );
  }
  console.log(`\nGET API Results: ${getPassCount}/${getApis.length} responding as designed.`);

  console.log('\n--- 3. TESTING MUTATION & WORKFLOW POST APIs ---');
  const postApis = [
    {
      path: '/api/collect',
      body: { slug: 'world-ai-news' },
      description: 'Trigger live news sync',
      expectedStatuses: [200, 201],
    },
    {
      path: '/api/feedback',
      body: {
        entity_type: 'item',
        entity_id: '00000000-0000-0000-0000-000000000001',
        feedback_type: 'useful',
        notes: 'Great article on autonomous agents',
      },
      description: 'Submit intelligence feedback',
      expectedStatuses: [200, 201],
    },
    {
      path: '/api/briefing',
      body: { force: true },
      description: 'Generate / synthesize daily briefing',
      expectedStatuses: [200, 201],
    },
    {
      path: '/api/trends',
      body: {},
      description: 'Run multi-source trend discovery',
      expectedStatuses: [200, 201],
    },
  ];

  let postPassCount = 0;
  for (const endpoint of postApis) {
    const res = await fetchRoute(endpoint.path, { method: 'POST', body: endpoint.body });
    const isSuccess = endpoint.expectedStatuses.includes(res.status);
    if (isSuccess) postPassCount++;
    const summary = res.data && typeof res.data === 'object' ? JSON.stringify(res.data).slice(0, 100) : '';
    console.log(
      `[${res.status}] POST ${endpoint.path.padEnd(24)} (${res.durationMs}ms) ${isSuccess ? '✅ PASS' : '❌ FAIL'} - ${summary}`
    );
  }
  console.log(`\nPOST API Results: ${postPassCount}/${postApis.length} passed.`);

  console.log('\n======================================================');
  console.log('                 AUDIT SUMMARY                        ');
  console.log(`Pages:     ${pagePassCount}/${pagesToTest.length} OK`);
  console.log(`GET APIs:  ${getPassCount}/${getApis.length} OK`);
  console.log(`POST APIs: ${postPassCount}/${postApis.length} OK`);
  console.log('======================================================\n');
}

runVerification();
