import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { ShoppingCart, Package, LogOut, User, Menu, X, Shirt } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await authApi.signOut();
    } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinkStyle = (path: string): React.CSSProperties => ({
    color: isActive(path) ? '#00cec9' : '#b0b0c0',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.9rem',
    fontWeight: isActive(path) ? 600 : 400,
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    background: isActive(path) ? 'rgba(0, 206, 201, 0.08)' : 'transparent',
  });

  return (
    <>
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: scrolled ? '0.6rem 2rem' : '0.8rem 2rem',
        background: scrolled
          ? 'rgba(10, 10, 26, 0.85)'
          : 'rgba(10, 10, 26, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(108, 92, 231, 0.15)',
        transition: 'all 0.3s ease',
      }}>
        {/* Logo */}
        <Link to="/" style={{
          color: 'white',
          textDecoration: 'none',
          fontSize: '1.3rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          letterSpacing: '-0.02em',
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6c5ce7, #00cec9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Shirt size={20} color="white" />
          </div>
          <span style={{ background: 'linear-gradient(135deg, #ffffff, #b0b0c0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ThreadVault
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          alignItems: 'center',
        }}
          className="desktop-nav"
        >
          <Link to="/" style={navLinkStyle('/')}>
            <Shirt size={16} />
            Products
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/cart" style={navLinkStyle('/cart')}>
                <ShoppingCart size={16} />
                Cart
              </Link>

              <Link to="/orders" style={navLinkStyle('/orders')}>
                <Package size={16} />
                Orders
              </Link>

              <div style={{
                width: '1px',
                height: '24px',
                background: 'rgba(108, 92, 231, 0.3)',
                margin: '0 0.5rem',
              }} />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.75rem',
                background: 'rgba(108, 92, 231, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(108, 92, 231, 0.2)',
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6c5ce7, #00cec9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <User size={14} color="white" />
                </div>
                <span style={{ color: '#b0b0c0', fontSize: '0.85rem', fontWeight: 500 }}>
                  {user?.firstName}
                </span>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(233, 69, 96, 0.1)',
                  color: '#e94560',
                  border: '1px solid rgba(233, 69, 96, 0.25)',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  marginLeft: '0.25rem',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(233, 69, 96, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(233, 69, 96, 0.5)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(233, 69, 96, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(233, 69, 96, 0.25)';
                }}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={navLinkStyle('/login')}>
                <User size={16} />
                Login
              </Link>
              <Link to="/register" style={{
                background: 'linear-gradient(135deg, #6c5ce7, #5a4bd1)',
                color: 'white',
                textDecoration: 'none',
                padding: '0.5rem 1.2rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(108, 92, 231, 0.5)',
              }}>
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: 'none',
            background: 'transparent',
            border: 'none',
            color: '#e0e0e0',
            cursor: 'pointer',
            padding: '0.5rem',
          }}
          className="mobile-menu-btn"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99,
          background: 'rgba(10, 10, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '5rem 2rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <Link to="/" style={{ ...navLinkStyle('/'), fontSize: '1.1rem', padding: '1rem' }}>
            <Shirt size={20} /> Products
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/cart" style={{ ...navLinkStyle('/cart'), fontSize: '1.1rem', padding: '1rem' }}>
                <ShoppingCart size={20} /> Cart
              </Link>
              <Link to="/orders" style={{ ...navLinkStyle('/orders'), fontSize: '1.1rem', padding: '1rem' }}>
                <Package size={20} /> Orders
              </Link>
              <div style={{ borderTop: '1px solid #1e1e3a', margin: '0.5rem 0' }} />
              <div style={{ padding: '1rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} /> {user?.firstName} ({user?.role})
              </div>
              <button onClick={handleLogout} style={{
                background: 'rgba(233, 69, 96, 0.15)',
                color: '#e94560',
                border: '1px solid rgba(233, 69, 96, 0.3)',
                padding: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1.1rem',
              }}>
                <LogOut size={20} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ ...navLinkStyle('/login'), fontSize: '1.1rem', padding: '1rem' }}>
                <User size={20} /> Login
              </Link>
              <Link to="/register" style={{
                background: 'linear-gradient(135deg, #6c5ce7, #5a4bd1)',
                color: 'white',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 600,
                textAlign: 'center',
                textDecoration: 'none',
              }}>
                Sign up
              </Link>
            </>
          )}
        </div>
      )}

      {/* Inline responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
