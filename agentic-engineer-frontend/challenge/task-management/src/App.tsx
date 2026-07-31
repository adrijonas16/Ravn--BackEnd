import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { MobileTabs } from './components/MobileTabs';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { CreateTaskProvider } from './context/CreateTaskContext';
import { FilterProvider, useFilters } from './context/FilterContext';
import { useCreateTask } from './hooks/useCreateTask';
import './styles/global.css';

// Lazy-load pages so they're only fetched when the user navigates to them
// This reduces the initial bundle size and improves first-load performance
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })),
);
const MyTasks = lazy(() =>
  import('./pages/MyTasks').then((m) => ({ default: m.MyTasks })),
);
const Settings = lazy(() =>
  import('./pages/Settings').then((m) => ({ default: m.Settings })),
);
const NotFound = lazy(() =>
  import('./pages/NotFound').then((m) => ({ default: m.NotFound })),
);

// AppShell renders the persistent layout (sidebar, header, bottom nav)
// and the routed page content inside a Suspense boundary
function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { requestCreate } = useCreateTask();
  const { filters, setFilters } = useFilters();

  // Update the name filter in real time as the user types in the search bar
  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, name: value || undefined });
  };

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-layout__main">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          searchValue={filters.name ?? ''}
          onSearchChange={handleSearchChange}
        />
        <MobileTabs />
        <main className="app-layout__content">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/my-tasks" element={<MyTasks />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        <BottomNav onAddClick={requestCreate} />
      </div>
    </div>
  );
}

// Root component: wraps the app with global providers
// - ErrorBoundary: catches runtime errors and shows a fallback UI
// - BrowserRouter: enables client-side routing
// - FilterProvider: shares filter state across all pages
// - CreateTaskProvider: lets any component trigger the "create task" modal
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <FilterProvider>
          <CreateTaskProvider>
            <AppShell />
          </CreateTaskProvider>
        </FilterProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
