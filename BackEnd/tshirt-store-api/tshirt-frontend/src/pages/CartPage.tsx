import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Shirt, ShoppingBag, Trash2 } from 'lucide-react';
import { cartApi } from '../api/cart';
import { Cart } from '../types';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    void loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
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
      window.dispatchEvent(new Event('cart:updated'));
    } catch { /* ignore */ }
  };

  const removeItem = async (itemId: number) => {
    setRemovingId(itemId);
    try {
      await cartApi.removeItem(itemId);
      await loadCart();
      window.dispatchEvent(new Event('cart:updated'));
    } catch { /* ignore */ }
    setRemovingId(null);
  };

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  if (loading) {
    return (
      <main className="cart-page">
        <div className="store-loader" />
      </main>
    );
  }

  return (
    <main className="cart-page">
      <section className="cart-page__header store-container">
        <p className="store-kicker">Shopping bag</p>
        <h1 className="cart-page__title store-title">Your bag</h1>
        <p className="cart-page__subtitle">{itemCount} {itemCount === 1 ? 'item' : 'items'} ready for checkout</p>
      </section>

      {!cart || cart.items.length === 0 ? (
        <section className="cart-page__empty store-container">
          <div className="cart-page__empty-panel store-panel">
            <ShoppingBag size={52} strokeWidth={1.3} />
            <h2>Your bag is empty</h2>
            <p>Browse the collection and add something before checkout.</p>
            <button className="store-button cart-page__shop-button" onClick={() => navigate('/')}>
              Continue shopping
            </button>
          </div>
        </section>
      ) : (
        <section className="cart-page__content store-container">
          <div className="cart-page__items">
            {cart.items.map((item) => (
              <article key={item.id} className={`cart-page__item store-panel ${removingId === item.id ? 'cart-page__item--removing' : ''}`}>
                <div className="cart-page__media">
                  {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <Shirt size={38} strokeWidth={1.2} />}
                </div>

                <div className="cart-page__item-info">
                  <h2>{item.productName}</h2>
                  <p>{item.sizeName} / {item.colorName}</p>
                  <span>{item.skuCode}</span>
                </div>

                <div className="cart-page__quantity">
                  <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} aria-label={`Decrease quantity for ${item.productName}`}><Minus size={14} /></button>
                  <strong>{item.quantity}</strong>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase quantity for ${item.productName}`}><Plus size={14} /></button>
                </div>

                <strong className="cart-page__price">${item.lineTotal.toFixed(2)}</strong>

                <button className="cart-page__remove" onClick={() => removeItem(item.id)} aria-label="Remove item">
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>

          <aside className="cart-page__summary store-panel">
            <h2>Summary</h2>
            <div className="cart-page__summary-row">
              <span>Subtotal</span>
              <strong>${cart.totalAmount.toFixed(2)}</strong>
            </div>
            <div className="cart-page__summary-row">
              <span>Shipping</span>
              <strong>Calculated next</strong>
            </div>
            <div className="cart-page__summary-total">
              <span>Total</span>
              <strong>${cart.totalAmount.toFixed(2)}</strong>
            </div>
            <Link className="store-button cart-page__checkout-button" to="/checkout">
              Checkout
            </Link>
          </aside>
        </section>
      )}
    </main>
  );
}
