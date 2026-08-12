import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartApi } from '../api/cart';
import { Cart } from '../types';
import { ShoppingCart, Plus, Minus, Trash2, Package, ChevronRight, Shirt, CreditCard } from 'lucide-react';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const { data } = await cartApi.get();
      setCart(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      const { data } = await cartApi.updateItem(itemId, quantity);
      setCart(data);
    } catch { /* ignore */ }
  };

  const removeItem = async (itemId: number) => {
    setRemovingId(itemId);
    try {
      await cartApi.removeItem(itemId);
      loadCart();
    } catch { /* ignore */ }
    setRemovingId(null);
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

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <div style={{
      maxWidth: 1000,
      margin: '0 auto',
      padding: '2rem',
      animation: 'fadeIn 0.5s ease-out',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6c5ce7, #00cec9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ShoppingCart size={22} color="white" />
        </div>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '1.6rem',
            fontWeight: 700,
            color: '#ffffff',
          }}>
            Your Cart
          </h1>
          <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      {!cart || cart.items.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: '#12122a',
          borderRadius: '20px',
          border: '1px solid #1e1e3a',
          animation: 'scaleIn 0.4s ease-out',
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(108, 92, 231, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <ShoppingCart size={36} color="#6c5ce7" strokeWidth={1.5} />
          </div>
          <p style={{ color: '#e0e0e0', fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Your cart is empty
          </p>
          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Discover our collection and find something you love
          </p>
          <button onClick={() => navigate('/')} style={{
            padding: '0.75rem 2rem',
            background: 'linear-gradient(135deg, #6c5ce7, #5a4bd1)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 15px rgba(108, 92, 231, 0.3)',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Shirt size={18} />
            Browse Products
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
        }}>
          {/* Cart items */}
          <div style={{ flex: '1 1 500px' }}>
            {cart.items.map((item, index) => (
              <div key={item.id} style={{
                display: 'flex',
                gap: '1rem',
                padding: '1.25rem',
                background: '#12122a',
                borderRadius: '16px',
                marginBottom: '0.75rem',
                alignItems: 'center',
                border: '1px solid #1e1e3a',
                transition: 'all 0.3s ease',
                animation: `slideUp 0.4s ease-out ${index * 0.05}s both`,
                opacity: removingId === item.id ? 0.5 : 1,
                transform: removingId === item.id ? 'scale(0.98)' : 'scale(1)',
              }}>
                {/* Thumbnail */}
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6c5ce7, #00cec9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Shirt size={28} color="rgba(255,255,255,0.4)" />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#e0e0e0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.productName}
                  </h3>
                  <p style={{
                    margin: '0.2rem 0',
                    color: '#888',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}>
                    {item.sizeName}
                    <span style={{ color: '#333' }}>/</span>
                    {item.colorName}
                  </p>
                  <p style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    background: 'linear-gradient(135deg, #6c5ce7, #00cec9)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    ${item.unitPrice.toFixed(2)}
                  </p>
                </div>

                {/* Quantity controls */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0a0a1a',
                  borderRadius: '10px',
                  border: '1px solid #1e1e3a',
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    style={{
                      width: 32,
                      height: 32,
                      background: 'transparent',
                      color: '#b0b0c0',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1e1e3a'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{
                    width: 32,
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: '#e0e0e0',
                  }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{
                      width: 32,
                      height: 32,
                      background: 'transparent',
                      color: '#b0b0c0',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1e1e3a'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Line total */}
                <p style={{
                  fontWeight: 700,
                  minWidth: 70,
                  textAlign: 'right',
                  fontSize: '1rem',
                  color: '#e0e0e0',
                }}>
                  ${item.lineTotal.toFixed(2)}
                </p>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: 'rgba(233, 69, 96, 0.1)',
                    border: '1px solid rgba(233, 69, 96, 0.2)',
                    color: '#e94560',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(233, 69, 96, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(233, 69, 96, 0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(233, 69, 96, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(233, 69, 96, 0.2)';
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div style={{ flex: '0 0 320px', minWidth: '280px' }}>
            <div style={{
              background: '#12122a',
              borderRadius: '20px',
              border: '1px solid #1e1e3a',
              padding: '1.5rem',
              position: 'sticky',
              top: '5rem',
            }}>
              <h2 style={{
                margin: '0 0 1.25rem',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#e0e0e0',
              }}>
                Order Summary
              </h2>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #1e1e3a',
                marginBottom: '1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.9rem' }}>
                  <span>Subtotal ({itemCount} items)</span>
                  <span style={{ color: '#e0e0e0' }}>${cart.totalAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.9rem' }}>
                  <span>Shipping</span>
                  <span style={{ color: '#00b894' }}>Free</span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#e0e0e0' }}>Total</span>
                <span style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6c5ce7, #00cec9)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  ${cart.totalAmount.toFixed(2)}
                </span>
              </div>

              <button style={{
                width: '100%',
                padding: '0.9rem',
                background: 'linear-gradient(135deg, #00b894, #00a884)',
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
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(0, 184, 148, 0.3)',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 184, 148, 0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 184, 148, 0.3)';
                }}
              >
                <CreditCard size={18} />
                Proceed to Checkout
                <ChevronRight size={18} />
              </button>

              <p style={{
                textAlign: 'center',
                color: '#666',
                fontSize: '0.75rem',
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
              }}>
                <Package size={12} />
                Free shipping on all orders
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
