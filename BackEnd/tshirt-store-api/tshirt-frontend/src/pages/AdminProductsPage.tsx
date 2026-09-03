import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { Edit3, ImagePlus, PackagePlus, Plus, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';
import {
  ProductImagePayload,
  ProductPayload,
  ProductVariantPayload,
  productsApi,
} from '../api/products';
import { Category, Color, Product, ProductDetail, ProductImage, ProductVariant, Size } from '../types';

interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

const emptyProductForm: ProductPayload = {
  name: '',
  description: '',
  categoryId: 0,
  status: 'active',
};

const emptyImageForm: ProductImagePayload = {
  publicUrl: '',
  altText: '',
  sortOrder: 0,
  isPrimary: false,
  productVariantId: undefined,
};

const emptyVariantForm: ProductVariantPayload = {
  sizeId: 0,
  colorId: 0,
  sku: '',
  price: 0,
  stock: 0,
  isActive: true,
};

interface AdminProductsState {
  products: Product[];
  meta: PaginationMeta;
  categories: Category[];
  sizes: Size[];
  colors: Color[];
  selectedProduct: ProductDetail | null;
  productForm: ProductPayload;
  imageForm: ProductImagePayload;
  imageUploadFile: File | null;
  variantForm: ProductVariantPayload;
  searchTerm: string;
  categoryFilter: string;
  editorOpen: boolean;
  message: string;
  error: string;
  loading: boolean;
  saving: boolean;
}

const initialAdminProductsState: AdminProductsState = {
  products: [],
  meta: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
  categories: [],
  sizes: [],
  colors: [],
  selectedProduct: null,
  productForm: emptyProductForm,
  imageForm: emptyImageForm,
  imageUploadFile: null,
  variantForm: emptyVariantForm,
  searchTerm: '',
  categoryFilter: '',
  editorOpen: false,
  message: '',
  error: '',
  loading: true,
  saving: false,
};

function adminProductsReducer(
  state: AdminProductsState,
  updates: Partial<AdminProductsState>,
): AdminProductsState {
  return { ...state, ...updates };
}

function parseNonNegativeNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function productTotalStock(product: Product): number {
  return product.variants?.reduce((sum, variant) => sum + variant.stock, 0) ?? 0;
}

function toProductForm(product: ProductDetail): ProductPayload {
  return {
    name: product.name,
    description: product.description,
    categoryId: product.category.id,
    status: product.status,
  };
}

function normalizeProductForm(form: ProductPayload): ProductPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    categoryId: Number(form.categoryId),
    status: form.status ?? 'active',
  };
}

function normalizeImageForm(form: ProductImagePayload): ProductImagePayload {
  return {
    publicUrl: form.publicUrl.trim(),
    altText: form.altText?.trim() || undefined,
    sortOrder: Number(form.sortOrder ?? 0),
    isPrimary: !!form.isPrimary,
    productVariantId: form.productVariantId
      ? Number(form.productVariantId)
      : undefined,
  };
}

function formatVariantLabel(variant: ProductVariant): string {
  return `${variant.size.name} / ${variant.color.name} - ${variant.sku}`;
}

function normalizeVariantForm(form: ProductVariantPayload): ProductVariantPayload {
  return {
    sizeId: Number(form.sizeId),
    colorId: Number(form.colorId),
    sku: form.sku.trim().toUpperCase(),
    price: Number(form.price),
    stock: Number(form.stock),
    isActive: form.isActive ?? true,
  };
}

function ProductForm({
  categories,
  form,
  saving,
  onChange,
  onSubmit,
}: {
  categories: Category[];
  form: ProductPayload;
  saving: boolean;
  onChange: (form: ProductPayload) => void;
  onSubmit: () => void;
}) {
  return (
    <form className="admin-products__form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <label>
        <span>Name</span>
        <input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} required />
      </label>
      <label>
        <span>Category</span>
        <select value={form.categoryId || ''} onChange={(event) => onChange({ ...form, categoryId: Number(event.target.value) })} required>
          <option value="">Select category</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label>
        <span>Status</span>
        <select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as ProductPayload['status'] })}>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </label>
      <label className="admin-products__wide-field">
        <span>Description</span>
        <textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} required />
      </label>
      <button type="submit" className="store-button admin-products__submit" disabled={saving}>
        <Save size={16} />
        {saving ? 'Saving...' : 'Save product'}
      </button>
    </form>
  );
}

