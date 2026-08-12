import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../api/products';
import { Product, Category } from '../types';
import { Search, Heart, ChevronLeft, ChevronRight, Filter, Shirt, Sparkles, Star } from 'lucide-react';

const CATEGORY_GRADIENTS: Record<string, string> = {
  graphic: 'linear-gradient(135deg, #6c5ce7, #a855f7, #6c5ce7)',
  basic: 'linear-gradient(135deg, #2d2d4a, #3d3d5c, #2d2d4a)',
  premium: 'linear-gradient(135deg, #f59e0b, #d97706, #b45309)',
  vintage: 'linear-gradient(135deg, #d97706, #92400e, #78350f)',
  sport: 'linear-gradient(135deg, #00b894, #00cec9, #00b894)',
};

const CATEGORY_ICONS: Record<string, string> = {
  graphic: 'linear-gradient(135deg, #a78bfa, #c4b5fd)',
  basic: 'linear-gradient(135deg, #94a3b8, #cbd5e1)',
  premium: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  vintage: 'linear-gradient(135deg, #f59e0b, #d97706)',
  sport: 'linear-gradient(135deg, #34d399, #6ee7b7)',
};

function getCategoryGradient(categoryName?: string): string {
  if (!categoryName) return CATEGORY_GRADIENTS.basic;
  const key = categoryName.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_GRADIENTS)) {
    if (key.includes(k)) return v;
  }
  return 'linear-gradient(135deg, #6c5ce7, #00cec9)';
}

