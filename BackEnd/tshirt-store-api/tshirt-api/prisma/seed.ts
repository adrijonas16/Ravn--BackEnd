import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Roles ───
  const manager = await prisma.role.upsert({ where: { name: 'manager' }, update: {}, create: { name: 'manager' } });
  const client = await prisma.role.upsert({ where: { name: 'client' }, update: {}, create: { name: 'client' } });
  const delivery = await prisma.role.upsert({ where: { name: 'delivery_person' }, update: {}, create: { name: 'delivery_person' } });

  // ─── Users ───
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@tshirtstore.com' },
    update: { passwordHash: adminPasswordHash, firstName: 'Admin', lastName: 'Manager', roleId: manager.id, status: 'active' },
    create: { email: 'admin@tshirtstore.com', passwordHash: adminPasswordHash, firstName: 'Admin', lastName: 'Manager', roleId: manager.id },
  });
  const clientPasswordHash = await bcrypt.hash('Demo1234!', 10);
  const clientUser = await prisma.user.upsert({
    where: { email: 'demo@tshirtstore.com' },
    update: { passwordHash: clientPasswordHash, firstName: 'Demo', lastName: 'User', roleId: client.id, status: 'active' },
    create: { email: 'demo@tshirtstore.com', passwordHash: clientPasswordHash, firstName: 'Demo', lastName: 'User', roleId: client.id },
  });
  await prisma.user.upsert({
    where: { email: 'delivery@tshirtstore.com' },
    update: { passwordHash: await bcrypt.hash('Delivery123!', 10), firstName: 'Delivery', lastName: 'Person', roleId: delivery.id, status: 'active' },
    create: { email: 'delivery@tshirtstore.com', passwordHash: await bcrypt.hash('Delivery123!', 10), firstName: 'Delivery', lastName: 'Person', roleId: delivery.id },
  });

  // ─── Categories ───
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'graphic-tees' }, update: {}, create: { name: 'Graphic Tees', slug: 'graphic-tees', description: 'Camisetas con diseños gráficos únicos' } }),
    prisma.category.upsert({ where: { slug: 'basic' }, update: {}, create: { name: 'Basic', slug: 'basic', description: 'Camisetas básicas de algodón' } }),
    prisma.category.upsert({ where: { slug: 'premium' }, update: {}, create: { name: 'Premium', slug: 'premium', description: 'Camisetas de alta calidad y materiales premium' } }),
    prisma.category.upsert({ where: { slug: 'vintage' }, update: {}, create: { name: 'Vintage', slug: 'vintage', description: 'Diseños retro y vintage' } }),
    prisma.category.upsert({ where: { slug: 'sport' }, update: {}, create: { name: 'Sport', slug: 'sport', description: 'Camisetas deportivas y de rendimiento' } }),
  ]);

  // ─── Sizes ───
  const sizes = await Promise.all([
    prisma.size.upsert({ where: { name: 'XS' }, update: {}, create: { name: 'XS', sortOrder: 0 } }),
    prisma.size.upsert({ where: { name: 'S' }, update: {}, create: { name: 'S', sortOrder: 1 } }),
    prisma.size.upsert({ where: { name: 'M' }, update: {}, create: { name: 'M', sortOrder: 2 } }),
    prisma.size.upsert({ where: { name: 'L' }, update: {}, create: { name: 'L', sortOrder: 3 } }),
    prisma.size.upsert({ where: { name: 'XL' }, update: {}, create: { name: 'XL', sortOrder: 4 } }),
    prisma.size.upsert({ where: { name: '2XL' }, update: {}, create: { name: '2XL', sortOrder: 5 } }),
  ]);

  // ─── Colors ───
  const colors = await Promise.all([
    prisma.color.upsert({ where: { name: 'Black' }, update: {}, create: { name: 'Black', hexCode: '#1a1a1a' } }),
    prisma.color.upsert({ where: { name: 'White' }, update: {}, create: { name: 'White', hexCode: '#f5f5f5' } }),
    prisma.color.upsert({ where: { name: 'Navy' }, update: {}, create: { name: 'Navy', hexCode: '#0f3460' } }),
    prisma.color.upsert({ where: { name: 'Red' }, update: {}, create: { name: 'Red', hexCode: '#e94560' } }),
    prisma.color.upsert({ where: { name: 'Forest' }, update: {}, create: { name: 'Forest', hexCode: '#2d6a4f' } }),
    prisma.color.upsert({ where: { name: 'Sky' }, update: {}, create: { name: 'Sky', hexCode: '#48bfe3' } }),
    prisma.color.upsert({ where: { name: 'Sand' }, update: {}, create: { name: 'Sand', hexCode: '#d4a373' } }),
    prisma.color.upsert({ where: { name: 'Purple' }, update: {}, create: { name: 'Purple', hexCode: '#7b2cbf' } }),
  ]);

  // ─── Products with SKUs ───
  const products = [
    { name: 'Mountain Sunset Tee', slug: 'mountain-sunset-tee', desc: 'Diseño de atardecer en las montañas con degradado de colores cálidos. Algodón 100% orgánico.', cat: 0, price: 29.99, emoji: '🏔️' },
    { name: 'Ocean Wave Tee', slug: 'ocean-wave-tee', desc: 'Ola japonesa estilo ukiyo-e. Impresión de alta calidad que no se desgasta con los lavados.', cat: 0, price: 34.99, emoji: '🌊' },
    { name: 'Cosmic Explorer', slug: 'cosmic-explorer', desc: 'Astronauta flotando en el espacio con planetas de fondo. Tinta que brilla en la oscuridad.', cat: 0, price: 39.99, emoji: '🚀' },
    { name: 'Classic Cotton Tee', slug: 'classic-cotton-tee', desc: 'La camiseta básica perfecta. Algodón peinado 180gsm, corte regular. Tu nuevo básico favorito.', cat: 1, price: 19.99, emoji: '👕' },
    { name: 'Essential V-Neck', slug: 'essential-v-neck', desc: 'Cuello en V elegante y cómodo. Ideal para combinar con cualquier outfit.', cat: 1, price: 22.99, emoji: '✨' },
    { name: 'Everyday Crew', slug: 'everyday-crew', desc: 'Cuello redondo clásico, tela suave al tacto. Perfecto para el día a día.', cat: 1, price: 18.99, emoji: '☀️' },
    { name: 'Silk Blend Premium', slug: 'silk-blend-premium', desc: 'Mezcla de algodón y seda que se siente increíble. Acabado premium con detalles bordados.', cat: 2, price: 59.99, emoji: '💎' },
    { name: 'Merino Wool Tee', slug: 'merino-wool-tee', desc: 'Lana merino australiana. Regula la temperatura, anti-olor, perfecta para viajes.', cat: 2, price: 69.99, emoji: '🐑' },
    { name: 'Japanese Cotton', slug: 'japanese-cotton-tee', desc: 'Algodón japonés de fibra larga. Textura única que mejora con cada lavado.', cat: 2, price: 54.99, emoji: '🇯🇵' },
    { name: 'Retro 80s Neon', slug: 'retro-80s-neon', desc: 'Paleta de colores neón inspirada en los 80s. Miami Vice vibes.', cat: 3, price: 32.99, emoji: '🕹️' },
    { name: 'Vinyl Record Tee', slug: 'vinyl-record-tee', desc: 'Para los amantes de la música. Diseño de disco de vinilo con tocadiscos.', cat: 3, price: 28.99, emoji: '🎵' },
    { name: 'Classic Car Tee', slug: 'classic-car-tee', desc: 'Muscle car americano de los 60s. Estilo vintage con efecto desgastado.', cat: 3, price: 31.99, emoji: '🚗' },
    { name: 'DryFit Performance', slug: 'dryfit-performance', desc: 'Tejido técnico que absorbe el sudor. Ideal para entrenar o correr.', cat: 4, price: 34.99, emoji: '🏃' },
    { name: 'Compression Sport', slug: 'compression-sport', desc: 'Compresión ligera que mejora el rendimiento. Costuras planas anti-roce.', cat: 4, price: 44.99, emoji: '💪' },
    { name: 'Trail Runner Tee', slug: 'trail-runner-tee', desc: 'Ultraligera y transpirable. Diseñada para trail running y actividades outdoor.', cat: 4, price: 42.99, emoji: '🏔️' },
  ];

  const productPhotoPairs = [
    {
      front: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85',
      back: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85',
    },
    {
      front: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85',
      back: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85',
    },
    {
      front: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=85',
      back: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=85',
    },
    {
      front: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=900&q=85',
      back: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=900&q=85',
    },
    {
      front: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=900&q=85',
      back: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=85',
    },
    {
      front: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=900&q=85',
      back: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85',
    },
    {
      front: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=85',
      back: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85',
    },
    {
      front: 'https://images.unsplash.com/photo-1520367445093-50dc08a59d9d?auto=format&fit=crop&w=900&q=85',
      back: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85',
    },
    {
      front: 'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?auto=format&fit=crop&w=900&q=85',
      back: 'https://images.unsplash.com/photo-1520975867597-0af37a22e31e?auto=format&fit=crop&w=900&q=85',
    },
    {
      front: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=900&q=85',
      back: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=900&q=85',
    },
    {
      front: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=900&q=85',
      back: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=85',
    },
    {
      front: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=900&q=85',
      back: 'https://images.unsplash.com/photo-1542060748-10c28b62716f?auto=format&fit=crop&w=900&q=85',
    },
    {
      front: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=85',
      back: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?auto=format&fit=crop&w=900&q=85',
    },
    {
      front: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=85',
      back: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=85',
    },
    {
      front: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85',
      back: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=85',
    },
  ];

  for (const [index, p] of products.entries()) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.desc,
        categoryId: categories[p.cat].id,
        status: 'active',
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.desc,
        categoryId: categories[p.cat].id,
      },
    });

    const imageBase = p.slug.replaceAll('-', '_');
    const photos = productPhotoPairs[index % productPhotoPairs.length];
    const productImages = [
      {
        storageKey: `seed/${imageBase}/front`,
        publicUrl: `${photos.front}&sig=${product.id}-front`,
        altText: `${p.name} front`,
        sortOrder: 0,
        isPrimary: true,
      },
      {
        storageKey: `seed/${imageBase}/back`,
        publicUrl: `${photos.back}&sig=${product.id}-back`,
        altText: `${p.name} alternate`,
        sortOrder: 1,
        isPrimary: false,
      },
    ];

    for (const image of productImages) {
      await prisma.productImage.upsert({
        where: { storageKey: image.storageKey },
        update: {
          productId: product.id,
          publicUrl: image.publicUrl,
          altText: image.altText,
          sortOrder: image.sortOrder,
          isPrimary: image.isPrimary,
        },
        create: {
          productId: product.id,
          ...image,
        },
      });
    }

    const existingVariantCount = await prisma.productVariant.count({
      where: { productId: product.id },
    });
    if (existingVariantCount > 0) continue;

    // Crear SKUs: 4 tallas x 3 colores = 12 variantes por producto
    const productColors = [colors[0], colors[1], colors[2], colors[3]].slice(0, 3 + Math.floor(Math.random() * 2));
    const productSizes = [sizes[1], sizes[2], sizes[3], sizes[4]]; // S, M, L, XL

    for (const size of productSizes) {
      for (const color of productColors) {
        const skuCode = `${p.slug.toUpperCase()}-${color.name.toUpperCase()}-${size.name}`;
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sizeId: size.id,
            colorId: color.id,
            sku: skuCode,
            price: p.price + (size.sortOrder > 3 ? 5 : 0),
            stock: 10 + Math.floor(Math.random() * 40),
          },
        });
      }
    }
  }

  // ─── Address for demo user ───
  await prisma.address.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: clientUser.id,
      label: 'Casa',
      recipientName: 'Demo User',
      recipientPhone: '+1234567890',
      line1: '123 Main St',
      city: 'San Francisco',
      stateRegion: 'CA',
      postalCode: '94102',
      countryCode: 'US',
      isDefault: true,
    },
  });

  console.log('Seed complete! 15 products with SKUs created.');
  console.log('Manager login: admin@tshirtstore.com / Admin123!');
  console.log('Client login:  demo@tshirtstore.com / Demo1234!');
  console.log('Delivery login: delivery@tshirtstore.com / Delivery123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
