import { useState, useEffect } from 'react';
import { ordersApi } from '../api/orders';
import { OrderSummary } from '../types';
import { Package, Filter, ChevronLeft, ChevronRight, X, Clock, Check, Truck, MapPin, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Package }> = {
  pending: { label: 'Pending', color: '#f59e0b', icon: Clock },
  paid: { label: 'Paid', color: '#00b894', icon: Check },
  processing: { label: 'Processing', color: '#6c5ce7', icon: Package },
  shipped: { label: 'Shipped', color: '#00cec9', icon: Truck },
  delivered: { label: 'Delivered', color: '#00b894', icon: MapPin },
  cancelled: { label: 'Cancelled', color: '#e94560', icon: X },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await ordersApi.list({
        page, limit: 10,
        status: statusFilter || undefined,
      });
      setOrders(data.data);
      setTotalPages(data.meta.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleCancel = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await ordersApi.cancel(orderId, 'Cancelled by user');
      loadOrders();
    } catch { /* ignore */ }
  };

  return (
    <div style={{
      maxWidth: 900,
      margin: '0 auto',
      padding: '2rem',
      animation: 'fadeIn 0.5s ease-out',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6c5ce7, #00cec9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Package size={22} color="white" />
        </div>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '1.6rem',
            fontWeight: 700,
            color: '#ffffff',
          }}>
            My Orders
          </h1>
          <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>
            Track and manage your orders
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        padding: '0.75rem',
        background: '#12122a',
        borderRadius: '12px',
        border: '1px solid #1e1e3a',
        alignItems: 'center',
      }}>
        <Filter size={16} color="#888" style={{ marginLeft: '0.25rem' }} />
        <button
          onClick={() => { setStatusFilter(''); setPage(1); }}
          style={{
            padding: '0.4rem 0.85rem',
            borderRadius: '8px',
            border: statusFilter === '' ? '1px solid #6c5ce7' : '1px solid transparent',
            background: statusFilter === '' ? 'rgba(108, 92, 231, 0.15)' : 'transparent',
            color: statusFilter === '' ? '#a78bfa' : '#888',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: statusFilter === '' ? 600 : 400,
            transition: 'all 0.2s ease',
          }}
        >
          All
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, { label, color }]) => (
          <button
            key={key}
            onClick={() => { setStatusFilter(key); setPage(1); }}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              border: statusFilter === key ? `1px solid ${color}` : '1px solid transparent',
              background: statusFilter === key ? `${color}15` : 'transparent',
              color: statusFilter === key ? color : '#888',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: statusFilter === key ? 600 : 400,
              transition: 'all 0.2s ease',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
              background: '#12122a',
              borderRadius: '16px',
              border: '1px solid #1e1e3a',
              padding: '1.5rem',
              height: '100px',
            }}>
              <div style={{
                height: 16,
                background: 'linear-gradient(90deg, #1e1e3a 25%, #2a2a4a 50%, #1e1e3a 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite',
                borderRadius: 4,
                width: '40%',
                marginBottom: '0.75rem',
              }} />
              <div style={{
                height: 12,
                background: 'linear-gradient(90deg, #1e1e3a 25%, #2a2a4a 50%, #1e1e3a 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite',
                borderRadius: 4,
                width: '25%',
              }} />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: '#12122a',
          borderRadius: '20px',
          border: '1px solid #1e1e3a',
          animation: 'scaleIn 0.4s ease-out',
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(108, 92, 231, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <Package size={36} color="#6c5ce7" strokeWidth={1.5} />
          </div>
          <p style={{ color: '#e0e0e0', fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            No orders yet
          </p>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            Your order history will appear here
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {orders.map((order, index) => {
            const status = STATUS_CONFIG[order.currentStatus] ?? { label: order.currentStatus, color: '#888', icon: Package };
            const StatusIcon = status.icon;
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id} style={{
                background: '#12122a',
                borderRadius: '16px',
                border: '1px solid #1e1e3a',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                animation: `slideUp 0.4s ease-out ${index * 0.05}s both`,
              }}>
                {/* Order header */}
                <div
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  style={{
                    padding: '1.25rem 1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(30, 30, 58, 0.5)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Timeline dot */}
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      background: `${status.color}15`,
                      border: `1px solid ${status.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <StatusIcon size={18} color={status.color} />
                    </div>

                    <div>
                      <h3 style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#e0e0e0',
                        letterSpacing: '-0.01em',
                      }}>
                        {order.orderNumber}
                      </h3>
                      <p style={{
                        margin: '0.2rem 0 0',
                        color: '#666',
                        fontSize: '0.8rem',
                      }}>
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                  }}>
                    {/* Status badge */}
                    <span style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: `${status.color}15`,
                      color: status.color,
                      border: `1px solid ${status.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}>
                      {status.label}
                    </span>

                    {/* Total */}
                    <span style={{
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      color: '#e0e0e0',
                      minWidth: 80,
                      textAlign: 'right',
                    }}>
                      ${order.totalAmount.toFixed(2)}
                    </span>

                    {isExpanded ? <ChevronUp size={18} color="#888" /> : <ChevronDown size={18} color="#888" />}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{
                    padding: '0 1.5rem 1.25rem',
                    borderTop: '1px solid #1e1e3a',
                    animation: 'slideDown 0.3s ease-out',
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '1rem',
                      padding: '1rem 0',
                    }}>
                      <div>
                        <p style={{ color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                          Subtotal
                        </p>
                        <p style={{ color: '#e0e0e0', fontWeight: 600 }}>${order.subtotal.toFixed(2)}</p>
                      </div>
                      {order.discountAmount > 0 && (
                        <div>
                          <p style={{ color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                            Discount
                          </p>
                          <p style={{ color: '#00b894', fontWeight: 600 }}>-${order.discountAmount.toFixed(2)}</p>
                        </div>
                      )}
                      <div>
                        <p style={{ color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                          Payment
                        </p>
                        <p style={{ color: '#e0e0e0', fontWeight: 500, fontSize: '0.9rem' }}>
                          {order.paymentMethod || 'Not set'}
                        </p>
                      </div>
                    </div>

                    {['pending', 'paid', 'processing'].includes(order.currentStatus) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(order.id);
                        }}
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem 1.2rem',
                          background: 'rgba(233, 69, 96, 0.1)',
                          color: '#e94560',
                          border: '1px solid rgba(233, 69, 96, 0.25)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(233, 69, 96, 0.2)';
                          e.currentTarget.style.borderColor = 'rgba(233, 69, 96, 0.4)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(233, 69, 96, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(233, 69, 96, 0.25)';
                        }}
                      >
                        <AlertCircle size={15} />
                        Cancel Order
                      </button>
                    )}
                  </div>
                )}
              </div>
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
          marginTop: '2rem',
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
          <span style={{ color: '#888', fontSize: '0.9rem' }}>
            Page {page} of {totalPages}
          </span>
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
  );
}