function getCategoryShirtColor(categoryName?: string): string {
  if (!categoryName) return 'rgba(255,255,255,0.3)';
  const key = categoryName.toLowerCase();
  for (const [k] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return 'rgba(255,255,255,0.25)';
  }
  return 'rgba(255,255,255,0.25)';
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
  }, [page, categoryId]);

  useEffect(() => {
    productsApi.listCategories().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productsApi.list({ page, limit: 12, categoryId, search: search || undefined });
      setProducts(data.data);
      setTotalPages(data.meta.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Hero Section */}
      <div style={{
        position: 'relative',
        padding: '4rem 2rem 3rem',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Background gradient orbs */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '20%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108, 92, 231, 0.15), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          top: '-30%',
          right: '15%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 206, 201, 0.1), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          background: 'rgba(108, 92, 231, 0.15)',
          borderRadius: '20px',
          border: '1px solid rgba(108, 92, 231, 0.25)',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          color: '#a78bfa',
        }}>
          <Sparkles size={14} />
          New Collection Available
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #ffffff, #b0b0c0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.75rem',
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
        }}>
          Discover Your Style
        </h1>
        <p style={{
          color: '#888',
          fontSize: '1.1rem',
          maxWidth: '500px',
          margin: '0 auto 2rem',
          lineHeight: 1.6,
        }}>
          Premium t-shirts crafted for comfort and designed to stand out
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 2rem 2rem',
      }}>
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          padding: '1rem',
          background: '#12122a',
          borderRadius: '16px',
          border: '1px solid #1e1e3a',
        }}>
          <form onSubmit={handleSearch} style={{
            display: 'flex',
            gap: '0.5rem',
            flex: '1 1 300px',
          }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#0a0a1a',
              borderRadius: '10px',
              border: '1px solid #1e1e3a',
              padding: '0 1rem',
              transition: 'border-color 0.2s ease',
            }}>
              <Search size={18} color="#888" />
              <input
                placeholder="Search t-shirts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.7rem 0',
                  border: 'none',
                  background: 'transparent',
                  color: '#e0e0e0',
                  outline: 'none',
                  fontSize: '0.95rem',
                }}
              />
            </div>
            <button type="submit" style={{
              padding: '0.7rem 1.5rem',
              background: 'linear-gradient(135deg, #6c5ce7, #5a4bd1)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Search size={16} />
              Search
            </button>
          </form>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#0a0a1a',
            borderRadius: '10px',
            border: '1px solid #1e1e3a',
            padding: '0 0.75rem',
          }}>
            <Filter size={16} color="#888" />
            <select
              value={categoryId ?? ''}
              onChange={e => { setCategoryId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
              style={{
                padding: '0.7rem 0.5rem',
                border: 'none',
                background: 'transparent',
                color: '#e0e0e0',
                outline: 'none',
                fontSize: '0.9rem',
                cursor: 'pointer',
                minWidth: '160px',
              }}
            >
              <option value="" style={{ background: '#0a0a1a' }}>All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#0a0a1a' }}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem 3rem' }}>
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '1.5rem',
          }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                background: '#12122a',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #1e1e3a',
              }}>
                <div style={{
                  height: 220,
                  background: 'linear-gradient(90deg, #1e1e3a 25%, #2a2a4a 50%, #1e1e3a 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s ease-in-out infinite',
                }} />
                <div style={{ padding: '1.2rem' }}>
                  <div style={{ height: 16, background: '#1e1e3a', borderRadius: 4, marginBottom: 8, width: '70%' }} />
                  <div style={{ height: 12, background: '#1e1e3a', borderRadius: 4, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#888',
            animation: 'fadeIn 0.5s ease-out',
          }}>
            <Shirt size={64} strokeWidth={1} color="#333" />
            <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>No products found</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '1.5rem',
          }}>
            {products.map((product, index) => {
              const isHovered = hoveredCard === product.id;
              return (
                <Link
                  to={`/products/${product.id}`}
                  key={product.id}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    animation: `slideUp 0.5s ease-out ${index * 0.05}s both`,
                  }}
                  onMouseEnter={() => setHoveredCard(product.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div style={{
                    background: '#12122a',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: `1px solid ${isHovered ? 'rgba(108, 92, 231, 0.4)' : '#1e1e3a'}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                    boxShadow: isHovered
                      ? '0 20px 40px rgba(108, 92, 231, 0.15), 0 0 0 1px rgba(108, 92, 231, 0.1)'
                      : '0 4px 20px rgba(0, 0, 0, 0.2)',
                    cursor: 'pointer',
                  }}>
                    {/* Gradient image area */}
                    <div style={{
                      height: 220,
                      background: getCategoryGradient(product.category?.name),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      {product.primaryImage ? (
                        <img
                          src={product.primaryImage}
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <>
                          {/* Decorative pattern */}
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            opacity: 0.1,
                            backgroundImage: `radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
                              radial-gradient(circle at 70% 30%, rgba(255,255,255,0.2) 0%, transparent 40%)`,
                          }} />
                          <Shirt
                            size={72}
                            strokeWidth={1}
                            color={getCategoryShirtColor(product.category?.name)}
                            style={{
                              transition: 'transform 0.3s ease',
                              transform: isHovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
                            }}
                          />
                        </>
                      )}

                      {/* Category badge */}
                      {product.category?.name && (
                        <div style={{
                          position: 'absolute',
                          top: '0.75rem',
                          left: '0.75rem',
                          padding: '0.25rem 0.7rem',
                          background: 'rgba(0, 0, 0, 0.4)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontWeight: 500,
                        }}>
                          {product.category.name}
                        </div>
                      )}

                      {/* Likes badge */}
                      {product.likesCount !== undefined && product.likesCount > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: '0.75rem',
                          padding: '0.25rem 0.6rem',
                          background: 'rgba(233, 69, 96, 0.85)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          color: 'white',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}>
                          <Heart size={12} fill="white" />
                          {product.likesCount}
                        </div>
                      )}
                    </div>

                    {/* Card content */}
                    <div style={{ padding: '1.2rem' }}>
                      <h3 style={{
                        margin: '0 0 0.4rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#e0e0e0',
                        lineHeight: 1.3,
                      }}>
                        {product.name}
                      </h3>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '0.75rem',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}>
                          <Star size={14} fill="#f59e0b" color="#f59e0b" />
                          <span style={{ color: '#888', fontSize: '0.8rem' }}>
                            {product.category?.name || 'Uncategorized'}
                          </span>
                        </div>

                        <div style={{
                          padding: '0.2rem 0.6rem',
                          background: isHovered ? 'rgba(108, 92, 231, 0.2)' : 'rgba(108, 92, 231, 0.1)',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          color: '#a78bfa',
                          fontWeight: 500,
                          transition: 'background 0.2s ease',
                        }}>
                          View Details
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.75rem',
            marginTop: '3rem',
            animation: 'fadeIn 0.5s ease-out',
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '0.6rem 1rem',
                background: '#12122a',
                color: '#e0e0e0',
                border: '1px solid #1e1e3a',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
              }}
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <div style={{
              display: 'flex',
              gap: '0.25rem',
            }}>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '10px',
                      border: pageNum === page ? 'none' : '1px solid #1e1e3a',
                      background: pageNum === page
                        ? 'linear-gradient(135deg, #6c5ce7, #5a4bd1)'
                        : '#12122a',
                      color: pageNum === page ? 'white' : '#888',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: pageNum === page ? 600 : 400,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '0.6rem 1rem',
                background: '#12122a',
                color: '#e0e0e0',
                border: '1px solid #1e1e3a',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
              }}
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
