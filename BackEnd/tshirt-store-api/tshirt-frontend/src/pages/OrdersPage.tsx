import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, CreditCard, Filter, MapPin, Package, Route, ShieldCheck, Truck, X } from 'lucide-react';
import { ordersApi } from '../api/orders';
import { paymentsApi } from '../api/payments';
import { useAuth } from '../context/useAuth';
import { OrderSummary } from '../types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Package }> = {
  pending: { label: 'Pending', color: '#c5a253', icon: Clock },
  paid: { label: 'Paid', color: '#00a676', icon: Check },
  processing: { label: 'Processing', color: '#2457ff', icon: Package },
  shipped: { label: 'Shipped', color: '#2457ff', icon: Truck },
  delivered: { label: 'Delivered', color: '#00a676', icon: MapPin },
  cancelled: { label: 'Cancelled', color: '#d63447', icon: X },
};

const ROLE_VIEW = {
  manager: {
    title: 'Order Control',
    subtitle: 'Review customer orders and move paid orders through fulfillment.',
    badge: 'Manager view',
    empty: 'Customer orders will appear here.',
    icon: ShieldCheck,
  },
  delivery_person: {
    title: 'Delivery Queue',
    subtitle: 'Track assigned shipments and mark deliveries complete.',
    badge: 'Delivery view',
    empty: 'Assigned deliveries will appear here.',
    icon: Route,
  },
  client: {
    title: 'My Orders',
    subtitle: 'Track purchases, payment status, shipping, and delivery.',
    badge: 'Customer view',
    empty: 'Your order history will appear here.',
    icon: Package,
  },
};

const LOADING_ROWS = ['order-loading-1', 'order-loading-2', 'order-loading-3'];

function getNextStatus(status: string, role?: string) {
  if (role === 'manager') {
    if (status === 'paid') return 'processing';
    if (status === 'processing') return 'shipped';
  }
  if (role === 'delivery_person' && status === 'shipped') return 'delivered';
  return null;
}

