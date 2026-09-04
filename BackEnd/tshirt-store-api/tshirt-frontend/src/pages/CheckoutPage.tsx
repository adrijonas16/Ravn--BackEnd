import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard, MapPin, Plus, Shirt } from 'lucide-react';
import { addressesApi } from '../api/addresses';
import { cartApi } from '../api/cart';
import { ordersApi } from '../api/orders';
import { paymentsApi } from '../api/payments';
import { promoCodesApi, PromoPreview } from '../api/promoCodes';
import { useAuth } from '../context/useAuth';
import { Address, Cart } from '../types';

const emptyAddressForm = {
  label: 'Home',
  recipientName: '',
  recipientPhone: '',
  line1: '',
  line2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  countryCode: 'US',
  isDefault: true,
};

export default function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoPreview | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadCheckout();
  }, []);

  const loadCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: cartData } = await cartApi.get();
      setCart(cartData);
      setPendingOrderId(null);
      setAppliedPromo(null);
      const { data: addressData } = await addressesApi.list();
      setAddresses(addressData);
      const defaultAddress = addressData.find((address) => address.isDefault) ?? addressData[0];
      setSelectedAddressId(defaultAddress?.id ?? null);
      setShowAddressForm(addressData.length === 0);
    } catch (apiError: any) {
      const message = apiError.response?.data?.message ?? 'Checkout could not be loaded.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  const saveAddress = async () => {
    setSavingAddress(true);
    setError(null);
    try {
      const payload = {
        ...addressForm,
        label: addressForm.label.trim() || undefined,
        recipientName: addressForm.recipientName.trim(),
        recipientPhone: addressForm.recipientPhone.trim(),
        line1: addressForm.line1.trim(),
        line2: addressForm.line2.trim() || undefined,
        city: addressForm.city.trim(),
        stateRegion: addressForm.stateRegion.trim() || undefined,
        postalCode: addressForm.postalCode.trim() || undefined,
        countryCode: addressForm.countryCode.trim().toUpperCase(),
      };
      const { data } = await addressesApi.create(payload);
      setAddresses((current) => [
        data,
        ...(data.isDefault ? current.map((address) => ({ ...address, isDefault: false })) : current),
      ]);
      setSelectedAddressId(data.id);
      setAddressForm(emptyAddressForm);
      setShowAddressForm(false);
    } catch (apiError: any) {
      const message = apiError.response?.data?.message ?? 'Address could not be saved.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setSavingAddress(false);
    }
  };

  const updatePromoCode = (value: string) => {
    setPromoCode(value.toUpperCase());
    setAppliedPromo(null);
  };

  const applyPromoCode = async () => {
    const normalizedCode = promoCode.trim().toUpperCase();
    if (!normalizedCode) {
      setAppliedPromo(null);
      setError('Enter a promo code first.');
      return;
    }

    setApplyingPromo(true);
    setError(null);
    try {
      const { data } = await promoCodesApi.preview(normalizedCode);
      setAppliedPromo(data);
      setPromoCode(data.code);
    } catch (apiError: any) {
      const message = apiError.response?.data?.message ?? 'Promo code could not be applied.';
      setAppliedPromo(null);
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setApplyingPromo(false);
    }
  };

  const payNow = async () => {
    const normalizedPromoCode = promoCode.trim().toUpperCase();
    if (normalizedPromoCode && appliedPromo?.code !== normalizedPromoCode) {
      setError('Apply the promo code before starting payment.');
      return;
    }

    const address = addresses.find((item) => item.id === selectedAddressId);
    if (!address) {
      setShowAddressForm(true);
      setError('Add a shipping address before checkout.');
      return;
    }

    setPaying(true);
    setError(null);
    try {
      let orderId: number;
      if (pendingOrderId === null) {
        const { data: order } = await ordersApi.create(
          address.id,
          appliedPromo?.code,
        );
        orderId = order.id;
        setPendingOrderId(order.id);
      } else {
        orderId = pendingOrderId;
      }

      const { data: payment } = await paymentsApi.createOrderPaymentLink(orderId);
      window.dispatchEvent(new Event('cart:updated'));
      if (payment.demo) {
        setPendingOrderId(null);
        navigate('/orders');
        return;
      }
      setPendingOrderId(null);
      window.location.href = payment.paymentLinkUrl;
    } catch (apiError: any) {
      const message = apiError.response?.data?.message ?? 'Payment could not be started.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <main className="checkout-page">
        <div className="store-loader" />
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="checkout-page">
        <section className="checkout-page__empty store-panel">
          <h1 className="store-title">Your bag is empty</h1>
          <Link className="store-button" to="/">Return to shop</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-page__shell">
        <section className="checkout-page__main">
          <Link className="checkout-page__back-link" to="/cart">
            <ChevronLeft size={16} />
            Return to bag
          </Link>

          <header className="checkout-page__header">
            <p className="store-kicker">Secure checkout</p>
            <h1 className="store-title">Complete your order</h1>
          </header>

          {error && <p className="checkout-page__error">{error}</p>}

          <section className="checkout-page__section store-panel">
            <div className="checkout-page__section-header">
              <h2>Contact</h2>
              <span>{user?.email}</span>
            </div>
          </section>

          <section className="checkout-page__section store-panel">
            <div className="checkout-page__section-header">
              <h2>Delivery</h2>
              {addresses.length > 0 && (
                <button className="checkout-page__link-button" onClick={() => setShowAddressForm((current) => !current)}>
                  <Plus size={15} />
                  Add address
                </button>
              )}
            </div>

            {addresses.length > 0 && (
              <div className="checkout-page__address-list">
                {addresses.map((address) => (
                  <label key={address.id} className={`checkout-page__address ${selectedAddressId === address.id ? 'checkout-page__address--selected' : ''}`}>
                    <input
                      type="radio"
                      name="shippingAddress"
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                    />
                    <MapPin size={18} />
                    <span>
                      <strong>{address.label ?? 'Address'} · {address.recipientName}</strong>
                      <small>{address.line1}, {address.city}{address.stateRegion ? `, ${address.stateRegion}` : ''} {address.postalCode ?? ''}</small>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {showAddressForm && (
              <div className="checkout-page__form-grid">
                <input value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} placeholder="Label" aria-label="Address label" />
                <input value={addressForm.recipientName} onChange={(event) => setAddressForm({ ...addressForm, recipientName: event.target.value })} placeholder="Recipient name" aria-label="Recipient name" />
                <input value={addressForm.recipientPhone} onChange={(event) => setAddressForm({ ...addressForm, recipientPhone: event.target.value })} placeholder="Phone" aria-label="Recipient phone" />
                <input value={addressForm.line1} onChange={(event) => setAddressForm({ ...addressForm, line1: event.target.value })} placeholder="Address" aria-label="Street address" />
                <input value={addressForm.line2} onChange={(event) => setAddressForm({ ...addressForm, line2: event.target.value })} placeholder="Apartment, suite, etc." aria-label="Apartment or suite" />
                <input value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} placeholder="City" aria-label="City" />
                <input value={addressForm.stateRegion} onChange={(event) => setAddressForm({ ...addressForm, stateRegion: event.target.value })} placeholder="State" aria-label="State" />
                <input value={addressForm.postalCode} onChange={(event) => setAddressForm({ ...addressForm, postalCode: event.target.value })} placeholder="Postal code" aria-label="Postal code" />
                <input value={addressForm.countryCode} maxLength={2} onChange={(event) => setAddressForm({ ...addressForm, countryCode: event.target.value.slice(0, 2).toUpperCase() })} placeholder="US" aria-label="Country code" />
                <button className="store-button checkout-page__save-address" disabled={savingAddress} onClick={saveAddress}>
                  {savingAddress ? 'Saving...' : 'Save address'}
                </button>
              </div>
            )}
          </section>

          <section className="checkout-page__section store-panel">
            <div className="checkout-page__section-header">
              <h2>Payment</h2>
              <span>Stripe payment link</span>
            </div>
            <div className="checkout-page__promo">
              <input
                value={promoCode}
                onChange={(event) => updatePromoCode(event.target.value)}
                placeholder="Promo code"
                aria-label="Promo code"
              />
              <button
                className="store-button store-button--secondary checkout-page__promo-button"
                disabled={applyingPromo || !promoCode.trim()}
                onClick={applyPromoCode}
              >
                {applyingPromo ? 'Applying...' : 'Apply code'}
              </button>
            </div>
            {appliedPromo && (
              <div className="checkout-page__discount-note">
                <strong>{appliedPromo.code}</strong>
                <span>Discount -${appliedPromo.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <button className="store-button checkout-page__pay-button" disabled={paying} onClick={payNow}>
              <CreditCard size={18} />
              {paying ? 'Redirecting...' : 'Pay now'}
            </button>
          </section>
        </section>

        <aside className="checkout-page__summary">
          <div className="checkout-page__summary-inner">
            <h2>Order summary</h2>
            <div className="checkout-page__summary-items">
              {cart.items.map((item) => (
                <article key={item.id} className="checkout-page__summary-item">
                  <div className="checkout-page__summary-media">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <Shirt size={24} />}
                    <span>{item.quantity}</span>
                  </div>
                  <div>
                    <strong>{item.productName}</strong>
                    <small>{item.sizeName} / {item.colorName}</small>
                  </div>
                  <b>${item.lineTotal.toFixed(2)}</b>
                </article>
              ))}
            </div>
            <div className="checkout-page__total-row">
              <span>Subtotal</span>
              <strong>${cart.totalAmount.toFixed(2)}</strong>
            </div>
            {appliedPromo && (
              <div className="checkout-page__total-row checkout-page__total-row--discount">
                <span>Discount</span>
                <strong>-${appliedPromo.discountAmount.toFixed(2)}</strong>
              </div>
            )}
            <div className="checkout-page__total-row">
              <span>Shipping</span>
              <strong>Free</strong>
            </div>
            <div className="checkout-page__grand-total">
              <span>Total</span>
              <strong>${(appliedPromo?.totalAmount ?? cart.totalAmount).toFixed(2)}</strong>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
