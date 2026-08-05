import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { LayoutGrid, User, Tag, Calendar } from 'lucide-react';
import type { Task, CreateTaskInput } from '../../types/task';
import type { User as UserType } from '../../types/task';
import { DatePicker } from '../DatePicker';
import { TaskStatus, TaskTag } from '../../types/task';
import { GET_USERS } from '../../graphql/queries';
import { getAvatarUrl } from '../../utils/avatar';

// Props for the task form
// If initialData is provided, the form works in "edit" mode; otherwise it's "create" mode
interface TaskFormProps {
  initialData?: Task;
  onSubmit: (data: CreateTaskInput) => void;
  onCancel: () => void;
}

const POINT_OPTIONS = [
  { value: 'ZERO', label: '0 Points' },
  { value: 'ONE', label: '1 Points' },
  { value: 'TWO', label: '2 Points' },
  { value: 'FOUR', label: '4 Points' },
  { value: 'EIGHT', label: '8 Points' },
];

const TAG_OPTIONS = [
  { value: TaskTag.IOS, label: 'IOS' },
  { value: TaskTag.ANDROID, label: 'ANDROID' },
  { value: TaskTag.REACT, label: 'REACT' },
  { value: TaskTag.NODE_JS, label: 'NODE JS' },
  { value: TaskTag.RAILS, label: 'RAILS' },
];

// Tracks which dropdown is currently open (only one at a time)
type DropdownType = 'estimate' | 'assignee' | 'label' | 'dueDate' | null;

// Convert "2026-07-20" into "Jul 20, 2026" for the chip display
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, day] = dateStr.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Form used for both creating and editing tasks
// Uses chip-style dropdowns for estimate, assignee, tags, and due date
export function TaskForm({ initialData, onSubmit, onCancel }: TaskFormProps) {
  // Fetch real users from the API for the assignee dropdown
  const { data: usersData } = useQuery<{ users: UserType[] }>(GET_USERS);
  const users = usersData?.users ?? [];

  const [name, setName] = useState(initialData?.name ?? '');
  const [pointEstimate, setPointEstimate] = useState(initialData?.pointEstimate ?? '');
  const [assigneeId, setAssigneeId] = useState(initialData?.assignee?.id ?? '');
  const [tags, setTags] = useState<TaskTag[]>(initialData?.tags ?? []);
  const [dueDate, setDueDate] = useState(() => {
    if (!initialData?.dueDate) return '';
    const d = new Date(initialData.dueDate);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const selectedAssignee = users.find((u) => u.id === assigneeId);
  const selectedPointLabel = POINT_OPTIONS.find((p) => p.value === pointEstimate)?.label;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (type: DropdownType) => {
    setOpenDropdown((prev) => (prev === type ? null : type));
  };

  const handleTagToggle = (tag: TaskTag) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name,
      status: initialData?.status ?? TaskStatus.BACKLOG,
      dueDate: dueDate ? `${dueDate}T12:00:00` : new Date().toISOString(),
      pointEstimate: pointEstimate || 'ZERO',
      tags,
      assigneeId,
    });
  };

  return (
    <form className="task-form" ref={formRef} onSubmit={handleSubmit}>
      <input
        className="task-form__title-input"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Task Title"
        aria-label="Task title"
      />

      <div className="task-form__chips">
        {/* Estimate */}
        <div className="task-form__chip-wrapper">
          <button
            type="button"
            className={`task-form__chip${pointEstimate ? ' task-form__chip--selected' : ''}`}
            onClick={() => toggleDropdown('estimate')}
          >
            <LayoutGrid size={14} />
            {selectedPointLabel || 'Estimate'}
          </button>
          {openDropdown === 'estimate' && (
            <div className="task-form__dropdown">
              <div className="task-form__dropdown-header">Estimate</div>
              {POINT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`task-form__dropdown-item${pointEstimate === opt.value ? ' task-form__dropdown-item--active' : ''}`}
                  onClick={() => { setPointEstimate(opt.value); setOpenDropdown(null); }}
                >
                  <LayoutGrid size={14} /> {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assignee */}
        <div className="task-form__chip-wrapper">
          <button
            type="button"
            className={`task-form__chip${assigneeId ? ' task-form__chip--selected' : ''}`}
            onClick={() => toggleDropdown('assignee')}
          >
            {selectedAssignee ? (
              <>
                <img className="task-form__chip-avatar" src={getAvatarUrl(selectedAssignee.avatar, selectedAssignee.fullName)} alt={selectedAssignee.fullName} />
                {selectedAssignee.fullName}
              </>
            ) : (
              <><User size={14} /> Assignee</>
            )}
          </button>
          {openDropdown === 'assignee' && (
            <div className="task-form__dropdown">
              <div className="task-form__dropdown-header">Assign to...</div>
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className={`task-form__dropdown-item${assigneeId === user.id ? ' task-form__dropdown-item--active' : ''}`}
                  onClick={() => { setAssigneeId(user.id); setOpenDropdown(null); }}
                >
                  <img className="task-form__dropdown-avatar" src={getAvatarUrl(user.avatar, user.fullName)} alt={user.fullName} />
                  {user.fullName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Label */}
        <div className="task-form__chip-wrapper">
          <button
            type="button"
            className={`task-form__chip${tags.length > 0 ? ' task-form__chip--selected' : ''}`}
            onClick={() => toggleDropdown('label')}
          >
            <Tag size={14} />
            {tags.length > 0
              ? tags.map((t) => TAG_OPTIONS.find((o) => o.value === t)?.label).join(', ')
              : 'Label'}
          </button>
          {openDropdown === 'label' && (
            <div className="task-form__dropdown">
              <div className="task-form__dropdown-header">Tag Title</div>
              {TAG_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`task-form__dropdown-item${tags.includes(opt.value) ? ' task-form__dropdown-item--active' : ''}`}
                  onClick={() => handleTagToggle(opt.value)}
                >
                  <Tag size={14} /> {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Due date */}
        <div className="task-form__chip-wrapper">
          <button
            type="button"
            className={`task-form__chip${dueDate ? ' task-form__chip--selected' : ''}`}
            onClick={() => toggleDropdown('dueDate')}
          >
            <Calendar size={14} />
            {dueDate ? formatDisplayDate(dueDate) : 'Due date'}
          </button>
          {openDropdown === 'dueDate' && (
            <div className="task-form__dropdown task-form__dropdown--date">
              {/* Scroll-wheel picker for mobile, standard input for desktop */}
              <div className="task-form__date-picker-mobile">
                <DatePicker value={dueDate} onChange={(v) => setDueDate(v)} />
                <button
                  type="button"
                  className="task-form__date-done-btn"
                  onClick={() => setOpenDropdown(null)}
                >
                  Done
                </button>
              </div>
              <input
                type="date"
                className="task-form__date-input"
                aria-label="Due date"
                value={dueDate}
                onChange={(e) => { setDueDate(e.target.value); setOpenDropdown(null); }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="task-form__actions">
        <button type="button" className="task-form__cancel-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="task-form__submit-btn">
          {initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
