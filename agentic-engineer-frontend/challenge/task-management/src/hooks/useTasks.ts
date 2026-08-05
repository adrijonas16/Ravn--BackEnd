import { useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import type { Task, CreateTaskInput, UpdateTaskInput, FilterInput } from '../types/task';
import { useFilters } from '../context/FilterContext';
import { GET_TASKS } from '../graphql/queries';
import { CREATE_TASK, UPDATE_TASK, DELETE_TASK } from '../graphql/mutations';

// Custom hook that encapsulates all CRUD operations for tasks
// Connects to the real GraphQL API using Apollo Client
// Server-side filters (status, tags, pointEstimate, ownerId, dueDate) are sent as query variables
// Client-side filter (name) is applied after fetching since the API supports it as well
export function useTasks() {
  const { filters, setFilters, clearFilters } = useFilters();

  // Build the API filter input from the active filters
  // Note: assigneeId is the correct field name for filtering by user (not ownerId)
  // Note: dueDate is filtered client-side because the API requires an exact timestamp match
  const apiInput = useMemo(() => {
    const input: Record<string, unknown> = {};
    if (filters.status) input.status = filters.status;
    if (filters.tags && filters.tags.length > 0) input.tags = filters.tags;
    if (filters.pointEstimate) input.pointEstimate = filters.pointEstimate;
    if (filters.ownerId) input.assigneeId = filters.ownerId;
    if (filters.name) input.name = filters.name;
    return input;
  }, [filters]);

  // Fetch tasks from the API with active filters
  const { data, loading, error, refetch } = useQuery<{ tasks: Task[] }>(GET_TASKS, {
    variables: { input: apiInput },
    fetchPolicy: 'cache-and-network',
  });

  // Client-side dueDate filter: compare only the date portion (ignore time)
  const tasks = useMemo(() => {
    const all = data?.tasks ?? [];
    if (!filters.dueDate) return all;
    const filterDate = new Date(filters.dueDate).toDateString();
    return all.filter((task) => new Date(task.dueDate).toDateString() === filterDate);
  }, [data?.tasks, filters.dueDate]);

  // Create a new task, then refetch the list to stay in sync
  const [createTaskMutation] = useMutation(CREATE_TASK);
  const createTask = useCallback(async (input: CreateTaskInput) => {
    try {
      await createTaskMutation({
        variables: {
          input: {
            name: input.name,
            status: input.status,
            dueDate: input.dueDate,
            pointEstimate: input.pointEstimate,
            tags: input.tags,
            assigneeId: input.assigneeId || undefined,
          },
        },
      });
      await refetch();
      return { success: true as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      return { success: false as const, error: message };
    }
  }, [createTaskMutation, refetch]);

  // Update an existing task by ID, then refetch
  const [updateTaskMutation] = useMutation(UPDATE_TASK);
  const updateTask = useCallback(async (input: UpdateTaskInput) => {
    try {
      const variables: Record<string, unknown> = { id: input.id };
      if (input.name !== undefined) variables.name = input.name;
      if (input.status !== undefined) variables.status = input.status;
      if (input.dueDate !== undefined) variables.dueDate = input.dueDate;
      if (input.pointEstimate !== undefined) variables.pointEstimate = input.pointEstimate;
      if (input.tags !== undefined) variables.tags = input.tags;
      if (input.position !== undefined) variables.position = input.position;
      if (input.assigneeId !== undefined) variables.assigneeId = input.assigneeId;

      await updateTaskMutation({ variables: { input: variables } });
      await refetch();
      return { success: true as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task';
      return { success: false as const, error: message };
    }
  }, [updateTaskMutation, refetch]);

  // Delete a task by ID, then refetch
  const [deleteTaskMutation] = useMutation(DELETE_TASK);
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTaskMutation({ variables: { input: { id: taskId } } });
      await refetch();
      return { success: true as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      return { success: false as const, error: message };
    }
  }, [deleteTaskMutation, refetch]);

  return {
    tasks,
    allTasks: tasks,
    filters,
    setFilters,
    clearFilters,
    loading,
    error: error?.message ?? null,
    createTask,
    updateTask,
    deleteTask,
  };
}
