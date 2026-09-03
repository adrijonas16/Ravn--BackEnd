import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, ChevronDown, ChevronRight, ChevronUp, Heart, Minus, Package, Plus, Shirt, ShoppingBag } from 'lucide-react';
import { cartApi } from '../api/cart';
import { productsApi } from '../api/products';
import { useAuth } from '../context/useAuth';
import { ProductDetail, ProductVariant } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  graphic: '#2457ff',
  basic: '#111111',
  premium: '#c5a253',
  vintage: '#e94f37',
  sport: '#00a676',
};

function getAccent(categoryName?: string): string {
  if (!categoryName) return '#2457ff';
  const key = categoryName.toLowerCase();
  for (const [name, color] of Object.entries(CATEGORY_COLORS)) {
    if (key.includes(name)) return color;
  }
  return '#2457ff';
}

function uniqueActiveSizes(variants: ProductVariant[] = []) {
  const result = new Map<number, ProductVariant['size']>();
  for (const variant of variants) {
    if (variant.isActive) result.set(variant.size.id, variant.size);
  }
  return [...result.values()];
}

function uniqueActiveColors(variants: ProductVariant[] = []) {
  const result = new Map<number, ProductVariant['color']>();
  for (const variant of variants) {
    if (variant.isActive) result.set(variant.color.id, variant.color);
  }
  return [...result.values()];
}

function InfoSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen((current) => !current)}
        style={{
          width: '100%',
          padding: '1rem 0',
          border: 'none',
          background: 'transparent',
          color: 'var(--text)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: '0.82rem',
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {title}
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.65, paddingBottom: '1.1rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ProductGallery({
  product,
  accent,
}: {
  product: ProductDetail;
  accent: string;
}) {
  const heroImages = product.images.length > 0
    ? product.images.slice(0, 4).map((image) => ({ key: `image-${image.id}`, image }))
    : [0, 1, 2, 3].map((slot) => ({ key: `placeholder-${slot}`, image: null }));

  return (
    <section className="ln-gallery" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: '0.85rem',
    }}>
      {heroImages.map(({ key, image }, index) => (
        <div key={key} style={{
          minHeight: index === 0 ? 560 : 370,
          gridColumn: index === 0 ? 'span 2' : 'span 1',
          background: index === 0 ? 'var(--surface)' : 'var(--surface-muted)',
          border: '1px solid var(--border)',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {image ? (
            <img src={image.publicUrl} alt={image.altText ?? product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <div style={{
                position: 'absolute',
                inset: '10%',
                border: `2px solid ${accent}`,
                opacity: 0.12,
              }} />
              <Shirt size={index === 0 ? 170 : 110} strokeWidth={1.1} color={accent} />
            </>
          )}
          {index === 0 && (
            <span style={{
              position: 'absolute',
              top: 16,
              left: 16,
              padding: '0.35rem 0.55rem',
              background: accent,
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 900,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              In stock now
            </span>
          )}
        </div>
      ))}
    </section>
  );
}

function ProductPurchasePanel({
  accent,
  adding,
  colors,
  message,
  product,
  quantity,
  selectedPrice,
  selectedSku,
  sizes,
  onAddToCart,
  onToggleLike,
  onQuantityChange,
  onSkuChange,
  canBuy,
}: {
  accent: string;
  adding: boolean;
  colors: NonNullable<ProductVariant['color']>[];
  message: string;
  product: ProductDetail;
  quantity: number;
  selectedPrice: number;
  selectedSku: ProductVariant | null;
  sizes: NonNullable<ProductVariant['size']>[];
  onAddToCart: () => void;
  onToggleLike: () => void;
  onQuantityChange: (quantity: number) => void;
  onSkuChange: (variant: ProductVariant) => void;
  canBuy: boolean;
}) {
  return (
    <aside style={{
      position: 'sticky',
      top: '5.5rem',
      background: 'var(--surface-muted)',
      paddingBottom: '1rem',
    }}>
      <p style={{
        color: accent,
        fontWeight: 900,
        fontSize: '0.78rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '0.5rem',
      }}>
        {product.category?.name ?? 'ThreadVault'}
      </p>

      <h1 style={{
        margin: '0 0 0.85rem',
        color: 'var(--text)',
        fontSize: 'clamp(2rem, 4vw, 3.35rem)',
        lineHeight: 0.95,
        fontWeight: 950,
        letterSpacing: 0,
        textTransform: 'uppercase',
      }}>
        {product.name}
      </h1>

      <p style={{ margin: '0 0 1rem', color: 'var(--text)', fontSize: '1.05rem', fontWeight: 800 }}>
        ${selectedPrice.toFixed(2)} USD
      </p>

      <p style={{ color: 'var(--text-soft)', lineHeight: 1.65, fontSize: '0.98rem', marginBottom: '1.4rem' }}>
        {product.description}
      </p>

      <div style={{ marginBottom: '1.15rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <div style={{ color: 'var(--text)', fontSize: '0.82rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Select size
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700 }}>Size guide</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.55rem' }}>
          {sizes.map((size) => {
            const variant = product.variants.find((item) => item.size.id === size.id && item.color.id === (selectedSku?.color.id ?? colors[0]?.id) && item.isActive);
            const isSelected = selectedSku?.size.id === size.id;
            const disabled = !variant || variant.stock <= 0;
            return (
              <button
                type="button"
                key={size.id}
                disabled={disabled}
                onClick={() => variant && onSkuChange(variant)}
                aria-label={`Select size ${size.name}`}
                style={{
                  minHeight: 48,
                  border: isSelected ? `2px solid ${accent}` : '1px solid var(--border-strong)',
                  background: isSelected ? 'var(--text)' : 'var(--surface)',
                  color: isSelected ? 'var(--surface)' : 'var(--text)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  opacity: disabled ? 0.35 : 1,
                }}
              >
                {size.name}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'block', color: 'var(--text)', fontSize: '0.82rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
          Color
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
          {colors.map((color) => {
            const variant = product.variants.find((item) => item.color.id === color.id && item.size.id === (selectedSku?.size.id ?? sizes[0]?.id) && item.isActive);
            const isSelected = selectedSku?.color.id === color.id;
            return (
              <button
                type="button"
                key={color.id}
                onClick={() => variant && onSkuChange(variant)}
                aria-label={`Select color ${color.name}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  minHeight: 42,
                  padding: '0 0.75rem',
                  border: isSelected ? `2px solid ${accent}` : '1px solid var(--border-strong)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  cursor: variant ? 'pointer' : 'not-allowed',
                  fontWeight: 800,
                  opacity: variant ? 1 : 0.35,
                }}
              >
                <span style={{
                  width: 17,
                  height: 17,
                  borderRadius: '50%',
                  background: color.hexCode ?? '#ddd',
                  border: '1px solid var(--border)',
                }} />
                {color.name}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 36px', border: '1px solid var(--border-strong)', background: 'var(--surface)' }}>
          <button type="button" onClick={() => onQuantityChange(Math.max(1, quantity - 1))} aria-label="Decrease quantity" style={{ border: 'none', background: 'transparent', color: 'var(--text)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <Minus size={15} />
          </button>
          <span style={{ display: 'grid', placeItems: 'center', color: 'var(--text)', fontWeight: 900 }}>{quantity}</span>
          <button type="button" onClick={() => onQuantityChange(quantity + 1)} aria-label="Increase quantity" style={{ border: 'none', background: 'transparent', color: 'var(--text)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <Plus size={15} />
          </button>
        </div>

        <button
          type="button"
          onClick={onAddToCart}
          disabled={!canBuy || adding || !selectedSku || selectedSku.stock === 0}
          style={{
            minHeight: 54,
            border: 'none',
            background: message === 'success' ? '#00a676' : 'var(--text)',
            color: 'var(--surface)',
            cursor: !canBuy || adding || !selectedSku || selectedSku.stock === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: 950,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {!canBuy ? 'Client account required' : adding ? 'Adding...' : message === 'success' ? <><Check size={18} /> Added</> : <><ShoppingBag size={18} /> Add to bag</>}
        </button>
      </div>

      {selectedSku && (
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '1rem' }}>
          <span>{selectedSku.stock > 0 ? `${selectedSku.stock} in stock` : 'Out of stock'}</span>
          <span>SKU: {selectedSku.sku}</span>
        </div>
      )}

      {message && message !== 'success' && (
        <p style={{ color: '#b42318', background: '#fff1f0', border: '1px solid #ffd3d0', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.88rem' }}>
          {message}
        </p>
      )}

      {product.likesCount !== undefined && product.likesCount > 0 && (
        <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          <Heart size={15} fill={accent} color={accent} />
          {product.likesCount} people like this product
        </p>
      )}

      <button
        type="button"
        onClick={onToggleLike}
        style={{
          width: '100%',
          minHeight: 46,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          border: `1px solid ${accent}`,
          background: product.isLiked ? `${accent}22` : 'var(--surface)',
          color: product.isLiked ? accent : 'var(--text)',
          cursor: 'pointer',
          fontWeight: 950,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}
      >
        <Heart size={17} fill={product.isLiked ? accent : 'transparent'} />
        {product.isLiked ? 'Saved' : 'Save product'}
      </button>

      <InfoSection title="Product details" defaultOpen>
        <ul style={{ paddingLeft: '1.1rem' }}>
          <li>Regular fit</li>
          <li>Soft cotton tee construction</li>
          <li>Screen-print inspired product artwork</li>
          <li>Prepared through the ThreadVault catalog API</li>
        </ul>
      </InfoSection>

      <InfoSection title="Size guide">
        <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${Math.max(sizes.length, 1)}, 1fr)`, borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
          <strong style={{ padding: '0.55rem', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>Size</strong>
          {sizes.map((size) => <strong key={size.id} style={{ padding: '0.55rem', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>{size.name}</strong>)}
          <span style={{ padding: '0.55rem', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>Stock</span>
          {sizes.map((size) => {
            const total = product.variants.filter((variant) => variant.size.id === size.id).reduce((sum, variant) => sum + variant.stock, 0);
            return <span key={size.id} style={{ padding: '0.55rem', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>{total}</span>;
          })}
        </div>
      </InfoSection>

      <InfoSection title="Care guide">
        Wash with similar colours. Wash inside out. Machine wash cold. Do not tumble dry.
      </InfoSection>

      <InfoSection title="Shipping">
        Orders move from paid to processing, then shipped and delivered. Taxes and shipping are calculated during checkout.
      </InfoSection>
    </aside>
  );
}

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedSku, setSelectedSku] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    productsApi
      .get(Number(productId))
      .then(async (response) => {
        let nextProduct = response.data;
        if (isAuthenticated) {
          try {
            const likedResponse = await productsApi.listLiked({ page: 1, limit: 100 });
            const likedIds = new Set(likedResponse.data.data.map((item) => item.id));
            nextProduct = { ...nextProduct, isLiked: likedIds.has(nextProduct.id) };
          } catch { /* keep product detail */ }
        }
        if (cancelled) return;
        setProduct(nextProduct);
        const requestedVariantId = Number(searchParams.get('variant'));
        const requestedSku = Number.isFinite(requestedVariantId)
          ? nextProduct.variants.find((variant) => variant.id === requestedVariantId && variant.isActive && variant.stock > 0)
          : undefined;
        const activeSku = requestedSku ?? nextProduct.variants.find((variant) => variant.isActive && variant.stock > 0);
        if (activeSku) setSelectedSku(activeSku);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, navigate, productId, searchParams]);

  const sizes = useMemo(() => uniqueActiveSizes(product?.variants), [product]);
  const colors = useMemo(() => uniqueActiveColors(product?.variants), [product]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'client') {
      setMessage('Use a client account to add products to the bag.');
      return;
    }
    if (!selectedSku) return;

    setAdding(true);
    setMessage('');
    try {
      await cartApi.addItem(selectedSku.id, quantity);
      window.dispatchEvent(new Event('cart:updated'));
      setMessage('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error adding to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!product) return;

    try {
      if (product.isLiked) {
        await productsApi.unlike(product.id);
        setProduct({
          ...product,
          isLiked: false,
          likesCount: Math.max(0, (product.likesCount ?? 1) - 1),
        });
      } else {
        await productsApi.like(product.id);
        setProduct({
          ...product,
          isLiked: true,
          likesCount: (product.likesCount ?? 0) + 1,
        });
      }
    } catch (error: any) {
      if (!product.isLiked && error.response?.status === 409) {
        setProduct({ ...product, isLiked: true });
        return;
      }
      setMessage('Could not update saved products.');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #1e1e3a', borderTopColor: '#2457ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
        <Package size={48} strokeWidth={1} />
        <p style={{ marginTop: '1rem' }}>Product not found</p>
      </div>
    );
  }

  const accent = getAccent(product.category?.name);
  const selectedPrice = selectedSku ? Number(selectedSku.price) : Number(product.variants[0]?.price ?? 0);

  return (
    <main className="product-detail-page" style={{ background: 'var(--surface-muted)', color: 'var(--text)', minHeight: '100vh', animation: 'fadeIn 0.35s ease-out' }}>
      <div style={{
        maxWidth: 1440,
        margin: '0 auto',
        padding: '1rem clamp(1rem, 3vw, 2.5rem) 4rem',
      }}>
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.35rem 0 1rem',
          color: 'var(--text-muted)',
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          <Link to="/" style={{ color: 'var(--text)' }}>Shop</Link>
          <ChevronRight size={14} />
          <span>{product.category?.name ?? 'Tees'}</span>
          <ChevronRight size={14} />
          <span style={{ color: accent }}>{product.name}</span>
        </nav>

        <div className="ln-product-layout" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.12fr) minmax(360px, 0.58fr)',
          gap: 'clamp(1.5rem, 4vw, 4rem)',
          alignItems: 'start',
        }}>
          <ProductGallery product={product} accent={accent} />
          <ProductPurchasePanel
            accent={accent}
            adding={adding}
            colors={colors}
            message={message}
            product={product}
            quantity={quantity}
            selectedPrice={selectedPrice}
            selectedSku={selectedSku}
            sizes={sizes}
            onAddToCart={handleAddToCart}
            onToggleLike={handleToggleLike}
            onQuantityChange={setQuantity}
            onSkuChange={setSelectedSku}
            canBuy={user?.role === 'client'}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .ln-product-layout {
            grid-template-columns: 1fr !important;
          }

          .ln-gallery {
            grid-template-columns: 1fr !important;
          }

          .ln-gallery > div {
            grid-column: span 1 !important;
            min-height: 430px !important;
          }
        }
      `}</style>
    </main>
  );
}
