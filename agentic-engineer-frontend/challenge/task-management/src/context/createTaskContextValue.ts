import { createContext } from 'react';

// Context value shape for the create-task bridge
// requestCreate: triggers the modal open (called by BottomNav)
// setOnCreate: registers the callback that opens the modal (called by Dashboard/MyTasks)
export interface CreateTaskContextValue {
  requestCreate: () => void;
  setOnCreate: (fn: () => void) => void;
}

// Default no-op values prevent crashes if used outside the provider
export const CreateTaskContext = createContext<CreateTaskContextValue>({
  requestCreate: () => {},
  setOnCreate: () => {},
});
