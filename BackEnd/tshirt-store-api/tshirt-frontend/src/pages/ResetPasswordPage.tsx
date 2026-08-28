import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound, LockKeyhole } from 'lucide-react';
import { authApi } from '../api/auth';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(() => searchParams.get('token') ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.resetPassword(token.trim(), newPassword);
      setMessage(data.message);
      setNewPassword('');
      setConfirmPassword('');
    } catch (apiError: any) {
      const apiMessage = apiError.response?.data?.message ?? 'Password could not be reset.';
      setError(Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="password-page">
      <section className="password-page__panel">
        <Link to="/login" className="password-page__back"><ArrowLeft size={16} /> Back to sign in</Link>
        <p className="store-kicker">Secure update</p>
        <h1 className="password-page__title">Create a new password</h1>
        <p className="password-page__copy">Use the token from your reset request and choose a new password.</p>

        {(message || error) && (
          <p className={error ? 'password-page__notice password-page__notice--error' : 'password-page__notice'}>
            {error || message}
          </p>
        )}

        <form className="password-page__form" onSubmit={handleSubmit}>
          <label className="password-page__field" htmlFor="reset-token">
            <span>Reset token</span>
            <span className="password-page__input-shell">
              <KeyRound size={18} />
              <input
                id="reset-token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Paste your token"
                required
              />
            </span>
          </label>

          <div className="password-page__field">
            <label htmlFor="new-password">New password</label>
            <span className="password-page__input-shell">
              <LockKeyhole size={18} />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </div>

          <label className="password-page__field" htmlFor="confirm-password">
            <span>Confirm password</span>
            <span className="password-page__input-shell">
              <LockKeyhole size={18} />
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat new password"
                required
              />
            </span>
          </label>

          <button type="submit" className="store-button password-page__submit" disabled={loading}>
            {loading ? 'Saving...' : 'Update password'}
          </button>
        </form>

        {message && <Link to="/login" className="password-page__login-link">Sign in with your new password</Link>}
      </section>
    </main>
  );
}
