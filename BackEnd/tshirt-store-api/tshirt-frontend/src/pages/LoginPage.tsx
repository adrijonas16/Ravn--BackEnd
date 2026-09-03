import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../context/useAuth';
import { Mail, Lock, Eye, EyeOff, LogIn, Shirt } from 'lucide-react';

const inputWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  background: 'var(--surface-muted)',
  borderRadius: '12px',
  border: '1px solid var(--border)',
  padding: '0 1rem',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.85rem 0',
  border: 'none',
  background: 'transparent',
  color: 'var(--text)',
  outline: 'none',
  fontSize: '0.95rem',
  minWidth: 0,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--text-muted)',
  fontSize: '0.8rem',
  fontWeight: 500,
  marginBottom: '0.4rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.signIn({ email, password });
      login(data.accessToken, data.refreshToken, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        animation: 'scaleIn 0.4s ease-out',
      }}>
        <div style={{
          background: 'var(--surface)',
          borderRadius: '24px',
          border: '1px solid var(--border)',
          padding: 'clamp(1.5rem, 4vw, 2.5rem)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px var(--shadow)',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #2457ff, #2457ff, #2457ff)',
          }} />

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2457ff, #2457ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 25px rgba(36, 87, 255, 0.3)',
            }}>
              <Shirt size={28} color="white" />
            </div>
            <h1 style={{
              margin: '0 0 0.25rem',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text)',
            }}>
              Welcome back
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Sign in to your account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(233, 69, 96, 0.1)',
              border: '1px solid rgba(233, 69, 96, 0.2)',
              borderRadius: '10px',
              color: '#e94560',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              animation: 'slideDown 0.3s ease-out',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            {/* Email */}
            <div>
              <label htmlFor="login-email" style={labelStyle}>
                Email
              </label>
              <div className="login-page__input" style={inputWrapperStyle}>
                <Mail size={18} />
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" style={labelStyle}>
                Password
              </label>
              <div className="login-page__input" style={inputWrapperStyle}>
                <Lock size={18} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={inputStyle}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.55rem' }}>
                <Link to="/forgot-password" style={{
                  color: 'var(--brand)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.9rem',
                background: 'linear-gradient(135deg, #2457ff, #111111)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                marginTop: '0.5rem',
                boxShadow: '0 4px 15px rgba(36, 87, 255, 0.3)',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(36, 87, 255, 0.4)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(36, 87, 255, 0.3)';
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 18,
                    height: 18,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p style={{
            marginTop: '1.5rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            fontSize: '0.9rem',
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: 'var(--brand)',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--brand)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--brand)'}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
