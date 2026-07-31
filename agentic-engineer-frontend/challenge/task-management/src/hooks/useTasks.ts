import { useState, useCallback, useMemo } from 'react';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';
import { mockTasks, mockUsers } from '../mocks/data';
import { useFilters } from '../context/FilterContext';

// Custom hook that encapsulates all CRUD operations for tasks
// Returns the filtered task list plus create, update, and delete functions
// Uses useCallback to memoize handlers and useMemo to avoid re-filtering on every render
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const { filters, setFilters, clearFilters } = useFilters();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter tasks based on the active filters (name, status, tags, points, owner, date)
  // useMemo ensures this only recalculates when `tasks` or `filters` change
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.name && !task.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      if (filters.status && task.status !== filters.status) {
        return false;
      }
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag) => task.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }
      if (filters.pointEstimate && task.pointEstimate !== filters.pointEstimate) {
        return false;
      }
      if (filters.ownerId && task.assignee?.id !== filters.ownerId) {
        return false;
      }
      if (filters.dueDate) {
        const filterDate = new Date(filters.dueDate).toDateString();
        const taskDate = new Date(task.dueDate).toDateString();
        if (filterDate !== taskDate) return false;
      }
      return true;
    });
  }, [tasks, filters]);

  // Create a new task and prepend it to the list
  const createTask = useCallback((input: CreateTaskInput) => {
    setLoading(true);
    setError(null);
    try {
      const assignee = mockUsers.find((u) => u.id === input.assigneeId) ?? null;
      const newTask: Task = {
        id: String(Date.now()),
        name: input.name,
        status: input.status,
        dueDate: input.dueDate,
        pointEstimate: input.pointEstimate,
        tags: input.tags,
        assignee,
        position: 1,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
      return { success: true as const };
    } catch {
      setError('Failed to create task');
      return { success: false as const, error: 'Failed to create task' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing task by merging only the changed fields
  const updateTask = useCallback((input: UpdateTaskInput) => {
    setLoading(true);
    setError(null);
    try {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== input.id) return task;
          const assignee = input.assigneeId
            ? mockUsers.find((u) => u.id === input.assigneeId) ?? task.assignee
            : task.assignee;
          return {
            ...task,
            ...(input.name !== undefined && { name: input.name }),
            ...(input.status !== undefined && { status: input.status }),
            ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
            ...(input.pointEstimate !== undefined && { pointEstimate: input.pointEstimate }),
            ...(input.tags !== undefined && { tags: input.tags }),
            ...(input.position !== undefined && { position: input.position }),
            assignee,
          };
        }),
      );
      return { success: true as const };
    } catch {
      setError('Failed to update task');
      return { success: false as const, error: 'Failed to update task' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove a task from the list by its ID
  const deleteTask = useCallback((taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      return { success: true as const };
    } catch {
      setError('Failed to delete task');
      return { success: false as const, error: 'Failed to delete task' };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    filters,
    setFilters,
    clearFilters,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
  };
}
