import { Link } from 'react-router-dom';

// 404 page shown when the URL doesn't match any route
export function NotFound() {
  return (
    <div className="not-found">
      <h1 className="not-found__code">404</h1>
      <p className="not-found__text">Page not found</p>
      <Link to="/" className="error-boundary__btn">Go to Dashboard</Link>
    </div>
  );
}
