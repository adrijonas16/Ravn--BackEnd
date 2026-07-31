// Status constants for the Kanban board columns
// Using "as const" creates a union type from the object values
export const TaskStatus = {
  BACKLOG: 'BACKLOG',
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

// Available technology tags for categorizing tasks
export const TaskTag = {
  ANDROID: 'ANDROID',
  IOS: 'IOS',
  NODE_JS: 'NODE_JS',
  RAILS: 'RAILS',
  REACT: 'REACT',
} as const;

export type TaskTag = (typeof TaskTag)[keyof typeof TaskTag];

// User profile returned by the API
export interface User {
  id: string;
  avatar: string;
  fullName: string;
  email: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

// A single task displayed on the board or list view
export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  dueDate: string;
  pointEstimate: string;
  tags: TaskTag[];
  assignee: User | null;
  position: number;
  createdAt: string;
}

// Shape of the data sent when creating a new task
export interface CreateTaskInput {
  name: string;
  status: TaskStatus;
  dueDate: string;
  pointEstimate: string;
  tags: TaskTag[];
  assigneeId: string;
}

// Shape of the data sent when updating an existing task
// All fields are optional except `id` (we only send what changed)
export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
  position?: number;
}

// Optional filters that can be applied to the task list
export type FilterInput = {
  name?: string;
  dueDate?: string;
  ownerId?: string;
  status?: TaskStatus;
  tags?: TaskTag[];
  pointEstimate?: string;
};
