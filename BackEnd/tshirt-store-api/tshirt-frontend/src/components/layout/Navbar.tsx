import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Heart, Menu, Moon, Package, Settings, ShoppingBag, Shirt, Sun, TicketPercent, Trash2, User, X } from 'lucide-react';
import { authApi } from '../../api/auth';
import { cartApi } from '../../api/cart';
import { notificationsApi, NotificationItem } from '../../api/notifications';
import { useAuth } from '../../context/useAuth';
import { Cart } from '../../types';
import { AUTH_REFRESH_TOKEN_KEY } from '../../utils/authStorage';

const NOTIFICATION_LABELS: Record<string, string> = {
  low_stock: 'Low stock alert',
  order_paid: 'Order paid',
  order_processing: 'Order processing',
  order_shipped: 'Order shipped',
  order_delivered: 'Order delivered',
  order_cancelled: 'Order cancelled',
};

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('store-theme') ?? 'light');
  const location = useLocation();
  const navigate = useNavigate();
  const canShop = user?.role === 'client';

  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('store-theme', theme);
  }, [theme]);

  const loadCart = useCallback(() => {
    if (!isAuthenticated || !canShop) {
      setCart(null);
      return;
    }
    cartApi.get()
      .then(({ data }) => {
      setCart(data);
    })
      .catch(() => {});
  }, [canShop, isAuthenticated]);

  const loadNotifications = useCallback(() => {
    if (!isAuthenticated) return;
    notificationsApi.list()
      .then(({ data }) => {
      setNotifications(data);
    })
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    setMobileOpen(false);
    loadCart();
    loadNotifications();
  }, [location.pathname, loadCart, loadNotifications]);

  useEffect(() => {
    const onCartUpdated = () => {
      loadCart();
      setCartOpen(true);
    };
    window.addEventListener('cart:updated', onCartUpdated);
    return () => window.removeEventListener('cart:updated', onCartUpdated);
  }, [loadCart]);

  const removeItem = async (itemId: number) => {
    try {
      await cartApi.removeItem(itemId);
      loadCart();
    } catch { /* ignore */ }
  };

  const handleLogout = async () => {
    try {
      await authApi.signOut(localStorage.getItem(AUTH_REFRESH_TOKEN_KEY) ?? undefined);
    } catch { /* ignore */ }
    logout();
    setCart(null);
    navigate('/login');
  };

  const goToCheckout = async () => {
    if (!canShop) {
      setCartOpen(false);
      navigate('/orders');
      return;
    }
    try {
      const { data } = await cartApi.get();
      setCart(data);
      if (data.items.length === 0) return;
      setCartOpen(false);
      navigate('/checkout');
    } catch { /* ignore */ }
  };

  const navLinkClass = (path: string) => `store-nav__link ${location.pathname === path ? 'store-nav__link--active' : ''}`;

  return (
    <>
      <nav className="store-nav">
        <div className="store-nav__inner store-container">
          <Link to="/" className="store-nav__brand">
            <span className="store-nav__brand-mark"><Shirt size={20} /></span>
            ThreadVault
          </Link>

          <div className="store-nav__links">
            <Link to="/" className={navLinkClass('/')}>Shop</Link>
            {isAuthenticated && <Link to="/saved" className={navLinkClass('/saved')}><Heart size={15} /> Saved</Link>}
            {isAuthenticated && <Link to="/orders" className={navLinkClass('/orders')}><Package size={15} /> Orders</Link>}
            {user?.role === 'manager' && <Link to="/admin/products" className={navLinkClass('/admin/products')}><Settings size={15} /> Products</Link>}
            {user?.role === 'manager' && <Link to="/admin/promos" className={navLinkClass('/admin/promos')}><TicketPercent size={15} /> Promos</Link>}
          </div>

          <div className="store-nav__actions">
            <button
              className="store-nav__icon-button"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              aria-label={theme === 'dark' ? 'Use light mode' : 'Use dark mode'}
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            {isAuthenticated ? (
              <>
                <button className="store-nav__icon-button" onClick={() => { setNotificationsOpen(true); setCartOpen(false); loadNotifications(); }} aria-label="Notifications">
                  <Bell size={19} />
                  {notifications.length > 0 && <span className="store-nav__badge">{notifications.length}</span>}
                </button>
                {canShop && (
                  <button className="store-nav__icon-button" onClick={() => { setCartOpen(true); setNotificationsOpen(false); loadCart(); }} aria-label="Cart">
                    <ShoppingBag size={19} />
                    {cartCount > 0 && <span className="store-nav__badge">{cartCount}</span>}
                  </button>
                )}
                <Link to="/profile" className={navLinkClass('/profile')}><User size={15} /> {user?.firstName}</Link>
                <button className="store-nav__signout" onClick={handleLogout}>Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" className={navLinkClass('/login')}>Sign in</Link>
                <Link to="/register" className="store-nav__cta">Create account</Link>
              </>
            )}
          </div>

          <button className="store-nav__mobile-button" onClick={() => setMobileOpen((current) => !current)} aria-label="Toggle navigation">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="store-nav__mobile-panel">
          <Link to="/" className={navLinkClass('/')}>Shop</Link>
          {isAuthenticated ? (
            <>
              <Link to="/orders" className={navLinkClass('/orders')}>Orders</Link>
              <Link to="/saved" className={navLinkClass('/saved')}>Saved</Link>
              {user?.role === 'manager' && <Link to="/admin/products" className={navLinkClass('/admin/products')}>Products</Link>}
              {user?.role === 'manager' && <Link to="/admin/promos" className={navLinkClass('/admin/promos')}>Promos</Link>}
              <Link to="/profile" className={navLinkClass('/profile')}>Profile</Link>
              <button className="store-nav__signout" onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className={navLinkClass('/login')}>Sign in</Link>
              <Link to="/register" className={navLinkClass('/register')}>Create account</Link>
            </>
          )}
        </div>
      )}

      {(cartOpen || notificationsOpen) && <button className="store-drawer__backdrop" onClick={() => { setCartOpen(false); setNotificationsOpen(false); }} aria-label="Close panel" />}

      {canShop && <aside className={`store-drawer ${cartOpen ? 'store-drawer--open' : ''}`}>
        <div className="store-drawer__header">
          <h2>Your bag</h2>
          <button onClick={() => setCartOpen(false)} aria-label="Close bag"><X size={18} /></button>
        </div>
        {!cart || cart.items.length === 0 ? (
          <p className="store-drawer__empty">Your bag is empty.</p>
        ) : (
          <>
            <div className="store-drawer__items">
              {cart.items.map((item) => (
                <article className="store-drawer__item" key={item.id}>
                  <div className="store-drawer__media">{item.imageUrl ? <img src={item.imageUrl} alt="" /> : <Shirt size={24} />}</div>
                  <div>
                    <strong>{item.productName}</strong>
                    <small>{item.sizeName} / {item.colorName} · Qty {item.quantity}</small>
                    <b>${item.lineTotal.toFixed(2)}</b>
                  </div>
                  <button onClick={() => removeItem(item.id)} aria-label="Remove item"><Trash2 size={15} /></button>
                </article>
              ))}
            </div>
            <div className="store-drawer__footer">
              <div><span>Total</span><strong>${cart.totalAmount.toFixed(2)}</strong></div>
              <button className="store-button" onClick={goToCheckout}>Pay now</button>
              <Link className="store-button store-button--secondary" to="/cart" onClick={() => setCartOpen(false)}>View bag</Link>
            </div>
          </>
        )}
      </aside>}

      <aside className={`store-drawer ${notificationsOpen ? 'store-drawer--open' : ''}`}>
        <div className="store-drawer__header">
          <h2>Notifications</h2>
          <button onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={18} /></button>
        </div>
        {notifications.length === 0 ? (
          <p className="store-drawer__empty">No notifications yet.</p>
        ) : (
          <div className="store-drawer__items">
            {notifications.map((notification) => (
              <article className="store-drawer__notification" key={notification.id}>
                <strong>{NOTIFICATION_LABELS[notification.type] ?? notification.type.replaceAll('_', ' ')}</strong>
                <small>{new Date(notification.createdAt).toLocaleString()}</small>
                {notification.product && <p>{notification.product.name}</p>}
              </article>
            ))}
          </div>
        )}
      </aside>
    </>
  );
}