function formatAddress(order: OrderSummary) {
  const address = order.shippingAddress;
  if (!address) return 'No shipping address';
  return `${address.line1}${address.line2 ? `, ${address.line2}` : ''}, ${address.city}${address.stateRegion ? `, ${address.stateRegion}` : ''} ${address.postalCode ?? ''}, ${address.countryCode}`;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null);
  const roleView = ROLE_VIEW[user?.role ?? 'client'];
  const HeaderIcon = roleView.icon;

  const statusCounts = useMemo(
    () => orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.currentStatus] = (acc[order.currentStatus] ?? 0) + 1;
      return acc;
    }, {}),
    [orders],
  );

  const actionableCount = useMemo(
    () => orders.filter((order) => getNextStatus(order.currentStatus, user?.role)).length,
    [orders, user?.role],
  );

  const loadOrders = useCallback(() => {
    setLoading(true);
    ordersApi.list({ page, limit: pageSize, status: statusFilter || undefined })
      .then(({ data }) => {
        setOrders(data.data);
        setTotalPages(Math.max(data.meta.totalPages, 1));
        setTotalItems(data.meta.totalItems);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusUpdate = async (orderId: number, status: string) => {
    try {
      await ordersApi.updateStatus(orderId, status, `Moved to ${status} from the web app`);
      loadOrders();
    } catch (error: any) {
      const message = error.response?.data?.message ?? 'Order status could not be updated.';
      alert(Array.isArray(message) ? message.join(', ') : message);
    }
  };

  const handleCancel = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await ordersApi.cancel(orderId, 'Cancelled by user');
      loadOrders();
    } catch (error: any) {
      const message = error.response?.data?.message ?? 'Order could not be cancelled.';
      alert(Array.isArray(message) ? message.join(', ') : message);
    }
  };

  const handlePay = async (orderId: number) => {
    setPayingOrderId(orderId);
    try {
      const { data } = await paymentsApi.createOrderPaymentLink(orderId);
      if (data.demo) {
        loadOrders();
        return;
      }
      window.location.href = data.paymentLinkUrl;
    } catch (error: any) {
      const message = error.response?.data?.message ?? 'Payment could not be started.';
      alert(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setPayingOrderId(null);
    }
  };

  return (
    <main className="orders-page">
      <section className="orders-page__header store-container">
        <div>
          <p className="store-kicker">{roleView.badge}</p>
          <h1 className="orders-page__title store-title">{roleView.title}</h1>
          <p className="orders-page__subtitle">{roleView.subtitle}</p>
        </div>
        <div className="orders-page__role-mark">
          <HeaderIcon size={28} />
        </div>
      </section>

      {user?.role !== 'client' && (
        <section className="orders-page__metrics store-container">
          <article className="orders-page__metric store-panel">
            <span>Total results</span>
            <strong>{totalItems}</strong>
          </article>
          <article className="orders-page__metric store-panel">
            <span>Needs action</span>
            <strong>{actionableCount}</strong>
          </article>
          <article className="orders-page__metric store-panel">
            <span>{user?.role === 'manager' ? 'Paid' : 'Shipped'}</span>
            <strong>{user?.role === 'manager' ? (statusCounts.paid ?? 0) : (statusCounts.shipped ?? 0)}</strong>
          </article>
        </section>
      )}

      <section className="orders-page__filters store-container">
        <div className="orders-page__filter-bar store-panel">
          <div className="orders-page__status-filters">
            <Filter size={16} />
            <button className={!statusFilter ? 'orders-page__filter orders-page__filter--active' : 'orders-page__filter'} onClick={() => { setStatusFilter(''); setPage(1); }}>
              All
            </button>
            {Object.entries(STATUS_CONFIG).map(([key, status]) => (
              <button
                key={key}
                className={statusFilter === key ? 'orders-page__filter orders-page__filter--active' : 'orders-page__filter'}
                onClick={() => { setStatusFilter(key); setPage(1); }}
                style={statusFilter === key ? { borderColor: status.color, color: status.color } : undefined}
              >
                {status.label}
              </button>
            ))}
          </div>
          <label className="orders-page__page-size">
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
      </section>

      <section className="orders-page__content store-container">
        {loading ? (
          <div className="orders-page__list">
            {LOADING_ROWS.map((row) => <div key={row} className="orders-page__skeleton store-panel" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-page__empty store-panel">
            <Package size={48} strokeWidth={1.3} />
            <h2>No orders yet</h2>
            <p>{roleView.empty}</p>
          </div>
        ) : (
          <div className="orders-page__list">
            {orders.map((order) => {
              const status = STATUS_CONFIG[order.currentStatus] ?? STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              const nextStatus = getNextStatus(order.currentStatus, user?.role);
              const nextStatusConfig = nextStatus ? STATUS_CONFIG[nextStatus] : null;
              const NextStatusIcon = nextStatusConfig?.icon;
              const isExpanded = expandedOrder === order.id;

              return (
                <article key={order.id} className="orders-page__order store-panel">
                  <button
                    className="orders-page__order-toggle"
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <span className="orders-page__status-icon" style={{ color: status.color, borderColor: `${status.color}55`, background: `${status.color}14` }}>
                      <StatusIcon size={18} />
                    </span>
                    <span className="orders-page__order-main">
                      <strong>{order.orderNumber}</strong>
                      <small>{new Date(order.createdAt).toLocaleDateString()} · {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Customer order'}</small>
                    </span>
                    <span className="orders-page__status" style={{ color: status.color, borderColor: `${status.color}55`, background: `${status.color}12` }}>
                      {status.label}
                    </span>
                    <strong className="orders-page__total">${order.totalAmount.toFixed(2)}</strong>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {isExpanded && (
                    <div className="orders-page__details">
                      <div className="orders-page__detail-grid">
                        <section>
                          <span>Customer</span>
                          <strong>{order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : order.shippingAddress?.recipientName ?? 'Customer'}</strong>
                          <p>{order.customer?.email ?? 'No email'}</p>
                          <p>{order.customer?.phone ?? order.shippingAddress?.recipientPhone ?? 'No phone'}</p>
                        </section>
                        <section>
                          <span>Shipping</span>
                          <strong>{order.shippingAddress?.recipientName ?? 'Recipient'}</strong>
                          <p>{formatAddress(order)}</p>
                          <p>{order.shippingAddress?.recipientPhone ?? 'No phone'}</p>
                        </section>
                        <section>
                          <span>Payment</span>
                          <strong>{order.paymentMethod ?? 'Not set'}</strong>
                          <p>Subtotal ${order.subtotal.toFixed(2)}</p>
                          <p>Discount ${order.discountAmount.toFixed(2)}</p>
                        </section>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="orders-page__items">
                          {order.items.map((item) => (
                            <div key={item.id} className="orders-page__item">
                              <span>
                                <strong>{item.productName}</strong>
                                <small>{item.skuCode} · {item.sizeName} / {item.colorName} · Qty {item.quantity}</small>
                              </span>
                              <b>${item.lineTotal.toFixed(2)}</b>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="orders-page__actions">
                        {user?.role === 'client' && order.currentStatus === 'pending' && (
                          <button className="store-button orders-page__action" onClick={() => handlePay(order.id)} disabled={payingOrderId === order.id}>
                            <CreditCard size={16} />
                            {payingOrderId === order.id ? 'Redirecting...' : 'Pay now'}
                          </button>
                        )}
                        {nextStatus && nextStatusConfig && (
                          <button className="store-button orders-page__action" onClick={() => handleStatusUpdate(order.id, nextStatus)}>
                            {NextStatusIcon && <NextStatusIcon size={16} />}
                            Move to {nextStatusConfig.label}
                          </button>
                        )}
                        {user?.role !== 'delivery_person' && ['pending', 'paid', 'processing'].includes(order.currentStatus) && (
                          <button className="orders-page__cancel" onClick={() => handleCancel(order.id)}>
                            <AlertCircle size={16} />
                            Cancel order
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {!loading && (
          <div className="orders-page__pagination store-panel">
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page">
              <ChevronLeft size={18} />
            </button>
            <span>
              Page {page} of {totalPages} · {totalItems} orders
            </span>
            <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} aria-label="Next page">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
