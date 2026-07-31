import { NavLink } from 'react-router-dom';
import { LayoutGrid, List } from 'lucide-react';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

// Navigation items rendered in the sidebar menu
const NAV_ITEMS = [
  { to: '/', icon: LayoutGrid, label: 'DASHBOARD' },
  { to: '/my-tasks', icon: List, label: 'MY TASK' },
];

// Sidebar component with responsive behavior:
// - Desktop: always visible as a fixed column
// - Mobile: slides in as a drawer with an overlay backdrop
export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile drawer */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose?.(); }}
          role="presentation"
        />
      )}

      <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
        <div className="sidebar__logo">
          <img className="sidebar__logo-img" src="/ravn-logo.png" alt="RAVN" />
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`
              }
              onClick={onClose}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
