import { gql } from '@apollo/client';

// Create a new task and return the full task object
export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      name
      status
      dueDate
      pointEstimate
      tags
      position
      createdAt
      assignee {
        id
        fullName
        avatar
      }
    }
  }
`;

// Update an existing task by ID
export const UPDATE_TASK = gql`
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      id
      name
      status
      dueDate
      pointEstimate
      tags
      position
      createdAt
      assignee {
        id
        fullName
        avatar
      }
    }
  }
`;

// Delete a task by ID
export const DELETE_TASK = gql`
  mutation DeleteTask($input: DeleteTaskInput!) {
    deleteTask(input: $input) {
      id
    }
  }
`;
