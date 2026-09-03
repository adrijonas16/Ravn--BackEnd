import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, ShoppingBag, Shirt, X } from 'lucide-react';
import { productsApi } from '../api/products';
import { Product } from '../types';
import { getPriceRange } from '../utils/productPricing';

const PAGE_SIZE = 8;

export default function SavedProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSavedProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await productsApi.listLiked({ page, limit: PAGE_SIZE });
      setProducts(data.data);
      setTotalItems(data.meta.totalItems);
      setTotalPages(Math.max(data.meta.totalPages, 1));
    } catch {
      setError('Saved products could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadSavedProducts();
  }, [loadSavedProducts]);

  const removeSaved = async (productId: number) => {
    await productsApi.unlike(productId);
    const nextCount = Math.max(totalItems - 1, 0);
    if (products.length === 1 && page > 1) {
      setPage((current) => current - 1);
      return;
    }
    setTotalItems(nextCount);
    await loadSavedProducts();
  };

  return (
    <main className="saved-page store-page">
      <section className="saved-page__header store-container">
        <div className="saved-page__title-row">
          <div>
            <p className="store-kicker">Your list</p>
            <h1 className="store-title">Saved products</h1>
            <p className="store-muted">{totalItems} {totalItems === 1 ? 'product' : 'products'} saved for later.</p>
          </div>
          <span className="saved-page__mark">
            <Heart size={24} fill="currentColor" />
          </span>
        </div>
      </section>

      <section className="saved-page__content store-container">
        {error && <p className="admin-products__notice admin-products__notice--error">{error}</p>}

        {loading ? (
          <div className="saved-page__grid">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="collection-card collection-card--loading" key={index}>
                <div className="collection-card__skeleton" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="saved-page__empty store-panel">
            <Shirt size={52} strokeWidth={1.2} />
            <h2>No saved products yet</h2>
            <p>Save products from the detail page and they will appear here.</p>
            <Link className="store-button" to="/products">Browse products</Link>
          </div>
        ) : (
          <div className="saved-page__grid">
            {products.map((product) => {
              const primaryImage = product.primaryImage ?? product.images?.[0]?.publicUrl;
              const priceRange = getPriceRange(product.variants);

              return (
                <article key={product.id} className="saved-card store-card">
                  <Link to={`/products/${product.id}`} className="saved-card__media">
                    {primaryImage ? (
                      <img src={primaryImage} alt={product.name} />
                    ) : (
                      <Shirt size={72} strokeWidth={1.1} />
                    )}
                    <span className="saved-card__badge">
                      <Heart size={14} fill="currentColor" />
                      Saved
                    </span>
                  </Link>
                  <div className="saved-card__body">
                    <div className="saved-card__main">
                      <p className="saved-card__category">{product.category?.name ?? 'Tee'}</p>
                      <div className="saved-card__name-row">
                        <Link to={`/products/${product.id}`} className="saved-card__name">{product.name}</Link>
                        <strong>{priceRange}</strong>
                      </div>
                    </div>
                    <p className="saved-card__description">
                      {product.description.length > 86 ? `${product.description.slice(0, 86)}...` : product.description}
                    </p>
                    <div className="saved-card__actions">
                      <Link className="store-button saved-card__view" to={`/products/${product.id}`}>
                        <ShoppingBag size={16} />
                        View product
                      </Link>
                      <button type="button" className="saved-card__remove" onClick={() => void removeSaved(product.id)} aria-label={`Remove ${product.name}`}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="collection-page__pagination">
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page">
              <ChevronLeft size={18} />
            </button>
            <span>Page {page} of {totalPages}</span>
            <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} aria-label="Next page">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
