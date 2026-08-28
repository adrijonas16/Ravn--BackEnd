import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Save, TicketPercent } from 'lucide-react';
import { promoCodesApi, PromoCodePayload } from '../api/promoCodes';
import { PromoCode } from '../types';

const emptyPromoForm: PromoCodePayload = {
  code: '',
  discountType: 'percentage',
  discountValue: 10,
  expiresAt: '',
  usageLimit: 100,
  minimumPurchaseAmount: 0,
  isActive: true,
};

function toDateTimeLocal(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  return new Date(value).toISOString();
}

function formatDiscount(promo: PromoCode) {
  if (promo.discountType === 'percentage') return `${promo.discountValue}%`;
  return `$${promo.discountValue.toFixed(2)}`;
}

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [form, setForm] = useState<PromoCodePayload>(emptyPromoForm);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadPromos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await promoCodesApi.list({ page, limit: pageSize });
      setPromos(data.data);
      setTotalItems(data.meta.totalItems);
      setTotalPages(Math.max(data.meta.totalPages, 1));
    } catch (apiError: any) {
      const apiMessage = apiError.response?.data?.message ?? 'Promo codes could not be loaded.';
      setError(Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void loadPromos();
  }, [loadPromos]);

  const createPromo = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await promoCodesApi.create({
        ...form,
        code: form.code.trim().toUpperCase(),
        discountValue: Number(form.discountValue),
        usageLimit: Number(form.usageLimit),
        minimumPurchaseAmount: Number(form.minimumPurchaseAmount ?? 0),
        expiresAt: fromDateTimeLocal(form.expiresAt),
      });
      setForm(emptyPromoForm);
      setPage(1);
      setMessage('Promo code created.');
      await loadPromos();
    } catch (apiError: any) {
      const apiMessage = apiError.response?.data?.message ?? 'Promo code could not be created.';
      setError(Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage);
    } finally {
      setSaving(false);
    }
  };

  const togglePromo = async (promo: PromoCode) => {
    setError('');
    setMessage('');
    try {
      await promoCodesApi.update(promo.id, { isActive: !promo.isActive });
      setMessage(`${promo.code} ${promo.isActive ? 'disabled' : 'enabled'}.`);
      await loadPromos();
    } catch (apiError: any) {
      const apiMessage = apiError.response?.data?.message ?? 'Promo code could not be updated.';
      setError(Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage);
    }
  };

  const updatePromo = async (promo: PromoCode) => {
    setError('');
    setMessage('');
    try {
      await promoCodesApi.update(promo.id, {
        expiresAt: promo.expiresAt,
        usageLimit: promo.usageLimit,
      });
      setMessage(`${promo.code} updated.`);
      await loadPromos();
    } catch (apiError: any) {
      const apiMessage = apiError.response?.data?.message ?? 'Promo code could not be updated.';
      setError(Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage);
    }
  };

  return (
    <main className="admin-promos store-page">
      <section className="admin-promos__container store-container">
        <header className="admin-promos__header">
          <div>
            <p className="store-kicker">Manager tools</p>
            <h1 className="store-title">Promotions</h1>
            <p className="store-muted">
              Promo codes apply to the full order when the cart meets the minimum purchase.
            </p>
          </div>
          <button className="store-button" onClick={() => void loadPromos()}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        {message && <p className="admin-products__notice">{message}</p>}
        {error && <p className="admin-products__notice admin-products__notice--error">{error}</p>}

        <section className="admin-promos__layout">
          <form className="admin-promos__form store-panel" onSubmit={createPromo}>
            <div className="admin-promos__section-title">
              <TicketPercent size={18} />
              <h2>Create promo</h2>
            </div>
            <label>
              <span>Code</span>
              <input
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
                placeholder="SUMMER20"
                required
              />
            </label>
            <label>
              <span>Discount type</span>
              <select
                value={form.discountType}
                onChange={(event) => setForm({ ...form, discountType: event.target.value as PromoCodePayload['discountType'] })}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed amount</option>
              </select>
            </label>
            <label>
              <span>Discount value</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.discountValue}
                onChange={(event) => setForm({ ...form, discountValue: Number(event.target.value) })}
                required
              />
            </label>
            <label>
              <span>Minimum purchase</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minimumPurchaseAmount ?? 0}
                onChange={(event) => setForm({ ...form, minimumPurchaseAmount: Number(event.target.value) })}
              />
            </label>
            <label>
              <span>Usage limit</span>
              <input
                type="number"
                min="1"
                value={form.usageLimit}
                onChange={(event) => setForm({ ...form, usageLimit: Number(event.target.value) })}
                required
              />
            </label>
            <label>
              <span>Expires at</span>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
                required
              />
            </label>
            <label className="admin-promos__check">
              <input
                type="checkbox"
                checked={!!form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              />
              Active
            </label>
            <button className="store-button admin-promos__submit" disabled={saving}>
              <Plus size={16} />
              {saving ? 'Creating...' : 'Create promo'}
            </button>
          </form>

          <section className="admin-promos__table-panel store-panel">
            <div className="admin-promos__table-toolbar">
              <strong>{totalItems} promo codes</strong>
              <label>
                Per page
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-promos__table-wrap">
              <table className="admin-promos__table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Minimum</th>
                    <th>Usage</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7}>Loading promotions...</td></tr>
                  ) : promos.length === 0 ? (
                    <tr><td colSpan={7}>No promo codes yet.</td></tr>
                  ) : promos.map((promo) => (
                    <tr key={promo.id}>
                      <td><strong>{promo.code}</strong></td>
                      <td>{formatDiscount(promo)}</td>
                      <td>{promo.minimumPurchaseAmount ? `$${promo.minimumPurchaseAmount.toFixed(2)}` : 'None'}</td>
                      <td>
                        <div className="admin-promos__usage">
                          <span>{promo.usageCount} /</span>
                          <input
                            type="number"
                            min={Math.max(1, promo.usageCount)}
                            value={promo.usageLimit}
                            onChange={(event) => {
                              const nextUsageLimit = Number(event.target.value);
                              setPromos((current) => current.map((item) => (
                                item.id === promo.id ? { ...item, usageLimit: nextUsageLimit } : item
                              )));
                            }}
                          />
                        </div>
                      </td>
                      <td>
                        <input
                          type="datetime-local"
                          value={toDateTimeLocal(promo.expiresAt)}
                          onChange={(event) => {
                            const nextExpiresAt = fromDateTimeLocal(event.target.value);
                            setPromos((current) => current.map((item) => (
                              item.id === promo.id ? { ...item, expiresAt: nextExpiresAt } : item
                            )));
                          }}
                        />
                      </td>
                      <td>
                        <span className={`admin-products__status ${promo.isActive ? 'admin-products__status--active' : 'admin-products__status--disabled'}`}>
                          {promo.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-promos__actions">
                          <button type="button" onClick={() => void updatePromo(promo)}>
                            <Save size={14} />
                            Save
                          </button>
                          <button type="button" onClick={() => void togglePromo(promo)}>
                            {promo.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-promos__pagination">
              <span>Page {page} of {totalPages}</span>
              <div>
                <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}