function ImageManager({
  images,
  imageForm,
  imageUploadFile,
  saving,
  variants,
  onAdd,
  onChange,
  onDelete,
  onFileChange,
  onPrimary,
}: {
  images: ProductImage[];
  imageForm: ProductImagePayload;
  imageUploadFile: File | null;
  saving: boolean;
  variants: ProductVariant[];
  onAdd: () => void;
  onChange: (form: ProductImagePayload) => void;
  onDelete: (imageId: number) => void;
  onFileChange: (file: File | null) => void;
  onPrimary: (imageId: number) => void;
}) {
  const variantById = new Map(variants.map((variant) => [variant.id, variant]));

  return (
    <section className="admin-products__section">
      <div className="admin-products__section-header">
        <h3>Images</h3>
      </div>
      <form className="admin-products__form" onSubmit={(event) => { event.preventDefault(); onAdd(); }}>
        <label className="admin-products__wide-field">
          <span>Upload image</span>
          <input type="file" accept="image/*" onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} />
          {imageUploadFile && <small>{imageUploadFile.name}</small>}
        </label>
        <label className="admin-products__wide-field">
          <span>Image URL</span>
          <input
            value={imageForm.publicUrl}
            onChange={(event) => onChange({ ...imageForm, publicUrl: event.target.value })}
            required={!imageUploadFile}
          />
        </label>
        <label>
          <span>Variant</span>
          <select
            value={imageForm.productVariantId ?? ''}
            onChange={(event) => onChange({
              ...imageForm,
              productVariantId: event.target.value ? Number(event.target.value) : undefined,
            })}
          >
            <option value="">Product gallery</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>{formatVariantLabel(variant)}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Alt text</span>
          <input value={imageForm.altText ?? ''} onChange={(event) => onChange({ ...imageForm, altText: event.target.value })} />
        </label>
        <label>
          <span>Sort</span>
          <input type="number" min={0} value={imageForm.sortOrder ?? 0} onChange={(event) => onChange({ ...imageForm, sortOrder: parseNonNegativeNumber(event.target.value) })} />
        </label>
        <label className="admin-products__check">
          <input type="checkbox" checked={!!imageForm.isPrimary} onChange={(event) => onChange({ ...imageForm, isPrimary: event.target.checked })} />
          Primary
        </label>
        <button type="submit" className="store-button admin-products__submit" disabled={saving}>
          <ImagePlus size={16} />
          Add image
        </button>
      </form>

      <div className="admin-products__image-grid">
        {images.map((image) => (
          <article key={image.id} className="admin-products__image-card">
            <img src={image.publicUrl} alt={image.altText ?? ''} />
            <div>
              <strong>{image.isPrimary ? 'Primary image' : `Sort ${image.sortOrder}`}</strong>
              <small>{image.altText || 'No alt text'}</small>
              {image.productVariantId && variantById.has(image.productVariantId) && (
                <small>Variant: {formatVariantLabel(variantById.get(image.productVariantId)!)}</small>
              )}
            </div>
            <div className="admin-products__row-actions">
              {!image.isPrimary && <button type="button" onClick={() => onPrimary(image.id)}>Make primary</button>}
              <button type="button" className="admin-products__danger" aria-label="Delete image" onClick={() => onDelete(image.id)}><Trash2 size={15} /></button>
            </div>
          </article>
        ))}
        {images.length === 0 && <p className="store-muted">No images yet.</p>}
      </div>
    </section>
  );
}

