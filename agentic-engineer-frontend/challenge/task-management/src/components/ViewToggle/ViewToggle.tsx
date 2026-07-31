import { NavLink } from 'react-router-dom';
import { LayoutGrid, List } from 'lucide-react';

// Toggle between list view (/my-tasks) and grid/board view (/)
// Uses NavLink so the active view button is automatically highlighted
export function ViewToggle() {
  return (
    <div className="toolbar__view-toggle">
      <NavLink
        to="/my-tasks"
        className={({ isActive }) =>
          `toolbar__view-btn${isActive ? ' toolbar__view-btn--active' : ''}`
        }
        aria-label="List view"
      >
        <List size={18} />
      </NavLink>
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `toolbar__view-btn${isActive ? ' toolbar__view-btn--active' : ''}`
        }
        aria-label="Grid view"
      >
        <LayoutGrid size={18} />
      </NavLink>
    </div>
  );
}
