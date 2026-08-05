import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { SlidersHorizontal, X } from 'lucide-react';
import { TaskStatus, TaskTag } from '../../types/task';
import type { User } from '../../types/task';
import { useFilters } from '../../context/FilterContext';
import { GET_USERS } from '../../graphql/queries';

// Dropdown options for each filter type
const STATUS_OPTIONS = [
  { value: TaskStatus.BACKLOG, label: 'Backlog' },
  { value: TaskStatus.TODO, label: 'To Do' },
  { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { value: TaskStatus.DONE, label: 'Done' },
  { value: TaskStatus.CANCELLED, label: 'Cancelled' },
];

const TAG_OPTIONS = [
  { value: TaskTag.REACT, label: 'React' },
  { value: TaskTag.ANDROID, label: 'Android' },
  { value: TaskTag.IOS, label: 'iOS' },
  { value: TaskTag.NODE_JS, label: 'Node.js' },
  { value: TaskTag.RAILS, label: 'Rails' },
];

const POINT_OPTIONS = [
  { value: 'ZERO', label: '0 Points' },
  { value: 'ONE', label: '1 Point' },
  { value: 'TWO', label: '2 Points' },
  { value: 'FOUR', label: '4 Points' },
  { value: 'EIGHT', label: '8 Points' },
];

// Collapsible filter panel with status, assignee, date, points, and tag filters
// All filter changes are synced to the global FilterContext
export function SearchFilter() {
  const { filters, setFilters, clearFilters } = useFilters();
  const [showFilters, setShowFilters] = useState(false);
  const { data: usersData } = useQuery<{ users: User[] }>(GET_USERS);
  const users = usersData?.users ?? [];

  // Check if any advanced filter is active (used to show/hide the "Clear" button)
  const hasAdvancedFilters = filters.status !== undefined
    || (filters.tags && filters.tags.length > 0)
    || filters.pointEstimate !== undefined
    || filters.ownerId !== undefined
    || filters.dueDate !== undefined;

  const handleStatusChange = (value: string) => {
    setFilters({ ...filters, status: value ? (value as TaskStatus) : undefined });
  };

  const handleTagToggle = (tag: TaskTag) => {
    const currentTags = filters.tags ?? [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    setFilters({ ...filters, tags: newTags.length > 0 ? newTags : undefined });
  };

  const handleOwnerChange = (value: string) => {
    setFilters({ ...filters, ownerId: value || undefined });
  };

  const handleDueDateChange = (value: string) => {
    setFilters({ ...filters, dueDate: value || undefined });
  };

  const handlePointsChange = (value: string) => {
    setFilters({ ...filters, pointEstimate: value || undefined });
  };

  return (
    <div className="search-filter">
      <div className="search-filter__bar">
        <button
          type="button"
          className={`search-filter__toggle ${showFilters ? 'search-filter__toggle--active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal size={16} />
          <span>Filters</span>
        </button>
        {hasAdvancedFilters && (
          <button
            type="button"
            className="search-filter__clear"
            onClick={() => { clearFilters(); setShowFilters(false); }}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="search-filter__panel">
          <div className="search-filter__group">
            <label className="search-filter__label" htmlFor="filter-status">Status</label>
            <select
              id="filter-status"
              className="search-filter__select"
              value={filters.status ?? ''}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="search-filter__group">
            <label className="search-filter__label" htmlFor="filter-assignee">Assignee</label>
            <select
              id="filter-assignee"
              className="search-filter__select"
              value={filters.ownerId ?? ''}
              onChange={(e) => handleOwnerChange(e.target.value)}
            >
              <option value="">All assignees</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.fullName}</option>
              ))}
            </select>
          </div>

          <div className="search-filter__group">
            <label className="search-filter__label" htmlFor="filter-duedate">Due Date</label>
            <input
              id="filter-duedate"
              type="date"
              className="search-filter__date"
              value={filters.dueDate ?? ''}
              onChange={(e) => handleDueDateChange(e.target.value)}
            />
          </div>

          <div className="search-filter__group">
            <label className="search-filter__label" htmlFor="filter-points">Points</label>
            <select
              id="filter-points"
              className="search-filter__select"
              value={filters.pointEstimate ?? ''}
              onChange={(e) => handlePointsChange(e.target.value)}
            >
              <option value="">All points</option>
              {POINT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <fieldset className="search-filter__group">
            <legend className="search-filter__label">Tags</legend>
            <div className="search-filter__tags">
              {TAG_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`search-filter__tag-btn ${
                    filters.tags?.includes(opt.value) ? 'search-filter__tag-btn--active' : ''
                  }`}
                  onClick={() => handleTagToggle(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      )}
    </div>
  );
}