function VariantManager({
  colors,
  sizes,
  variants,
  variantForm,
  saving,
  onAdd,
  onChange,
  onToggle,
}: {
  colors: Color[];
  sizes: Size[];
  variants: ProductVariant[];
  variantForm: ProductVariantPayload;
  saving: boolean;
  onAdd: () => void;
  onChange: (form: ProductVariantPayload) => void;
  onToggle: (variant: ProductVariant) => void;
}) {
  return (
    <section className="admin-products__section">
      <div className="admin-products__section-header">
        <h3>Variants</h3>
      </div>
      <form className="admin-products__form admin-products__variant-form" onSubmit={(event) => { event.preventDefault(); onAdd(); }}>
        <label>
          <span>Size</span>
          <select value={variantForm.sizeId || ''} onChange={(event) => onChange({ ...variantForm, sizeId: Number(event.target.value) })} required>
            <option value="">Size</option>
            {sizes.map((size) => <option key={size.id} value={size.id}>{size.name}</option>)}
          </select>
        </label>
        <label>
          <span>Color</span>
          <select value={variantForm.colorId || ''} onChange={(event) => onChange({ ...variantForm, colorId: Number(event.target.value) })} required>
            <option value="">Color</option>
            {colors.map((color) => <option key={color.id} value={color.id}>{color.name}</option>)}
          </select>
        </label>
        <label>
          <span>SKU</span>
          <input value={variantForm.sku} onChange={(event) => onChange({ ...variantForm, sku: event.target.value })} required />
        </label>
        <label>
          <span>Price</span>
          <input type="number" min={0} step="0.01" value={variantForm.price} onChange={(event) => onChange({ ...variantForm, price: parseNonNegativeNumber(event.target.value) })} required />
        </label>
        <label>
          <span>Stock</span>
          <input type="number" min={0} value={variantForm.stock} onChange={(event) => onChange({ ...variantForm, stock: parseNonNegativeNumber(event.target.value) })} required />
        </label>
        <button type="submit" className="store-button admin-products__submit" disabled={saving}>
          <PackagePlus size={16} />
          Add variant
        </button>
      </form>

      <div className="admin-products__variant-list">
        {variants.map((variant) => (
          <article key={variant.id} className="admin-products__variant-row">
            <div>
              <strong>{variant.size.name} / {variant.color.name}</strong>
              <small>{variant.sku}</small>
            </div>
            <span>${Number(variant.price).toFixed(2)}</span>
            <span>{variant.stock} stock</span>
            <button type="button" onClick={() => onToggle(variant)}>
              {variant.isActive ? 'Disable' : 'Enable'}
            </button>
          </article>
        ))}
        {variants.length === 0 && <p className="store-muted">No variants yet.</p>}
      </div>
    </section>
  );
}

function ProductTable({
  categories,
  categoryFilter,
  meta,
  products,
  searchTerm,
  selectedProductId,
  onCategoryFilterChange,
  onLimitChange,
  onPageChange,
  onSearchChange,
  onSelectProduct,
}: {
  categories: Category[];
  categoryFilter: string;
  meta: PaginationMeta;
  products: Product[];
  searchTerm: string;
  selectedProductId?: number;
  onCategoryFilterChange: (categoryId: string) => void;
  onLimitChange: (limit: number) => void;
  onPageChange: (page: number) => void;
  onSearchChange: (searchTerm: string) => void;
  onSelectProduct: (productId: number) => void;
}) {
  return (
    <section className="store-panel admin-products__table-panel">
      <div className="admin-products__toolbar">
        <label className="admin-products__search">
          <Search size={17} />
          <input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search products"
            aria-label="Search products"
          />
        </label>
        <select
          value={categoryFilter}
          onChange={(event) => onCategoryFilterChange(event.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select
          value={meta.limit}
          onChange={(event) => onLimitChange(parseNonNegativeNumber(event.target.value))}
          aria-label="Rows per page"
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      <div className="admin-products__table-wrap">
        <table className="admin-products__table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Status</th>
              <th>Variants</th>
              <th>Stock</th>
              <th>Images</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className={selectedProductId === product.id ? 'admin-products__table-row--active' : ''}>
                <td>
                  <div className="admin-products__table-product">
                    <span>{product.primaryImage ? <img src={product.primaryImage} alt="" /> : <PackagePlus size={20} />}</span>
                    <div>
                      <strong>{product.name}</strong>
                      <small>{product.slug}</small>
                    </div>
                  </div>
                </td>
                <td>{product.category.name}</td>
                <td><span className={`admin-products__status admin-products__status--${product.status}`}>{product.status}</span></td>
                <td>{product.variants?.length ?? 0}</td>
                <td>{productTotalStock(product)}</td>
                <td>{product.images?.length ?? 0}</td>
                <td>
                  <button type="button" className="admin-products__edit-button" onClick={() => onSelectProduct(product.id)}>
                    <Edit3 size={15} />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="admin-products__empty">No products match the current filters.</p>}
      </div>

      <div className="admin-products__pagination">
        <span>
          Page {meta.page} of {Math.max(meta.totalPages, 1)} · {meta.totalItems} products
        </span>
        <div>
          <button type="button" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>Previous</button>
          <button type="button" disabled={meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)}>Next</button>
        </div>
      </div>
    </section>
  );
}

