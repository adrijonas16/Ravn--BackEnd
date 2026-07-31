import { mockUsers } from '../../mocks/data';

// Settings page showing the current user's profile information
// Uses mock data for now; will use the `profile` GraphQL query once connected to the API
export function Settings() {
  const user = mockUsers[0];

  return (
    <div className="settings">
      <h1 className="settings__title">Settings</h1>
      <div className="settings__card">
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
