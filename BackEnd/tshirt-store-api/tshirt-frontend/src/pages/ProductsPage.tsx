import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, Search, Shirt } from 'lucide-react';
import { productsApi } from '../api/products';
import { useAuth } from '../context/useAuth';
import { Category, Product } from '../types';
import { getPriceRange } from '../utils/productPricing';

const ACCENTS = ['#2457ff', '#111111', '#00a676', '#d63447', '#c5a253'];
const SKELETON_IDS = ['product-1', 'product-2', 'product-3', 'product-4', 'product-5', 'product-6', 'product-7', 'product-8'];

export default function ProductsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId],
  );

  const loadProducts = useCallback(() => {
    setLoading(true);
    productsApi.list({ page, limit: 12, categoryId, search: submittedSearch || undefined })
      .then(async ({ data }) => {
        let nextProducts = data.data;
        if (isAuthenticated && nextProducts.length > 0) {
          try {
            const likedResponse = await productsApi.listLiked({ page: 1, limit: 100 });
            const likedIds = new Set(likedResponse.data.data.map((product) => product.id));
            nextProducts = nextProducts.map((product) => ({
              ...product,
              isLiked: likedIds.has(product.id),
            }));
          } catch { /* keep public product list */ }
        }
        setProducts(nextProducts);
        setTotalPages(data.meta.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryId, isAuthenticated, page, submittedSearch]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    productsApi.listCategories().then((response) => setCategories(response.data)).catch(() => {});
  }, []);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSubmittedSearch(search);
  };

  const toggleLike = async (product: Product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const wasLiked = !!product.isLiked;
    setProducts((current) => current.map((item) => (
      item.id === product.id
        ? {
          ...item,
          isLiked: !wasLiked,
          likesCount: Math.max(0, (item.likesCount ?? 0) + (wasLiked ? -1 : 1)),
        }
        : item
    )));

    try {
      if (wasLiked) {
        await productsApi.unlike(product.id);
      } else {
        await productsApi.like(product.id);
      }
    } catch (error: any) {
      if (!wasLiked && error.response?.status === 409) {
        setProducts((current) => current.map((item) => (
          item.id === product.id ? { ...item, isLiked: true } : item
        )));
        return;
      }
      setProducts((current) => current.map((item) => (
        item.id === product.id
          ? {
            ...item,
            isLiked: wasLiked,
            likesCount: Math.max(0, (item.likesCount ?? 0) + (wasLiked ? 1 : -1)),
          }
          : item
      )));
    }
  };

  return (
    <main className="collection-page">
      <section className="collection-page__hero store-container">
        <div className="collection-page__hero-grid">
          <div>
            <p className="collection-page__eyebrow">{selectedCategory?.name ?? 'Summer sale'}</p>
            <h1 className="collection-page__title">ThreadVault tees</h1>
          </div>
          <p className="collection-page__intro">
            Premium daily t-shirts with bold graphics, clean basics, and performance-ready fits.
          </p>
        </div>
      </section>

      <section className="collection-page__filters store-container">
        <div className="collection-page__filter-grid">
          <form onSubmit={handleSearch} className="collection-page__search">
            <div className="collection-page__search-icon">
              <Search size={18} />
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
            />
            <button type="submit">Search</button>
          </form>

          <select
            value={categoryId ?? ''}
            onChange={(event) => { setCategoryId(event.target.value ? Number(event.target.value) : undefined); setPage(1); }}
            className="collection-page__select"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
      </section>

      <section className="collection-page__content store-container">
        {loading ? (
          <div className="collection-page__grid">
            {SKELETON_IDS.map((id) => (
              <div key={id} className="collection-card collection-card--loading">
                <div className="collection-card__skeleton" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="collection-page__empty">
            <Shirt size={54} strokeWidth={1.2} />
            <p>No products found</p>
          </div>
        ) : (
          <div className="collection-page__grid">
            {products.map((product, index) => {
              const accent = ACCENTS[index % ACCENTS.length];
              const images = product.images ?? [];
              const primaryImage = product.primaryImage ?? images[0]?.publicUrl;
              const hoverImage = images.find((image) => image.publicUrl !== primaryImage)?.publicUrl;
              const priceRange = getPriceRange(product.variants);
              return (
                <article key={product.id} className={`collection-card ${hoverImage ? 'collection-card--has-hover' : ''}`} style={{ animation: `slideUp 0.35s ease-out ${index * 0.03}s both` }}>
                  <Link to={`/products/${product.id}`} className="collection-card__media">
                    {primaryImage ? (
                      <>
                        <img className="collection-card__image collection-card__image--primary" src={primaryImage} alt={product.name} />
                        {hoverImage && <img className="collection-card__image collection-card__image--hover" src={hoverImage} alt="" />}
                      </>
                      ) : (
                        <>
                          <div className="collection-card__placeholder-ring" style={{ borderColor: accent }} />
                          <Shirt size={92} strokeWidth={1.1} color={accent} />
                        </>
                      )}
                    <span className="collection-card__tag" style={{ background: accent }}>
                      {product.category?.name ?? 'Tee'}
                    </span>
                  </Link>
                  <button
                    type="button"
                    className={`collection-card__like ${product.isLiked ? 'collection-card__like--active' : ''}`}
                    onClick={() => void toggleLike(product)}
                    aria-label={product.isLiked ? `Remove ${product.name} from saved products` : `Save ${product.name}`}
                  >
                    <Heart size={18} fill={product.isLiked ? 'currentColor' : 'transparent'} />
                    {product.likesCount ?? 0}
                  </button>
                  <div className="collection-card__body">
                    <Link to={`/products/${product.id}`} className="collection-card__name">{product.name}</Link>
                    <p className="collection-card__description">
                      {product.description.length > 72 ? `${product.description.slice(0, 72)}...` : product.description}
                    </p>
                    <strong className="collection-card__price">{priceRange}</strong>
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
