import { gql } from '@apollo/client';

// Fragment with all the task fields we need (reused across queries and mutations)
const TASK_FIELDS = gql`
  fragment TaskFields on Task {
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
      email
      type
      createdAt
      updatedAt
    }
  }
`;

// Fetch all tasks, with optional filters
export const GET_TASKS = gql`
  ${TASK_FIELDS}
  query GetTasks($input: FilterTaskInput!) {
    tasks(input: $input) {
      ...TaskFields
    }
  }
`;

// Fetch the current user's profile
export const GET_PROFILE = gql`
  query GetProfile {
    profile {
      id
      fullName
      email
      type
      avatar
      createdAt
      updatedAt
    }
  }
`;

// Fetch all users (for the assignee dropdown)
export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      fullName
      avatar
      email
      type
      createdAt
      updatedAt
    }
  }
`;
