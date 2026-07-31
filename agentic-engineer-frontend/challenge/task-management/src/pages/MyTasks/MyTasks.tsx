import { useState } from 'react';
import { Plus, ChevronDown, MessageCircle, GitBranch } from 'lucide-react';
import { ViewToggle } from '../../components/ViewToggle';
import { Modal } from '../../components/Modal';
import { TaskForm } from '../../components/TaskForm';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ToastContainer } from '../../components/Toast';
import { useTasks } from '../../hooks/useTasks';
import { useToast } from '../../hooks/useToast';
import { useCreateTask } from '../../hooks/useCreateTask';
import type { Task, CreateTaskInput } from '../../types/task';
import { TaskStatus } from '../../types/task';
import { getPointLabel } from '../../utils/date';
import { getTagLabel, getTagClassName } from '../../utils/tags';

// Sections displayed as collapsible groups in the list view
const SECTIONS = [
  { status: TaskStatus.BACKLOG, label: 'Backlog' },
  { status: TaskStatus.TODO, label: 'To Do' },
  { status: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { status: TaskStatus.DONE, label: 'Done' },
  { status: TaskStatus.CANCELLED, label: 'Cancelled' },
];

// Accent colors for the left border of each task row (cycles through)
const ROW_COLORS = ['#da584b', '#70b252', '#70b252', '#da584b', '#e5b454'];

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
  const { tasks, createTask, updateTask, deleteTask } = useTasks();
  const { toasts, showToast, removeToast } = useToast();

  const { setOnCreate } = useCreateTask();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  setOnCreate(() => setShowCreateForm(true));

  const toggleSection = (status: string) => {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const handleCreate = (input: CreateTaskInput) => {
    const result = createTask(input);
    if (result.success) {
      showToast('Task created successfully', 'success');
      setShowCreateForm(false);
    } else {
      showToast('Failed to create task', 'error');
    }
  };

  const handleUpdate = (input: CreateTaskInput) => {
    if (!editingTask) return;
    const result = updateTask({ id: editingTask.id, ...input });
    if (result.success) {
      showToast('Task updated successfully', 'success');
      setEditingTask(null);
    } else {
      showToast('Failed to update task', 'error');
    }
  };

  const handleDelete = () => {
    if (!deletingTaskId) return;
    const result = deleteTask(deletingTaskId);
    if (result.success) {
      showToast('Task deleted successfully', 'success');
      setDeletingTaskId(null);
    } else {
      showToast('Failed to delete task', 'error');
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
                  const borderColor = ROW_COLORS[index % ROW_COLORS.length];
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
                            <span className="task-table__row-icon">3 <MessageCircle size={12} /></span>
                            <span className="task-table__row-icon">5 <GitBranch size={12} /></span>
                          </span>
                        )}
                      </div>
                      <div className="task-table__col-tags">
                        {task.tags.map((tag) => (
                          <span key={tag} className={`task-table__tag task-table__tag--${getTagClassName(tag)}`}>{getTagLabel(tag)}</span>
                        ))}
                        {task.tags.length > 2 && (
                          <span className="task-table__tag-more">+{task.tags.length - 2}</span>
                        )}
                      </div>
                      <div className="task-table__col-estimate">{getPointLabel(task.pointEstimate)}</div>
                      <div className="task-table__col-assignee">
                        {task.assignee && (
                          <>
                            <img className="task-table__assignee-avatar" src={task.assignee.avatar} alt={task.assignee.fullName} />
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
