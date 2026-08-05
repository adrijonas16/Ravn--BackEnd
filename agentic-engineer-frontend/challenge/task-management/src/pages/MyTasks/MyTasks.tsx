import { useState } from 'react';
import { Plus, ChevronDown, MessageCircle, GitBranch } from 'lucide-react';
import { ViewToggle } from '../../components/ViewToggle';
import { SearchFilter } from '../../components/SearchFilter/SearchFilter';
import { Modal } from '../../components/Modal';
import { TaskForm } from '../../components/TaskForm';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ToastContainer } from '../../components/Toast';
import { useTasks } from '../../hooks/useTasks';
import { useToast } from '../../hooks/useToast';
import { useCreateTask } from '../../hooks/useCreateTask';
import type { Task, CreateTaskInput } from '../../types/task';
import { TaskStatus } from '../../types/task';
import { getPointLabel, getDateColor } from '../../utils/date';
import { getTagLabel, getTagClassName } from '../../utils/tags';
import { getAvatarUrl } from '../../utils/avatar';

// Sections displayed as collapsible groups in the list view
const SECTIONS = [
  { status: TaskStatus.BACKLOG, label: 'Backlog' },
  { status: TaskStatus.TODO, label: 'To Do' },
  { status: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { status: TaskStatus.DONE, label: 'Done' },
  { status: TaskStatus.CANCELLED, label: 'Cancelled' },
];

// Border color based on due date status (matches the date color coding)
const DATE_BORDER_COLORS: Record<string, string> = {
  green: '#70b252',
  yellow: '#e5b454',
  red: '#da584b',
  default: '#94979a',
};

// Format date for the list view (simpler than the board view format)
function formatListDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Alternative list/table view of tasks, grouped by status with collapsible sections
// Clicking a row opens the edit form; same CRUD logic as Dashboard
export function MyTasks() {
  const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks();
  const { toasts, showToast, removeToast } = useToast();

  const { setOnCreate } = useCreateTask();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [tagPopup, setTagPopup] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  setOnCreate(() => setShowCreateForm(true));

  const toggleSection = (status: string) => {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const handleCreate = async (input: CreateTaskInput) => {
    const result = await createTask(input);
    if (result.success) {
      showToast('Task created successfully', 'success');
      setShowCreateForm(false);
    } else {
      showToast(result.error ?? 'Failed to create task', 'error');
    }
  };

  const handleUpdate = async (input: CreateTaskInput) => {
    if (!editingTask) return;
    const result = await updateTask({ id: editingTask.id, ...input });
    if (result.success) {
      showToast('Task updated successfully', 'success');
      setEditingTask(null);
    } else {
      showToast(result.error ?? 'Failed to update task', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingTaskId) return;
    const result = await deleteTask(deletingTaskId);
    if (result.success) {
      showToast('Task deleted successfully', 'success');
      setDeletingTaskId(null);
    } else {
      showToast(result.error ?? 'Failed to delete task', 'error');
    }
  };

  return (
    <div className="my-tasks">
      <div className="toolbar">
        <ViewToggle />
        <button type="button" className="toolbar__add-btn" aria-label="Add task" onClick={() => setShowCreateForm(true)}>
          <Plus size={20} />
        </button>
      </div>

      <SearchFilter />

      {/* Show loading spinner while fetching tasks */}
      {loading && tasks.length === 0 && (
        <div className="loading-spinner"><div className="loading-spinner__circle" /></div>
      )}

      {/* Show error message if the query failed */}
      {error && (
        <div className="empty-results">
          <p className="empty-results__text">Failed to load tasks: {error}</p>
        </div>
      )}

      <div className="task-table">
        <div className="task-table__header">
          <div># Task Name</div>
          <div>Task Tags</div>
          <div>Estimate</div>
          <div>Task Assign Name</div>
          <div>Due Date</div>
        </div>

        {SECTIONS.map((section) => {
          const sectionTasks = tasks.filter((t) => t.status === section.status);
          const isCollapsed = collapsed[section.status];

          return (
            <div key={section.status} className="task-table__section">
              <button
                type="button"
                className="task-table__section-header"
                onClick={() => toggleSection(section.status)}
              >
                <ChevronDown
                  size={16}
                  className={`task-table__chevron${isCollapsed ? ' task-table__chevron--collapsed' : ''}`}
                />
                <span className="task-table__section-title">{section.label}</span>
                <span className="task-table__section-count">
                  ({String(sectionTasks.length).padStart(2, '0')})
                </span>
              </button>

              {!isCollapsed &&
                sectionTasks.map((task, index) => {
                  const borderColor = DATE_BORDER_COLORS[getDateColor(task.dueDate)];
                  const dateText = formatListDate(task.dueDate);
                  const dateClass =
                    dateText === 'Yesterday' ? ' task-table__col-date--red'
                    : dateText === 'Today' ? ' task-table__col-date--green'
                    : '';

                  return (
                    <div
                      key={task.id}
                      className="task-table__row"
                      role="button"
                      tabIndex={0}
                      onClick={() => setEditingTask(task)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setEditingTask(task); }}
                    >
                      <div className="task-table__row-border" style={{ backgroundColor: borderColor }} />
                      <div className="task-table__col-name">
                        <span className="task-table__row-number">{String(index + 1).padStart(2, '0')}</span>
                        <span className="task-table__row-task-name">{task.name}</span>
                        {task.tags.length > 0 && (
                          <span className="task-table__row-icons">
                            <span className="task-table__row-icon"><MessageCircle size={12} /></span>
                            <span className="task-table__row-icon"><GitBranch size={12} /></span>
                          </span>
                        )}
                      </div>
                      <div className="task-table__col-tags">
                        {task.tags.length > 0 && (
                          <span className={`task-table__tag task-table__tag--${getTagClassName(task.tags[0])}`}>{getTagLabel(task.tags[0])}</span>
                        )}
                        {task.tags.length > 1 && (
                          <div className="task-table__tag-more-wrapper">
                            <span
                              className="task-table__tag-more"
                              onClick={(e) => { e.stopPropagation(); setTagPopup(tagPopup === task.id ? null : task.id); }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setTagPopup(tagPopup === task.id ? null : task.id); } }}
                            >+{task.tags.length - 1}</span>
                            {tagPopup === task.id && (
                              <div className="task-table__tag-popup">
                                {task.tags.slice(1).map((tag) => (
                                  <span key={tag} className={`task-table__tag task-table__tag--${getTagClassName(tag)}`}>{getTagLabel(tag)}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="task-table__col-estimate">{getPointLabel(task.pointEstimate)}</div>
                      <div className="task-table__col-assignee">
                        {task.assignee && (
                          <>
                            <img className="task-table__assignee-avatar" src={getAvatarUrl(task.assignee.avatar, task.assignee.fullName)} alt={task.assignee.fullName} />
                            <span className="task-table__assignee-name">{task.assignee.fullName}</span>
                          </>
                        )}
                      </div>
                      <div className={`task-table__col-date${dateClass}`}>{dateText}</div>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)}>
        <TaskForm onSubmit={handleCreate} onCancel={() => setShowCreateForm(false)} />
      </Modal>

      <Modal isOpen={editingTask !== null} onClose={() => setEditingTask(null)}>
        {editingTask && (
          <TaskForm initialData={editingTask} onSubmit={handleUpdate} onCancel={() => setEditingTask(null)} />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deletingTaskId !== null}
        onClose={() => setDeletingTaskId(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        confirmLabel="Delete"
        variant="danger"
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
