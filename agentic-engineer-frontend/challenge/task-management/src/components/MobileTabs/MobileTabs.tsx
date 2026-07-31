import { NavLink } from 'react-router-dom';

// Mobile-only tab bar shown below the header for switching between Dashboard and Task views
export function MobileTabs() {
  return (
    <div className="mobile-tabs">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `mobile-tabs__tab${isActive ? ' mobile-tabs__tab--active' : ''}`
        }
      >
        Dashboard
      </NavLink>
      <NavLink
        to="/my-tasks"
        className={({ isActive }) =>
          `mobile-tabs__tab${isActive ? ' mobile-tabs__tab--active' : ''}`
        }
      >
        Task
      </NavLink>
    </div>
  );
}
