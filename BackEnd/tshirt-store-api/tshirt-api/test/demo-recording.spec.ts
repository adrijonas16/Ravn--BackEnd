import { test, expect } from '@playwright/test';

const API = 'http://127.0.0.1:3000/api/v1';

let clientToken: string;
let managerToken: string;

// Muestra request + response visualmente en el browser para el video
async function showApiCall(
  page: any,
  title: string,
  method: string,
  url: string,
  token: string,
  body?: object,
  expectedStatus?: number,
) {
  const bodyStr = body ? JSON.stringify(body, null, 2) : '';
  const result = await page.evaluate(
    async ({ method, url, token, bodyStr }: any) => {
      const opts: any = {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      if (bodyStr) opts.body = bodyStr;
      const res = await fetch(url, opts);
      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    },
    { method, url, token, bodyStr },
  );

  // Render en pantalla
  await page.setContent(`
    <html>
    <head><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', sans-serif; background: #0d1117; color: #c9d1d9; padding: 48px 64px; }
      h1 { font-size: 32px; color: #58a6ff; margin-bottom: 8px; }
      .fix { font-size: 18px; color: #8b949e; margin-bottom: 32px; }
      .section { margin-bottom: 24px; }
      .label { font-size: 14px; color: #8b949e; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
      .method { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 14px; margin-right: 8px; }
      .GET { background: #1f6feb33; color: #58a6ff; }
      .POST { background: #23863533; color: #3fb950; }
      .PATCH { background: #9e6a0333; color: #d29922; }
      .DELETE { background: #f8514933; color: #f85149; }
      .url { font-family: monospace; font-size: 16px; color: #c9d1d9; }
      pre { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; font-size: 14px; overflow: auto; max-height: 340px; line-height: 1.5; }
      .status { font-size: 20px; font-weight: bold; margin-bottom: 12px; }
      .status-ok { color: #3fb950; }
      .status-err { color: #f85149; }
      .row { display: flex; gap: 32px; }
      .col { flex: 1; }
    </style></head>
    <body>
      <h1>${title}</h1>
      <div class="fix"><span class="method ${method}">${method}</span> <span class="url">${url.replace(API, '/api/v1')}</span></div>
      <div class="row">
        ${bodyStr ? `<div class="col section"><div class="label">Request Body</div><pre>${bodyStr}</pre></div>` : ''}
        <div class="col section">
          <div class="label">Response</div>
          <div class="status ${result.status < 400 ? 'status-ok' : 'status-err'}">HTTP ${result.status}</div>
          <pre>${JSON.stringify(result.data, null, 2)}</pre>
        </div>
      </div>
    </body></html>
  `);
  await page.waitForTimeout(4000);

  if (expectedStatus) {
    expect(result.status).toBe(expectedStatus);
  }
  return result;
}

test.describe('API Audit — Swagger Demo Videos', () => {
  test.beforeAll(async ({ request }) => {
    const c = await request.post(`${API}/auth/signin`, {
      data: { email: 'demo@tshirtstore.com', password: 'Demo1234!' },
    });
    clientToken = (await c.json()).accessToken;
    const m = await request.post(`${API}/auth/signin`, {
      data: { email: 'admin@tshirtstore.com', password: 'Admin123!' },
    });
    managerToken = (await m.json()).accessToken;
  });

  test('01 - FIX-22: Cart rejects quantity over 99', async ({ page }) => {
    await showApiCall(page,
      'FIX-22: Cart rejects quantity > 99',
      'POST', `${API}/cart/items`, clientToken,
      { productVariantId: 186, quantity: 100 },
      400,
    );
  });

  test('02 - FIX-07: Disabled product blocked from cart', async ({ page, request }) => {
    const prods = await request.get(`${API}/products?limit=1`);
    const prod = (await prods.json()).data[0];
    await request.patch(`${API}/products/${prod.id}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
      data: { status: 'disabled' },
    });

    await showApiCall(page,
      'FIX-07: Disabled product cannot be added to cart',
      'POST', `${API}/cart/items`, clientToken,
      { productVariantId: prod.variants[0].id, quantity: 1 },
      404,
    );

    await request.patch(`${API}/products/${prod.id}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
      data: { status: 'active' },
    });
  });

  test('03 - FIX-20: Manager creates category, client blocked', async ({ page }) => {
    // Manager creates
    await showApiCall(page,
      'FIX-20: Manager creates a category',
      'POST', `${API}/categories`, managerToken,
      { name: `Demo ${Date.now()}`, description: 'Created in video demo' },
      201,
    );

    // Client blocked
    await showApiCall(page,
      'FIX-20: Client cannot create categories',
      'POST', `${API}/categories`, clientToken,
      { name: 'Hacker' },
      403,
    );
  });

  test('04 - FIX-03: Delivery workload dashboard', async ({ page }) => {
    await showApiCall(page,
      'FIX-03: Manager sees delivery person workload',
      'GET', `${API}/orders/delivery-persons`, managerToken,
    );
  });

  test('05 - FIX-14: Profile update returns new JWT', async ({ page }) => {
    await showApiCall(page,
      'FIX-14: Profile update returns fresh accessToken',
      'PATCH', `${API}/auth/me`, clientToken,
      { firstName: 'VideoDemo' },
      200,
    );
  });

  test('06 - FIX-16: Notifications are paginated', async ({ page }) => {
    await showApiCall(page,
      'FIX-16: Notifications with pagination metadata',
      'GET', `${API}/notifications?page=1&limit=5`, clientToken,
    );
  });

  test('07 - FIX-17: Cannot like disabled product', async ({ page, request }) => {
    const prods = await request.get(`${API}/products?limit=1`);
    const prodId = (await prods.json()).data[0].id;
    await request.patch(`${API}/products/${prodId}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
      data: { status: 'disabled' },
    });

    await showApiCall(page,
      'FIX-17: Cannot like a disabled product',
      'POST', `${API}/products/${prodId}/like`, clientToken,
      undefined, 404,
    );

    await request.patch(`${API}/products/${prodId}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
      data: { status: 'active' },
    });
  });

  test('08 - FIX-21: Address with orders cannot be deleted', async ({ page, request }) => {
    const email = `addr-vid-${Date.now()}@test.com`;
    const reg = await request.post(`${API}/auth/signup`, {
      data: { email, password: 'Addr1234!', firstName: 'A', lastName: 'B' },
    });
    const token = (await reg.json()).accessToken;

    const addr = await request.post(`${API}/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { recipientName: 'A', recipientPhone: '+1', line1: 'St', city: 'Lima', countryCode: 'PE' },
    });
    const addrId = (await addr.json()).id;

    const prods = await request.get(`${API}/products?limit=1`);
    const vid = (await prods.json()).data[0].variants[0].id;
    await request.post(`${API}/cart/items`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productVariantId: vid, quantity: 1 },
    });
    await request.post(`${API}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { addressId: addrId },
    });

    await showApiCall(page,
      'FIX-21: Address with active orders cannot be deleted',
      'DELETE', `${API}/addresses/${addrId}`, token,
      undefined, 400,
    );
  });

  // Stress test (FIX-02) runs separately via: bash test/stress-test.sh
  // Requires stable backend (not in watch mode) for true concurrency.
  // Already verified: 1 succeeded, 9 blocked with curl.
  // See DEMO-EVIDENCE.md for results.
});
