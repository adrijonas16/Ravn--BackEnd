import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { authApi } from '../api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setResetToken('');
    setLoading(true);

    try {
      const { data } = await authApi.forgotPassword(email.trim().toLowerCase());
      setMessage(data.message);
      setResetToken(data.resetToken ?? '');
    } catch (apiError: any) {
      const apiMessage = apiError.response?.data?.message ?? 'Password reset request failed.';
      setError(Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="password-page">
      <section className="password-page__panel">
        <Link to="/login" className="password-page__back"><ArrowLeft size={16} /> Back to sign in</Link>
        <p className="store-kicker">Account access</p>
        <h1 className="password-page__title">Reset your password</h1>
        <p className="password-page__copy">Enter your account email and we will prepare a reset link.</p>

        {(message || error) && (
          <p className={error ? 'password-page__notice password-page__notice--error' : 'password-page__notice'}>
            {error || message}
          </p>
        )}

        <form className="password-page__form" onSubmit={handleSubmit}>
          <label className="password-page__field" htmlFor="forgot-email">
            <span>Email</span>
            <span className="password-page__input-shell">
              <Mail size={18} />
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </span>
          </label>
          <button type="submit" className="store-button password-page__submit" disabled={loading}>
            <Send size={16} />
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        {resetToken && (
          <div className="password-page__dev-token">
            <strong>Local reset token</strong>
            <input value={resetToken} readOnly aria-label="Local reset token" />
            <Link to={`/reset-password?token=${encodeURIComponent(resetToken)}`}>Continue to reset</Link>
          </div>
        )}
      </section>
    </main>
  );
}
