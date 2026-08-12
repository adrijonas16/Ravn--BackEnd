import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsApi } from '../api/products';
import { cartApi } from '../api/cart';
import { ProductDetail, Sku } from '../types';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Plus, Minus, ChevronRight, Heart, Shirt, Package, Check } from 'lucide-react';

const CATEGORY_GRADIENTS: Record<string, string> = {
  graphic: 'linear-gradient(135deg, #6c5ce7, #a855f7, #7c3aed)',
  basic: 'linear-gradient(135deg, #2d2d4a, #3d3d5c, #4d4d6c)',
  premium: 'linear-gradient(135deg, #f59e0b, #d97706, #b45309)',
  vintage: 'linear-gradient(135deg, #d97706, #92400e, #78350f)',
  sport: 'linear-gradient(135deg, #00b894, #00cec9, #00b894)',
};

function getCategoryGradient(categoryName?: string): string {
  if (!categoryName) return CATEGORY_GRADIENTS.basic;
  const key = categoryName.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_GRADIENTS)) {
    if (key.includes(k)) return v;
  }
  return 'linear-gradient(135deg, #6c5ce7, #00cec9)';
}

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedSku, setSelectedSku] = useState<Sku | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!productId) return;
    productsApi.get(Number(productId)).then(r => {
      setProduct(r.data);
      const activeSku = r.data.skus.find(s => s.isActive && s.stock > 0);
      if (activeSku) setSelectedSku(activeSku);
    }).catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!selectedSku) return;
    setAdding(true);
    setMessage('');
    try {
      await cartApi.addItem(selectedSku.id, quantity);
      setMessage('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error adding to cart');
    }
    setAdding(false);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #1e1e3a',
          borderTopColor: '#6c5ce7',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
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

  const sizes = [...new Map(product.skus.filter(s => s.isActive).map(s => [s.size.id, s.size])).values()];
  const colors = [...new Map(product.skus.filter(s => s.isActive).map(s => [s.color.id, s.color])).values()];

  const stockPercent = selectedSku ? Math.min(100, (selectedSku.stock / 20) * 100) : 0;
  const stockColor = selectedSku
    ? selectedSku.stock === 0 ? '#e94560'
    : selectedSku.stock <= 3 ? '#f59e0b'
    : '#00b894'
    : '#888';

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Breadcrumb */}
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '1.5rem 2rem 0',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.85rem',
        color: '#888',
      }}>
        <Link to="/" style={{ color: '#888', textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#00cec9'}
          onMouseLeave={e => e.currentTarget.style.color = '#888'}>
          Products
        </Link>
        <ChevronRight size={14} />
        {product.category?.name && (
          <>
            <span style={{ color: '#888' }}>{product.category.name}</span>
            <ChevronRight size={14} />
          </>
        )}
        <span style={{ color: '#e0e0e0' }}>{product.name}</span>
      </div>

      {/* Product Layout */}
      <div style={{
        maxWidth: 1100,
        margin: '1.5rem auto',
        padding: '0 2rem 3rem',
        display: 'flex',
        gap: '3rem',
        flexWrap: 'wrap',
      }}>
        {/* Image / Gradient Hero */}
        <div style={{
          flex: '1 1 400px',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            height: 450,
            background: getCategoryGradient(product.category?.name),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
          }}>
            {product.images.length > 0 ? (
              <img
                src={product.images[0].publicUrl}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.1,
                  backgroundImage: `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.4) 0%, transparent 50%),
                    radial-gradient(circle at 70% 60%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
                }} />
                <Shirt size={120} strokeWidth={1} color="rgba(255,255,255,0.25)" />
              </>
            )}

            {/* Likes badge */}
            {product._count && product._count.likes > 0 && (
              <div style={{
                position: 'absolute',
                bottom: '1rem',
                right: '1rem',
                padding: '0.4rem 0.8rem',
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '10px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.9rem',
              }}>
                <Heart size={16} fill="#e94560" color="#e94560" />
                {product._count.likes} likes
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div style={{
          flex: '1 1 350px',
          animation: 'slideUp 0.5s ease-out 0.1s both',
        }}>
          {/* Category pill */}
          {product.category?.name && (
            <span style={{
              display: 'inline-block',
              padding: '0.3rem 0.8rem',
              background: 'rgba(108, 92, 231, 0.15)',
              border: '1px solid rgba(108, 92, 231, 0.25)',
              borderRadius: '20px',
              fontSize: '0.8rem',
              color: '#a78bfa',
              fontWeight: 500,
              marginBottom: '0.75rem',
            }}>
              {product.category.name}
            </span>
          )}

          <h1 style={{
            margin: '0 0 0.75rem',
            fontSize: '2rem',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            {product.name}
          </h1>

          <p style={{
            color: '#888',
            lineHeight: 1.7,
            fontSize: '0.95rem',
            marginBottom: '1.5rem',
          }}>
            {product.description}
          </p>

          {/* Price */}
          {selectedSku && (
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}>
              <span style={{
                fontSize: '2.2rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6c5ce7, #00cec9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                ${Number(selectedSku.price).toFixed(2)}
              </span>
            </div>
          )}

          {/* Size selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              color: '#888',
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Size
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {sizes.map(size => {
                const isSelected = selectedSku?.size.id === size.id;
                return (
                  <button key={size.id}
                    onClick={() => {
                      const sku = product.skus.find(s => s.size.id === size.id && s.color.id === (selectedSku?.color.id ?? colors[0]?.id) && s.isActive);
                      if (sku) setSelectedSku(sku);
                    }}
                    style={{
                      padding: '0.6rem 1.2rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: isSelected
                        ? 'linear-gradient(135deg, #6c5ce7, #5a4bd1)'
                        : '#12122a',
                      color: isSelected ? 'white' : '#b0b0c0',
                      border: isSelected
                        ? '1px solid #6c5ce7'
                        : '1px solid #1e1e3a',
                      fontSize: '0.9rem',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.borderColor = '#6c5ce7';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.borderColor = '#1e1e3a';
                    }}
                  >
                    {size.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              color: '#888',
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Color
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {colors.map(color => {
                const isSelected = selectedSku?.color.id === color.id;
                return (
                  <button key={color.id}
                    onClick={() => {
                      const sku = product.skus.find(s => s.color.id === color.id && s.size.id === (selectedSku?.size.id ?? sizes[0]?.id) && s.isActive);
                      if (sku) setSelectedSku(sku);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: isSelected ? '#12122a' : '#12122a',
                      color: isSelected ? '#e0e0e0' : '#b0b0c0',
                      border: isSelected
                        ? '2px solid #00cec9'
                        : '1px solid #1e1e3a',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: isSelected ? 500 : 400,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.borderColor = '#00cec9';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.borderColor = '#1e1e3a';
                    }}
                  >
                    {color.hexCode && (
                      <span style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: color.hexCode,
                        display: 'inline-block',
                        border: '2px solid rgba(255,255,255,0.15)',
                        boxShadow: isSelected ? `0 0 0 2px ${color.hexCode}33` : 'none',
                      }} />
                    )}
                    {color.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock indicator */}
          {selectedSku && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.4rem',
              }}>
                <span style={{
                  fontSize: '0.85rem',
                  color: stockColor,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}>
                  <Package size={14} />
                  {selectedSku.stock > 0
                    ? `${selectedSku.stock} in stock`
                    : 'Out of stock'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>
                  SKU: {selectedSku.sku}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: '#1e1e3a',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${stockPercent}%`,
                  height: '100%',
                  background: stockColor,
                  borderRadius: '2px',
                  transition: 'width 0.5s ease, background 0.3s ease',
                }} />
              </div>
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
          }}>
            {/* Quantity controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#12122a',
              borderRadius: '12px',
              border: '1px solid #1e1e3a',
              overflow: 'hidden',
            }}>
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                style={{
                  width: 42,
                  height: 42,
                  background: 'transparent',
                  color: '#e0e0e0',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e1e3a'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Minus size={16} />
              </button>
              <span style={{
                width: 44,
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '1rem',
                color: '#e0e0e0',
              }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                style={{
                  width: 42,
                  height: 42,
                  background: 'transparent',
                  color: '#e0e0e0',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e1e3a'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Add to cart button */}
            <button
              onClick={handleAddToCart}
              disabled={adding || !selectedSku || selectedSku.stock === 0}
              style={{
                flex: 1,
                padding: '0.85rem 1.5rem',
                background: message === 'success'
                  ? 'linear-gradient(135deg, #00b894, #00cec9)'
                  : 'linear-gradient(135deg, #6c5ce7, #5a4bd1)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(108, 92, 231, 0.3)',
              }}
              onMouseEnter={e => {
                if (!adding && message !== 'success') {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(108, 92, 231, 0.4)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(108, 92, 231, 0.3)';
              }}
            >
              {adding ? (
                <>
                  <div style={{
                    width: 18,
                    height: 18,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Adding...
                </>
              ) : message === 'success' ? (
                <>
                  <Check size={20} />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  Add to Cart
                </>
              )}
            </button>
          </div>

          {/* Error message */}
          {message && message !== 'success' && (
            <p style={{
              marginTop: '0.75rem',
              color: '#e94560',
              fontSize: '0.9rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(233, 69, 96, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(233, 69, 96, 0.2)',
              animation: 'slideDown 0.3s ease-out',
            }}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