function ProductEditorDrawer({
  categories,
  colors,
  editorOpen,
  imageForm,
  imageUploadFile,
  productForm,
  saving,
  selectedProduct,
  sizes,
  totalStock,
  variantForm,
  onAddImage,
  onAddVariant,
  onClose,
  onDeleteImage,
  onDeleteProduct,
  onImageFileChange,
  onImageFormChange,
  onPrimaryImage,
  onProductFormChange,
  onSaveProduct,
  onToggleVariant,
  onVariantFormChange,
}: {
  categories: Category[];
  colors: Color[];
  editorOpen: boolean;
  imageForm: ProductImagePayload;
  imageUploadFile: File | null;
  productForm: ProductPayload;
  saving: boolean;
  selectedProduct: ProductDetail | null;
  sizes: Size[];
  totalStock: number;
  variantForm: ProductVariantPayload;
  onAddImage: () => void;
  onAddVariant: () => void;
  onClose: () => void;
  onDeleteImage: (imageId: number) => void;
  onDeleteProduct: () => void;
  onImageFileChange: (file: File | null) => void;
  onImageFormChange: (form: ProductImagePayload) => void;
  onPrimaryImage: (imageId: number) => void;
  onProductFormChange: (form: ProductPayload) => void;
  onSaveProduct: () => void;
  onToggleVariant: (variant: ProductVariant) => void;
  onVariantFormChange: (form: ProductVariantPayload) => void;
}) {
  return (
    <>
      {editorOpen && <button type="button" className="admin-products__drawer-backdrop" aria-label="Close editor" onClick={onClose} />}
      <aside className={`store-panel admin-products__editor ${editorOpen ? 'admin-products__editor--open' : ''}`}>
        <div className="admin-products__editor-header">
          <div>
            <h2>{selectedProduct ? 'Edit product' : 'Create product'}</h2>
            {selectedProduct && <p>{selectedProduct.variants.length} variants · {selectedProduct.images.length} images · {totalStock} stock</p>}
          </div>
          <div className="admin-products__editor-actions">
            {selectedProduct && (
              <button type="button" className="admin-products__danger" onClick={onDeleteProduct} disabled={saving}>
                <Trash2 size={16} />
                Delete product
              </button>
            )}
            <button type="button" className="admin-products__close" aria-label="Close editor" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <ProductForm categories={categories} form={productForm} saving={saving} onChange={onProductFormChange} onSubmit={onSaveProduct} />

        {selectedProduct ? (
          <>
            <ImageManager
              images={selectedProduct.images}
              imageForm={imageForm}
              imageUploadFile={imageUploadFile}
              saving={saving}
              variants={selectedProduct.variants}
              onAdd={onAddImage}
              onChange={onImageFormChange}
              onDelete={onDeleteImage}
              onFileChange={onImageFileChange}
              onPrimary={onPrimaryImage}
            />
            <VariantManager
              colors={colors}
              sizes={sizes}
              variants={selectedProduct.variants}
              variantForm={variantForm}
              saving={saving}
              onAdd={onAddVariant}
              onChange={onVariantFormChange}
              onToggle={onToggleVariant}
            />
          </>
        ) : (
          <div className="admin-products__empty">
            <Edit3 size={20} />
            Save the product first, then add images and variants.
          </div>
        )}
      </aside>
    </>
  );
}

