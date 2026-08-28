import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, Shirt } from 'lucide-react';
import { productsApi } from '../api/products';
import { Product, ProductVariant } from '../types';

const PAGE_SIZE = 8;

function getAvailableSizes(variants: ProductVariant[] = []) {
  const available = variants.filter((variant) => variant.isActive && variant.stock > 0);
  return [...new Map(available.map((variant) => [variant.size.id, variant])).values()];
}

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
        <p className="store-kicker">Your list</p>
        <div className="saved-page__title-row">
          <div>
            <h1 className="store-title">Saved products</h1>
            <p className="store-muted">{totalItems} products saved for later.</p>
          </div>
          <Heart size={36} strokeWidth={1.5} />
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
              const sizes = getAvailableSizes(product.variants);

              return (
                <article key={product.id} className="saved-card store-card">
                  <Link to={`/products/${product.id}`} className="saved-card__media">
                    {primaryImage ? (
                      <img src={primaryImage} alt={product.name} />
                    ) : (
                      <Shirt size={72} strokeWidth={1.1} />
                    )}
                  </Link>
                  <div className="saved-card__body">
                    <div>
                      <p className="saved-card__category">{product.category?.name ?? 'Tee'}</p>
                      <Link to={`/products/${product.id}`} className="saved-card__name">{product.name}</Link>
                    </div>
                    <div className="saved-card__sizes">
                      {sizes.length > 0 ? sizes.slice(0, 6).map((variant) => (
                        <Link key={variant.id} to={`/products/${product.id}?variant=${variant.id}`}>
                          {variant.size.name}
                        </Link>
                      )) : <span>No sizes</span>}
                    </div>
                    <button type="button" className="saved-card__remove" onClick={() => void removeSaved(product.id)}>
                      <Heart size={16} fill="currentColor" />
                      Remove
                    </button>
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
