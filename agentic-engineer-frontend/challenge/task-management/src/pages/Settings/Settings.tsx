import { useQuery } from '@apollo/client/react';
import { GET_PROFILE } from '../../graphql/queries';
import type { User } from '../../types/task';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { getAvatarUrl } from '../../utils/avatar';

// Settings page showing the current user's profile information
// Fetches data from the `profile` GraphQL query
export function Settings() {
  const { data, loading, error } = useQuery<{ profile: User }>(GET_PROFILE);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="settings">
        <h1 className="settings__title">Settings</h1>
        <div className="empty-results">
          <p className="empty-results__text">Failed to load profile: {error.message}</p>
        </div>
      </div>
    );
  }

  const user = data?.profile;
  if (!user) return null;

  return (
    <div className="settings">
      <h1 className="settings__title">Settings</h1>
      <div className="settings__card">
        <div className="settings__row">
          <span className="settings__label">Avatar</span>
          <img className="header__avatar" src={getAvatarUrl(user.avatar, user.fullName)} alt={user.fullName} />
        </div>
        <div className="settings__row">
          <span className="settings__label">Full Name</span>
          <span className="settings__value">{user.fullName}</span>
        </div>
        <div className="settings__row">
          <span className="settings__label">Email</span>
          <span className="settings__value">{user.email}</span>
        </div>
        <div className="settings__row">
          <span className="settings__label">Type</span>
          <span className="settings__value">{user.type}</span>
        </div>
        <div className="settings__row">
          <span className="settings__label">Created At</span>
          <span className="settings__value">{new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="settings__row">
          <span className="settings__label">Updated At</span>
          <span className="settings__value">{new Date(user.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
