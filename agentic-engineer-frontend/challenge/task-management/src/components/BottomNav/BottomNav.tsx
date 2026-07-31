import { NavLink } from 'react-router-dom';
import { LayoutGrid, PlusCircle, ClipboardList } from 'lucide-react';

interface BottomNavProps {
  onAddClick: () => void;
}

// Mobile-only bottom navigation bar with Dashboard, Add, and My Task buttons
// Only visible on small screens (hidden via CSS on desktop)
export function BottomNav({ onAddClick }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
        }
      >
        <LayoutGrid size={20} />
        <span>Dashboard</span>
      </NavLink>

      <button type="button" className="bottom-nav__add" onClick={onAddClick}>
        <PlusCircle size={28} />
        <span>Add Project</span>
      </button>

      <NavLink
        to="/my-tasks"
        className={({ isActive }) =>
          `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
        }
      >
        <ClipboardList size={20} />
        <span>My Task</span>
      </NavLink>
    </nav>
  );
}
