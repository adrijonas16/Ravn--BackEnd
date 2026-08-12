import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Shirt } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
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
      const { data } = await authApi.signUp(form);
      login(data.accessToken, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const inputWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: '#0a0a1a',
    borderRadius: '12px',
    border: '1px solid #1e1e3a',
    padding: '0 1rem',
    transition: 'border-color 0.2s ease',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '0.85rem 0',
    border: 'none',
    background: 'transparent',
    color: '#e0e0e0',
    outline: 'none',
    fontSize: '0.95rem',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#888',
    fontSize: '0.8rem',
    fontWeight: 500,
    marginBottom: '0.4rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute',
        top: '15%',
        right: '25%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108, 92, 231, 0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '25%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 206, 201, 0.06), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: 420,
        animation: 'scaleIn 0.4s ease-out',
      }}>
        <div style={{
          background: '#12122a',
          borderRadius: '24px',
          border: '1px solid #1e1e3a',
          padding: 'clamp(1.5rem, 4vw, 2.5rem)',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}>
          {/* Gradient top border */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #00cec9, #6c5ce7, #00cec9)',
          }} />

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #00cec9, #6c5ce7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 25px rgba(0, 206, 201, 0.3)',
            }}>
              <Shirt size={28} color="white" />
            </div>
            <h1 style={{
              margin: '0 0 0.25rem',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#ffffff',
            }}>
              Create Account
            </h1>
            <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>
              Join ThreadVault today
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
            {/* Name row */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                <label style={labelStyle}>First Name</label>
                <div style={inputWrapperStyle}>
                  <User size={18} color="#666" />
                  <input
                    placeholder="John"
                    value={form.firstName}
                    onChange={update('firstName')}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                <label style={labelStyle}>Last Name</label>
                <div style={inputWrapperStyle}>
                  <User size={18} color="#666" />
                  <input
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={update('lastName')}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email</label>
              <div style={inputWrapperStyle}>
                <Mail size={18} color="#666" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={update('email')}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={inputWrapperStyle}>
                <Lock size={18} color="#666" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={update('password')}
                  required
                  minLength={8}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p style={{
                margin: '0.4rem 0 0',
                color: '#555',
                fontSize: '0.75rem',
              }}>
                Must be at least 8 characters long
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.9rem',
                background: 'linear-gradient(135deg, #6c5ce7, #5a4bd1)',
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
                transition: 'all 0.2s ease',
                marginTop: '0.5rem',
                boxShadow: '0 4px 15px rgba(108, 92, 231, 0.3)',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(108, 92, 231, 0.4)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(108, 92, 231, 0.3)';
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
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p style={{
            marginTop: '1.5rem',
            color: '#888',
            textAlign: 'center',
            fontSize: '0.9rem',
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: '#6c5ce7',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#00cec9'}
              onMouseLeave={e => e.currentTarget.style.color = '#6c5ce7'}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