export default function AdminProductsPage() {
  const [state, setState] = useReducer(adminProductsReducer, initialAdminProductsState);
  const categoryInitialized = useRef(false);
  const {
    products,
    meta,
    categories,
    sizes,
    colors,
    selectedProduct,
    productForm,
    imageForm,
    imageUploadFile,
    variantForm,
    searchTerm,
    categoryFilter,
    editorOpen,
    message,
    error,
    loading,
    saving,
  } = state;

  const selectedProductId = selectedProduct?.id;

  const totalStock = useMemo(
    () => selectedProduct?.variants.reduce((sum, variant) => sum + variant.stock, 0) ?? 0,
    [selectedProduct],
  );

  const loadAdminData = useCallback(async (page = state.meta.page) => {
    setState({ loading: true, error: '' });
    try {
      const [productResponse, categoryResponse, sizeResponse, colorResponse] = await Promise.all([
        productsApi.list({
          page,
          limit: state.meta.limit,
          categoryId: state.categoryFilter ? Number(state.categoryFilter) : undefined,
          search: state.searchTerm.trim() || undefined,
        }),
        productsApi.listCategories(),
        productsApi.listSizes(),
        productsApi.listColors(),
      ]);
      setState({
        products: productResponse.data.data,
        meta: productResponse.data.meta,
        categories: categoryResponse.data,
        sizes: sizeResponse.data,
        colors: colorResponse.data,
        ...(!categoryInitialized.current && categoryResponse.data[0]
          ? { productForm: { ...emptyProductForm, categoryId: categoryResponse.data[0].id } }
          : {}),
      });
      categoryInitialized.current = true;
    } catch (apiError: any) {
      setState({ error: apiError.response?.data?.message ?? 'Admin data could not be loaded.' });
    } finally {
      setState({ loading: false });
    }
  }, [state.categoryFilter, state.meta.limit, state.meta.page, state.searchTerm]);

  const selectProduct = async (productId: number) => {
    setState({ error: '' });
    try {
      const { data } = await productsApi.get(productId);
      setState({
        selectedProduct: data,
        productForm: toProductForm(data),
        imageForm: emptyImageForm,
        imageUploadFile: null,
        variantForm: emptyVariantForm,
        editorOpen: true,
      });
    } catch (apiError: any) {
      setState({ error: apiError.response?.data?.message ?? 'Product could not be loaded.' });
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  const saveProduct = async () => {
    setState({ saving: true, message: '', error: '' });
    try {
      const payload = normalizeProductForm(productForm);
      const { data } = selectedProductId
        ? await productsApi.update(selectedProductId, payload)
        : await productsApi.create(payload);
      setState({
        selectedProduct: data,
        productForm: toProductForm(data),
        editorOpen: true,
      });
      await loadAdminData();
      setState({ message: selectedProductId ? 'Product updated.' : 'Product created.' });
    } catch (apiError: any) {
      setState({ error: apiError.response?.data?.message ?? 'Product could not be saved.' });
    } finally {
      setState({ saving: false });
    }
  };

  const deleteProduct = async () => {
    if (!selectedProductId) return;
    setState({ saving: true, message: '', error: '' });
    try {
      await productsApi.remove(selectedProductId);
      setState({
        selectedProduct: null,
        productForm: { ...emptyProductForm, categoryId: categories[0]?.id ?? 0 },
        editorOpen: false,
      });
      await loadAdminData();
      setState({ message: 'Product deleted.' });
    } catch (apiError: any) {
      setState({ error: apiError.response?.data?.message ?? 'Product could not be deleted.' });
    } finally {
      setState({ saving: false });
    }
  };

  const addImage = async () => {
    if (!selectedProductId) return;
    setState({ saving: true, message: '', error: '' });
    try {
      const payload = normalizeImageForm(imageForm);
      if (imageUploadFile) {
        await productsApi.uploadImage(selectedProductId, {
          file: imageUploadFile,
          altText: payload.altText,
          sortOrder: payload.sortOrder,
          isPrimary: payload.isPrimary,
          productVariantId: payload.productVariantId,
        });
      } else {
        await productsApi.addImage(selectedProductId, payload);
      }
      await selectProduct(selectedProductId);
      await loadAdminData();
      setState({
        imageForm: emptyImageForm,
        imageUploadFile: null,
        message: 'Image added.',
      });
    } catch (apiError: any) {
      setState({ error: apiError.response?.data?.message ?? 'Image could not be saved.' });
    } finally {
      setState({ saving: false });
    }
  };

  const setPrimaryImage = async (imageId: number) => {
    if (!selectedProductId) return;
    await productsApi.updateImage(selectedProductId, imageId, { isPrimary: true });
    await selectProduct(selectedProductId);
    await loadAdminData();
  };

  const deleteImage = async (imageId: number) => {
    if (!selectedProductId) return;
    await productsApi.removeImage(selectedProductId, imageId);
    await selectProduct(selectedProductId);
    await loadAdminData();
  };

  const addVariant = async () => {
    if (!selectedProductId) return;
    setState({ saving: true, message: '', error: '' });
    try {
      await productsApi.createVariant(selectedProductId, normalizeVariantForm(variantForm));
      await selectProduct(selectedProductId);
      await loadAdminData();
      setState({ variantForm: emptyVariantForm, message: 'Variant added.' });
    } catch (apiError: any) {
      setState({ error: apiError.response?.data?.message ?? 'Variant could not be saved.' });
    } finally {
      setState({ saving: false });
    }
  };

  const toggleVariant = async (variant: ProductVariant) => {
    if (!selectedProductId) return;
    await productsApi.updateVariant(selectedProductId, variant.id, { isActive: !variant.isActive });
    await selectProduct(selectedProductId);
    await loadAdminData();
  };

  const changeSearch = (nextSearchTerm: string) => {
    setState({ searchTerm: nextSearchTerm, meta: { ...meta, page: 1 } });
  };

  const changeCategoryFilter = (nextCategoryFilter: string) => {
    setState({ categoryFilter: nextCategoryFilter, meta: { ...meta, page: 1 } });
  };

  const changeLimit = (nextLimit: number) => {
    setState({ meta: { ...meta, page: 1, limit: nextLimit || 10 } });
  };

  const startNewProduct = () => {
    setState({
      selectedProduct: null,
      productForm: { ...emptyProductForm, categoryId: categories[0]?.id ?? 0 },
      imageForm: emptyImageForm,
      imageUploadFile: null,
      variantForm: emptyVariantForm,
      editorOpen: true,
      message: '',
      error: '',
    });
  };

  const closeEditor = () => {
    setState({ editorOpen: false });
  };

  if (loading) {
    return (
      <main className="store-page admin-products">
        <div className="store-loader" />
      </main>
    );
  }

  return (
    <main className="store-page admin-products">
      <div className="store-container admin-products__container">
        <header className="admin-products__header">
          <div>
            <p className="store-kicker">Manager tools</p>
            <h1 className="store-title">Product admin</h1>
          </div>
          <div className="admin-products__header-actions">
            <button type="button" className="store-button store-button--secondary" onClick={() => loadAdminData()}><RefreshCw size={16} /> Refresh</button>
            <button type="button" className="store-button" onClick={startNewProduct}><Plus size={16} /> New product</button>
          </div>
        </header>

        {(message || error) && <p className={error ? 'admin-products__notice admin-products__notice--error' : 'admin-products__notice'}>{error || message}</p>}

        <ProductTable
          categories={categories}
          categoryFilter={categoryFilter}
          meta={meta}
          products={products}
          searchTerm={searchTerm}
          selectedProductId={selectedProductId}
          onCategoryFilterChange={changeCategoryFilter}
          onLimitChange={changeLimit}
          onPageChange={(nextPage) => setState({ meta: { ...meta, page: nextPage } })}
          onSearchChange={changeSearch}
          onSelectProduct={selectProduct}
        />

        <ProductEditorDrawer
          categories={categories}
          colors={colors}
          editorOpen={editorOpen}
          imageForm={imageForm}
          imageUploadFile={imageUploadFile}
          productForm={productForm}
          saving={saving}
          selectedProduct={selectedProduct}
          sizes={sizes}
          totalStock={totalStock}
          variantForm={variantForm}
          onAddImage={addImage}
          onAddVariant={addVariant}
          onClose={closeEditor}
          onDeleteImage={deleteImage}
          onDeleteProduct={deleteProduct}
          onImageFileChange={(nextImageUploadFile) => setState({ imageUploadFile: nextImageUploadFile })}
          onImageFormChange={(nextImageForm) => setState({ imageForm: nextImageForm })}
          onPrimaryImage={setPrimaryImage}
          onProductFormChange={(nextProductForm) => setState({ productForm: nextProductForm })}
          onSaveProduct={saveProduct}
          onToggleVariant={toggleVariant}
          onVariantFormChange={(nextVariantForm) => setState({ variantForm: nextVariantForm })}
        />
      </div>
    </main>
  );
}
