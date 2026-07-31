import { Search, Bell } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

// Top bar with search input, notification bell, and user avatar
// The search input is controlled by the parent and updates the global filter
export function Header({ onMenuClick, searchValue, onSearchChange }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__search">
        <Search size={18} className="header__search-icon" />
        <input
          className="header__search-input"
          type="text"
          placeholder="Search"
          aria-label="Search tasks"
          value={searchValue ?? ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>

      <div className="header__actions">
        <button type="button" className="header__icon-btn" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <button type="button" className="header__avatar-btn" onClick={onMenuClick} aria-label="Menu">
          <img
            className="header__avatar"
            src="https://i.pravatar.cc/150?u=currentuser"
            alt="Profile"
          />
        </button>
      </div>
    </header>
  );
}
