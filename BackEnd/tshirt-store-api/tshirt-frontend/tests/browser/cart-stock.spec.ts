import { expect, test } from '@playwright/test';

const apiBase = 'http://localhost:3000/api/v1';

const clientUser = {
  id: 1,
  email: 'client@example.com',
  firstName: 'Client',
  lastName: 'User',
  role: 'client',
};

async function mockAuth(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.route(`${apiBase}/auth/me`, async (route) => {
    await route.fulfill({ json: { user: clientUser } });
  });

  await page.addInitScript(({ user }) => {
    localStorage.setItem('tshirt-auth:v1:token', 'browser-test-token');
    localStorage.setItem('tshirt-auth:v1:user', JSON.stringify(user));
  }, { user: clientUser });
}

test('product detail caps quantity and updates the limit when selected SKU changes', async ({ page }) => {
  await mockAuth(page);

  await page.route(`${apiBase}/products/1`, async (route) => {
    await route.fulfill({
      json: {
        id: 1,
        name: 'Neighborhood Tee',
        slug: 'neighborhood-tee',
        description: 'A local favorite.',
        status: 'active',
        category: { id: 1, name: 'Basic', slug: 'basic' },
        primaryImage: null,
        images: [],
        likesCount: 0,
        isLiked: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        variants: [
          {
            id: 11,
            sku: 'TEE-S-BLK',
            price: 20,
            stock: 3,
            isActive: true,
            size: { id: 1, name: 'S', sortOrder: 1 },
            color: { id: 1, name: 'Black', hexCode: '#000000' },
          },
          {
            id: 12,
            sku: 'TEE-M-BLK',
            price: 20,
            stock: 1,
            isActive: true,
            size: { id: 2, name: 'M', sortOrder: 2 },
            color: { id: 1, name: 'Black', hexCode: '#000000' },
          },
        ],
        _count: { likes: 0 },
      },
    });
  });

  await page.route(`${apiBase}/likes/products**`, async (route) => {
    await route.fulfill({ json: { data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 0 } } });
  });

  await page.goto('/products/1');

  const increaseButton = page.getByRole('button', { name: 'Increase quantity' });
  await expect(page.getByText('3 in stock')).toBeVisible();

  await increaseButton.click();
  await increaseButton.click();
  await expect(increaseButton).toBeDisabled();
  await expect(page.locator('text=3').first()).toBeVisible();

  await page.getByRole('button', { name: 'Select size M' }).click();
  await expect(page.getByText('1 in stock')).toBeVisible();
  await expect(increaseButton).toBeDisabled();
  await expect(page.locator('text=1').first()).toBeVisible();
});

test('cart disables increment control when item quantity reaches stock', async ({ page }) => {
  await mockAuth(page);

  await page.route(`${apiBase}/cart`, async (route) => {
    await route.fulfill({
      json: {
        id: 1,
        totalAmount: 40,
        items: [
          {
            id: 7,
            productVariantId: 11,
            productName: 'Neighborhood Tee',
            skuCode: 'TEE-S-BLK',
            sizeName: 'S',
            colorName: 'Black',
            imageUrl: null,
            unitPrice: 20,
            stock: 2,
            quantity: 2,
            lineTotal: 40,
          },
        ],
      },
    });
  });

  await page.goto('/cart');

  const increaseButton = page.getByRole('button', {
    name: 'Increase quantity for Neighborhood Tee',
  });

  await expect(page.getByRole('heading', { name: 'Your bag' })).toBeVisible();
  await expect(page.getByText('TEE-S-BLK')).toBeVisible();
  await expect(increaseButton).toBeDisabled();
  await expect(increaseButton).toHaveAttribute('title', 'Only 2 in stock');
});
