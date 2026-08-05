# Task Management App

A Kanban-style task management application built for the RAVN frontend challenge. Users can browse, create, edit, delete, and filter tasks across multiple status columns, with drag-and-drop support and a responsive mobile layout.

## Screenshots

### Dashboard (Board View)
The main view displays tasks organized in five Kanban columns: Backlog, To Do, In Progress, Done, and Cancelled. Each card shows the task name, tags, due date, estimated points, and assignee avatar.

### My Tasks (List View)
An alternative table layout groups tasks by status in collapsible sections. Clicking a row opens the edit form.

### Create / Edit Task
A modal with chip-style selectors for estimate, assignee, tags, and due date. On mobile, the date picker uses an iOS-style 3D scroll wheel.

### Settings
Displays the logged-in user's profile information fetched from the API.

## Setup & Running

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/adrianachipana-lab/ravn-nerdery.git
cd agentic-engineer-frontend/challenge/task-management

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your API token
```

### Running

```bash
# Development server
npm run dev

# Production build
npm run build

# Run tests
npm run test:run

# Type checking
npm run typecheck

# Lint
npm run lint
```

## Tech Stack & Rationale

| Technology | Why |
|---|---|
| **React 19** | Latest stable version with improved performance |
| **TypeScript** | Type safety catches bugs at compile time, better IDE support |
| **Vite 8** | Fastest build tool available, instant HMR |
| **Apollo Client** | Industry-standard GraphQL client with built-in caching and hooks |
| **React Router 7** | Client-side routing with lazy-loaded pages for code splitting |
| **Lucide React** | Lightweight, tree-shakeable icon library |
| **@ncdai/react-wheel-picker** | iOS-style 3D wheel date picker for mobile |
| **Oxlint** | Fast Rust-based linter |
| **Prettier** | Consistent code formatting |
| **Vitest** | Fast unit testing integrated with Vite |

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── BottomNav/       # Mobile bottom navigation
│   ├── ConfirmDialog/   # Delete confirmation modal
│   ├── DatePicker/      # iOS-style 3D wheel date picker
│   ├── ErrorBoundary/   # Runtime error catch boundary
│   ├── Header/          # Top bar with search and avatar
│   ├── LoadingSpinner/  # Loading indicator
│   ├── MobileTabs/      # Mobile tab navigation
│   ├── Modal/           # Reusable modal overlay
│   ├── SearchFilter/    # Collapsible filter panel
│   ├── Sidebar/         # Desktop sidebar navigation
│   ├── TaskCard/        # Individual task card (board view)
│   ├── TaskColumn/      # Kanban column with drag-and-drop
│   ├── TaskForm/        # Create/edit task form with chip selectors
│   ├── Toast/           # Notification toasts
│   └── ViewToggle/      # Board/list view toggle
├── context/             # React contexts (filters, create-task bridge)
├── graphql/             # Apollo client, queries, and mutations
├── hooks/               # Custom hooks (useTasks, useToast, useCreateTask)
├── pages/               # Route pages (Dashboard, MyTasks, Settings, NotFound)
├── styles/              # Global CSS and design tokens
├── types/               # TypeScript type definitions
└── utils/               # Pure utility functions (date formatting, tag helpers)
```

## Architecture Decisions

- **CSS Variables + BEM**: Chose vanilla CSS with design tokens over CSS-in-JS or Tailwind for simplicity and zero runtime cost. BEM naming prevents class collisions without build tools.
- **Apollo Client over fetch**: Apollo provides automatic caching, refetching, loading/error states, and TypeScript integration out of the box.
- **Lazy-loaded pages**: Each page is code-split with `React.lazy()` to minimize the initial bundle size.
- **Context for cross-component communication**: `FilterContext` shares filter state between the search bar (Header) and the filter panel (SearchFilter) without prop drilling. `CreateTaskContext` bridges the bottom nav's "+" button with the dashboard's modal.
- **Server-side + client-side filtering**: Filters like status, tags, and assignee are sent to the API. Date filtering is done client-side because the API requires exact timestamp matching.
- **`useMemo` for context values**: Prevents unnecessary re-renders of all consumers when the provider re-renders.

## Features Completed

### Core Requirements
- [x] Dashboard with 5 Kanban columns (Backlog, To Do, In Progress, Done, Cancelled)
- [x] Task cards with name, tags, due date, points, and assignee
- [x] Connected to the GraphQL API with Apollo Client
- [x] Loading spinners and error states
- [x] Empty state when no tasks match filters
- [x] Create task via modal (red "+" button)
- [x] Edit task via 3-dot menu
- [x] Delete task with confirmation dialog
- [x] Toast notifications for success/error feedback
- [x] Search by name (real-time filtering)
- [x] Advanced filters: status, assignee, due date, points, tags
- [x] Settings page with user profile from API

### Bonus Features (from challenge doc)
- [x] **Drag and drop** between columns — updates the task status via API on drop
- [x] **Task count per column** — displayed in the column header as `(03)`
- [x] **List view** — My Tasks page with a table layout grouped by status, collapsible sections
- [x] **Date color coding** — green (on time), yellow (< 2 days left), red (overdue). Applied both to the date text on task cards and to the left border accent on the list view rows
- [x] **Stagger animations** — cards animate in with a cascading delay on page load

### Additional Features (from Figma design)
- [x] **iOS-style 3D wheel date picker** — The Figma includes both Android and iPhone mobile designs. I chose the iPhone design, implementing the scroll-wheel date picker with 3D barrel rotation (using `@ncdai/react-wheel-picker`).
- [x] **Responsive mobile layout** — Sidebar becomes a slide-in drawer, bottom navigation bar for quick access, mobile tab navigation between Dashboard and Tasks.
- [x] **View toggle** — Switch between board (Kanban) and list (table) views using the toolbar icons.

### Additional Features (not in Figma, added to improve UX)
- [x] **Advanced filter panel** — The Figma only shows a search bar, but the challenge doc requires filtering by status, tags, assignee, due date, and estimated points. I added a collapsible filter panel with dropdowns and tag toggle buttons that sends filters to the API. Available in both Dashboard and My Tasks views.
- [x] **Error boundary** — Catches runtime errors and shows a recovery UI instead of a white screen.
- [x] **Click-outside to close** — Menus, dropdowns, and modals close when clicking outside.
- [x] **Keyboard support** — Escape key closes modals, accessible labels on all interactive elements.
- [x] **React Doctor 100/100** — Zero warnings for performance, accessibility, security, and maintainability.

## API

- **Backend**: `https://syn-api-production-e95c.up.railway.app/graphql`
- **Authentication**: Bearer token via `VITE_API_TOKEN` environment variable
- **Queries**: `tasks`, `profile`, `users`
- **Mutations**: `createTask`, `updateTask`, `deleteTask`
