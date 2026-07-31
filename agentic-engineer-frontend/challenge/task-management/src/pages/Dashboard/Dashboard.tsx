import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ViewToggle } from '../../components/ViewToggle';
import { SearchFilter } from '../../components/SearchFilter/SearchFilter';
import { useFilters } from '../../context/FilterContext';
import { TaskColumn } from '../../components/TaskColumn';
import { Modal } from '../../components/Modal';
import { TaskForm } from '../../components/TaskForm';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ToastContainer } from '../../components/Toast';
import { useTasks } from '../../hooks/useTasks';
import { useToast } from '../../hooks/useToast';
import { useCreateTask } from '../../hooks/useCreateTask';
import type { Task, CreateTaskInput } from '../../types/task';
import { TaskStatus } from '../../types/task';

// Column order for the Kanban board
const COLUMNS = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
  TaskStatus.CANCELLED,
];

// Main dashboard page: displays tasks in a Kanban board layout
// Handles creating, editing, deleting tasks, and drag-and-drop between columns
export function Dashboard() {
  const { tasks, createTask, updateTask, deleteTask } = useTasks();
  const { filters, clearFilters } = useFilters();
  const { toasts, showToast, removeToast } = useToast();

  const { setOnCreate } = useCreateTask();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  setOnCreate(() => setShowCreateForm(true));
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // CRUD handlers — each shows a toast notification on success or failure
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

  const handleMoveTask = (taskId: string, newStatus: TaskStatus) => {
    const result = updateTask({ id: taskId, status: newStatus });
    if (result.success) {
      showToast('Task moved successfully', 'success');
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
    <div className="dashboard">
      <div className="toolbar">
        <ViewToggle />
        <button type="button" className="toolbar__add-btn" aria-label="Add task" onClick={() => setShowCreateForm(true)}>
          <Plus size={20} />
        </button>
      </div>

      <SearchFilter />

      {tasks.length === 0 && Object.values(filters).some((v) => Array.isArray(v) ? v.length > 0 : v !== undefined) ? (
        <div className="empty-results">
          <p className="empty-results__text">No tasks match the current filters</p>
          <button type="button" className="empty-results__btn" onClick={clearFilters}>Clear filters</button>
        </div>
      ) : (
      <div className="board">
        {COLUMNS.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={tasks}
            onEdit={setEditingTask}
            onDelete={setDeletingTaskId}
            onMoveTask={handleMoveTask}
          />
        ))}
      </div>
      )}

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
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
