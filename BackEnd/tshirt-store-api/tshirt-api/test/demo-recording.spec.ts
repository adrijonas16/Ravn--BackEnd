import { test, expect } from '@playwright/test';

const API = 'http://127.0.0.1:3000/api/v1';
const SWAGGER = 'http://127.0.0.1:3000/api/docs';
const FRONTEND = 'http://localhost:5177';

let clientToken: string;
let managerToken: string;

test.describe('API Audit Demo — Video Evidence', () => {

  test.beforeAll(async ({ request }) => {
    // Sign in as client
    const clientRes = await request.post(`${API}/auth/signin`, {
      data: { email: 'demo@tshirtstore.com', password: 'Demo1234!' },
    });
    clientToken = (await clientRes.json()).accessToken;

    // Sign in as manager
    const managerRes = await request.post(`${API}/auth/signin`, {
      data: { email: 'admin@tshirtstore.com', password: 'Admin123!' },
    });
    managerToken = (await managerRes.json()).accessToken;
  });

  test('01 - Swagger UI overview', async ({ page }) => {
    await page.goto(SWAGGER);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Expand Orders section
    const ordersSection = page.locator('#operations-tag-Orders');
    if (await ordersSection.isVisible()) {
      await ordersSection.click();
      await page.waitForTimeout(1000);
    }

    // Scroll through endpoints
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(1500);
  });

  test('02 - Frontend: browse products', async ({ page }) => {
    await page.goto(FRONTEND);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to navigate — look for products or login
    const links = page.locator('a, button');
    const count = await links.count();
    if (count > 0) {
      // Click first visible link/button
      for (let i = 0; i < Math.min(count, 5); i++) {
        const link = links.nth(i);
        if (await link.isVisible()) {
          const text = await link.textContent();
          if (text && (text.includes('Product') || text.includes('Shop') || text.includes('Login') || text.includes('Sign'))) {
            await link.click();
            await page.waitForTimeout(2000);
            break;
          }
        }
      }
    }
    await page.waitForTimeout(2000);
  });

  test('03 - API: Cart adds item and shows stock warning', async ({ request }) => {
    // Get a variant
    const productsRes = await request.get(`${API}/products?limit=1`);
    const products = await productsRes.json();
    const variantId = products.data[0].variants[0]?.id;
    if (!variantId) return;

    // Add to cart
    const cartRes = await request.post(`${API}/cart/items`, {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: { productVariantId: variantId, quantity: 2 },
    });
    const cart = await cartRes.json();
    expect(cart.items.length).toBeGreaterThan(0);
    expect(cart.items[0]).toHaveProperty('stockWarning');

    // Try quantity > 99
    const rejectRes = await request.post(`${API}/cart/items`, {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: { productVariantId: variantId, quantity: 100 },
    });
    expect(rejectRes.status()).toBe(400);
    const rejectBody = await rejectRes.json();
    expect(rejectBody.message).toContain('Maximum 99');
  });

  test('04 - API: Delivery workload endpoint', async ({ request }) => {
    const res = await request.get(`${API}/orders/delivery-persons`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('activeOrders');
      expect(data[0]).toHaveProperty('available');
      expect(data[0]).toHaveProperty('maxActiveDeliveries');
    }
  });

  test('05 - API: Categories CRUD (manager only)', async ({ request }) => {
    // Create
    const createRes = await request.post(`${API}/categories`, {
      headers: { Authorization: `Bearer ${managerToken}` },
      data: { name: 'Playwright Test Category', description: 'Auto-created' },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.slug).toBe('playwright-test-category');

    // Update
    const updateRes = await request.patch(`${API}/categories/${created.id}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
      data: { description: 'Updated by Playwright' },
    });
    expect(updateRes.status()).toBe(200);

    // Delete (no products, should work)
    const deleteRes = await request.delete(`${API}/categories/${created.id}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    expect(deleteRes.status()).toBe(204);

    // Client cannot create
    const clientRes = await request.post(`${API}/categories`, {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: { name: 'Hacker' },
    });
    expect(clientRes.status()).toBe(403);
  });

  test('06 - API: Profile update returns new token (FIX-14)', async ({ request }) => {
    const res = await request.patch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: { firstName: 'PlaywrightUser' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.user.firstName).toBe('PlaywrightUser');
  });

  test('07 - API: Notifications are paginated (FIX-16)', async ({ request }) => {
    const res = await request.get(`${API}/notifications?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('meta');
    expect(body.meta).toHaveProperty('page', 1);
    expect(body.meta).toHaveProperty('limit', 5);
    expect(body.meta).toHaveProperty('totalItems');
  });

  test('08 - API: Cannot like disabled product (FIX-17)', async ({ request }) => {
    // Get a product and disable it
    const productsRes = await request.get(`${API}/products?limit=1`);
    const prodId = (await productsRes.json()).data[0].id;

    await request.patch(`${API}/products/${prodId}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
      data: { status: 'disabled' },
    });

    // Try to like — should fail
    const likeRes = await request.post(`${API}/products/${prodId}/like`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    expect(likeRes.status()).toBe(404);

    // Re-enable
    await request.patch(`${API}/products/${prodId}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
      data: { status: 'active' },
    });
  });

  test('09 - STRESS: 10 concurrent orders, only 1 succeeds (FOR UPDATE)', async ({ request }) => {
    // Create fresh user
    const email = `stress-pw-${Date.now()}@test.com`;
    const regRes = await request.post(`${API}/auth/signup`, {
      data: { email, password: 'Stress123!', firstName: 'PW', lastName: 'Stress' },
    });
    const token = (await regRes.json()).accessToken;

    // Create address
    const addrRes = await request.post(`${API}/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { recipientName: 'PW', recipientPhone: '+1', line1: 'St', city: 'Lima', countryCode: 'PE' },
    });
    const addrId = (await addrRes.json()).id;

    // Add cart item
    const productsRes = await request.get(`${API}/products?limit=1`);
    const variantId = (await productsRes.json()).data[0].variants[0].id;
    await request.post(`${API}/cart/items`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productVariantId: variantId, quantity: 1 },
    });

    // Fire 10 concurrent requests
    const promises = Array.from({ length: 10 }, () =>
      request.post(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { addressId: addrId },
      }),
    );

    const results = await Promise.all(promises);
    const successes = results.filter(r => r.status() === 201 || r.status() === 200);
    const failures = results.filter(r => r.status() === 400);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(9);
  });
});
