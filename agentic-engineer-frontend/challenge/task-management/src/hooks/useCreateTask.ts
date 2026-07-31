import { useContext } from 'react';
import { CreateTaskContext } from '../context/createTaskContextValue';

// Convenience hook to access the create-task context
// Lets any component trigger the "create task" modal from anywhere (e.g. bottom nav)
export function useCreateTask() {
  return useContext(CreateTaskContext);
}
