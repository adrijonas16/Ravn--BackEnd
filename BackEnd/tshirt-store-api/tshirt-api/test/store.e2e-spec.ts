/**
 * E2E tests for the T-Shirt Store API.
 *
 * Covers three required flows:
 *   1. Authentication  - register, login, protected routes with/without token
 *   2. Checkout        - add SKU to cart, create order, verify order status
 *   3. Order history   - two users, each sees only their own orders
 *
 * Uses the real PostgreSQL database via a dedicated "tshirt_store_test" schema
 * for isolation.  Tables are truncated between test suites.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { AppModule } from '../src/app.module';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:pass_nerdery@127.0.0.1:5433/tshirt_store?schema=tshirt_store_test';

/** A standalone Prisma client that points at the test schema. */
function createTestPrisma(): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });
}

function prepareTestDatabase(): void {
  execFileSync('npx', ['prisma', 'db', 'push', '--skip-generate'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: 'pipe',
  });
}

/** Truncate every table in the test schema (respects FK order). */
async function truncateAll(prisma: PrismaClient): Promise<void> {
  // Ordered from leaves to roots to avoid FK violations.
  const tables = [
    'notifications',
    'promo_code_redemptions',
    'inventory_movements',
    'stripe_webhook_events',
    'payments',
    'order_status_history',
    'order_items',
    'orders',
    'cart_items',
    'carts',
    'promo_codes',
    'addresses',
    'product_likes',
    'product_variants',
    'product_images',
    'products',
    'colors',
    'sizes',
    'categories',
    'password_reset_tokens',
    'refresh_tokens',
    'users',
    'roles',
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "tshirt_store_test"."${table}" CASCADE`,
    );
  }
}

let counter = 0;

/** Generate a unique email for each test user. */
function uniqueEmail(prefix = 'user'): string {
  counter += 1;
  return `${prefix}_${counter}_${Date.now()}@test.com`;
}

/** Register a new user via the API and return { email, password, token, userId }. */
async function registerUser(
  server: App,
  overrides: { email?: string; password?: string } = {},
): Promise<{
  email: string;
  password: string;
  token: string;
  refreshToken: string;
  userId: number;
}> {
  const email = overrides.email ?? uniqueEmail();
  const password = overrides.password ?? 'Test1234!';

  const res = await request(server)
    .post('/api/v1/auth/signup')
    .send({ email, password, firstName: 'Test', lastName: 'User' })
    .expect(201);

  return {
    email,
    password,
    token: res.body.accessToken as string,
    refreshToken: res.body.refreshToken as string,
    userId: res.body.user.id as number,
  };
}

/**
 * Seed the minimum catalogue data needed for cart / order tests:
 *   - 1 category, 1 product, 1 size, 1 color, 1 SKU (with stock)
 *
 * Returns the created SKU id.
 */
async function seedCatalogue(
  prisma: PrismaClient,
): Promise<{ variantId: number }> {
  const category = await prisma.category.create({
    data: { name: 'T-Shirts', slug: 'tshirts', description: 'All t-shirts' },
  });

  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      name: 'Classic Tee',
      slug: 'classic-tee',
      description: 'A classic cotton t-shirt',
    },
  });

  const size = await prisma.size.create({ data: { name: 'M' } });
  const color = await prisma.color.create({
    data: { name: 'Black', hexCode: '#000000' },
  });

  const sku = await prisma.productVariant.create({
    data: {
      productId: product.id,
      sizeId: size.id,
      colorId: color.id,
      sku: 'CLASSIC-M-BLK',
      price: 29.99,
      stock: 100,
    },
  });

  return { variantId: sku.id };
}

/** Create a shipping address for the given user. Returns the address id. */
async function seedAddress(
  prisma: PrismaClient,
  userId: number,
): Promise<number> {
  const address = await prisma.address.create({
    data: {
      userId,
      recipientName: 'Test User',
      recipientPhone: '+1234567890',
      line1: '123 Main St',
      city: 'Anytown',
      countryCode: 'US',
      isDefault: true,
    },
  });
  return address.id;
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

describe('T-Shirt Store E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let server: App;

  beforeAll(async () => {
    // Override DATABASE_URL so the app talks to the test schema.
    process.env.DATABASE_URL = TEST_DB_URL;
    prepareTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mirror the same global pipes / prefix as main.ts
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    server = app.getHttpServer();

    prisma = createTestPrisma();
    await prisma.$connect();
  });

  afterAll(async () => {
    await truncateAll(prisma);
    await prisma.$disconnect();
    await app.close();
  });

  // =========================================================================
  // 1. AUTHENTICATION
  // =========================================================================
  describe('Authentication flow', () => {
    beforeAll(async () => {
      await truncateAll(prisma);
    });

    it('should register a new user (POST /auth/signup)', async () => {
      const email = uniqueEmail('auth');
      const res = await request(server)
        .post('/api/v1/auth/signup')
        .send({
          email,
          password: 'Secret123!',
          firstName: 'Jane',
          lastName: 'Doe',
        })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toMatchObject({
        email,
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'client',
      });
    });

    it('should reject duplicate registration', async () => {
      const email = uniqueEmail('dup');
      // First registration
      await request(server)
        .post('/api/v1/auth/signup')
        .send({
          email,
          password: 'Secret123!',
          firstName: 'A',
          lastName: 'B',
        })
        .expect(201);

      // Duplicate
      await request(server)
        .post('/api/v1/auth/signup')
        .send({
          email,
          password: 'Secret123!',
          firstName: 'A',
          lastName: 'B',
        })
        .expect(409);
    });

    it('should log in with valid credentials (POST /auth/signin)', async () => {
      const email = uniqueEmail('login');
      const password = 'MyPass999!';

      // Register first
      await request(server)
        .post('/api/v1/auth/signup')
        .send({ email, password, firstName: 'X', lastName: 'Y' })
        .expect(201);

      const res = await request(server)
        .post('/api/v1/auth/signin')
        .send({ email, password })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe(email);
    });

    it('should refresh and rotate a valid refresh token', async () => {
      const { refreshToken } = await registerUser(server);

      const refreshRes = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshRes.body).toHaveProperty('accessToken');
      expect(refreshRes.body).toHaveProperty('refreshToken');
      expect(refreshRes.body.refreshToken).not.toBe(refreshToken);

      await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('should revoke a refresh token on signout', async () => {
      const { refreshToken } = await registerUser(server);

      await request(server)
        .post('/api/v1/auth/signout')
        .send({ refreshToken })
        .expect(200);

      await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('should reject login with wrong password', async () => {
      const email = uniqueEmail('badpw');
      await request(server)
        .post('/api/v1/auth/signup')
        .send({ email, password: 'Correct1!', firstName: 'A', lastName: 'B' })
        .expect(201);

      await request(server)
        .post('/api/v1/auth/signin')
        .send({ email, password: 'WrongPass!' })
        .expect(401);
    });

    it('should access a protected route with a valid token', async () => {
      const { token } = await registerUser(server);

      const res = await request(server)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // The cart endpoint always returns a cart object
      expect(res.body).toHaveProperty('id');
    });

    it('should reject a protected route without a token', async () => {
      await request(server).get('/api/v1/cart').expect(401);
    });

    it('should reject a protected route with an invalid token', async () => {
      await request(server)
        .get('/api/v1/cart')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);
    });
  });

  // =========================================================================
  // 2. CHECKOUT FLOW
  // =========================================================================
  describe('Checkout flow', () => {
    let token: string;
    let userId: number;
    let variantId: number;
    let addressId: number;

    beforeAll(async () => {
      await truncateAll(prisma);
      const catalogue = await seedCatalogue(prisma);
      variantId = catalogue.variantId;

      const user = await registerUser(server);
      token = user.token;
      userId = user.userId;

      addressId = await seedAddress(prisma, userId);
    });

    it('should add a SKU to the cart (POST /cart/items)', async () => {
      const res = await request(server)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productVariantId: variantId, quantity: 2 })
        .expect(201);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].productVariantId).toBe(variantId);
      expect(res.body.items[0].quantity).toBe(2);
    });

    it('should create an order from the cart (POST /orders)', async () => {
      const res = await request(server)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ addressId })
        .expect(201);

      expect(res.body).toHaveProperty('orderNumber');
      expect(res.body.currentStatus).toBe('pending');
      expect(res.body.items).toHaveLength(1);
      expect(res.body.userId).toBe(userId);
    });

    it('should show the order with pending status (GET /orders)', async () => {
      const res = await request(server)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].currentStatus).toBe('pending');
    });

    it('should reject creating another order when cart is empty', async () => {
      // Cart was converted, so a new empty cart exists
      await request(server)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ addressId })
        .expect(400);
    });
  });

  // =========================================================================
  // 3. ORDER HISTORY ISOLATION
  // =========================================================================
  describe('Order history isolation', () => {
    let tokenA: string;
    let tokenB: string;
    let userIdA: number;
    let userIdB: number;
    let variantId: number;
    let addressIdA: number;
    let addressIdB: number;

    beforeAll(async () => {
      await truncateAll(prisma);
      const catalogue = await seedCatalogue(prisma);
      variantId = catalogue.variantId;

      const userA = await registerUser(server, { email: uniqueEmail('alice') });
      tokenA = userA.token;
      userIdA = userA.userId;

      const userB = await registerUser(server, { email: uniqueEmail('bob') });
      tokenB = userB.token;
      userIdB = userB.userId;

      addressIdA = await seedAddress(prisma, userIdA);
      addressIdB = await seedAddress(prisma, userIdB);

      // ---- User A: add to cart and create an order ----
      await request(server)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ productVariantId: variantId, quantity: 1 })
        .expect(201);

      await request(server)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ addressId: addressIdA })
        .expect(201);

      // ---- User B: add to cart and create an order ----
      await request(server)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ productVariantId: variantId, quantity: 3 })
        .expect(201);

      await request(server)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ addressId: addressIdB })
        .expect(201);
    });

    it('User A should see only their own order', async () => {
      const res = await request(server)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      // The order listing does not include userId directly, so we verify
      // by checking the total: 1 * 29.99 = 29.99
      expect(Number(res.body.data[0].totalAmount)).toBeCloseTo(29.99, 1);
    });

    it('User B should see only their own order', async () => {
      const res = await request(server)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      // 3 * 29.99 = 89.97
      expect(Number(res.body.data[0].totalAmount)).toBeCloseTo(89.97, 1);
    });

    it('User A cannot view User B order details', async () => {
      // Get user B's order id
      const resB = await request(server)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      const orderIdB = resB.body.data[0].id as number;

      // User A tries to access it
      await request(server)
        .get(`/api/v1/orders/${orderIdB}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);
    });
  });
});
