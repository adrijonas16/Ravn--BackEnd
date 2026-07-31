import { useState } from 'react';
import type { Task } from '../../types/task';
import { TaskStatus } from '../../types/task';
import { TaskCard } from '../TaskCard';

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMoveTask?: (taskId: string, newStatus: TaskStatus) => void;
}

// Human-readable labels for each status column header
const STATUS_LABELS: Record<string, string> = {
  [TaskStatus.BACKLOG]: 'Backlog',
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Done',
  [TaskStatus.CANCELLED]: 'Cancelled',
};

// Pure function: no state needed, so it lives outside the component to avoid re-creation
function handleDragOver(e: React.DragEvent) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

// A single Kanban column that filters and renders tasks matching its status
// Supports drag-and-drop: cards can be dragged between columns to change status
export function TaskColumn({ status, tasks, onEdit, onDelete, onMoveTask }: TaskColumnProps) {
  const columnTasks = tasks.filter((task) => task.status === status);
  const label = STATUS_LABELS[status] ?? status;
  const [dragOver, setDragOver] = useState(false);

  // Highlight the column when a card is dragged over it
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOver(false);
  };

  // Handle the drop: extract the task ID and update its status
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const taskId = e.dataTransfer.getData('application/task-id');
    if (taskId && onMoveTask) {
      onMoveTask(taskId, status);
    }
  };

  return (
    <section
      className={`task-column${dragOver ? ' task-column--drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="task-column__header">
        <h2 className="task-column__title">
          {label}{' '}
          <span className="task-column__count">({String(columnTasks.length).padStart(2, '0')})</span>
        </h2>
      </div>

      <div className="task-column__list">
        {columnTasks.length === 0 ? (
          <div className="task-column__empty"><p>No tasks</p></div>
        ) : (
          columnTasks.map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>
    </section>
  );
}
