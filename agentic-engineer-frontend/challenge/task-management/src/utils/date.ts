// Format a date string into a human-readable label (e.g. "TODAY", "YESTERDAY", "JULY 20, 2026")
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'TODAY';
  if (diffDays === -1) return 'YESTERDAY';

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).toUpperCase();
}

export type DateColor = 'green' | 'yellow' | 'red' | 'default';

// Determine the color indicator for a due date:
// red = overdue, yellow = due within 2 days, green = on time, default = today
export function getDateColor(dateString: string): DateColor {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = new Date(dateString);
  const target = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'red';
  if (diffDays === 0) return 'default';
  if (diffDays <= 2) return 'yellow';
  return 'green';
}

// Convert a point estimate enum value (e.g. "FOUR") into a display string ("4 Points")
export function getPointLabel(pointEstimate: string): string {
  const map: Record<string, string> = {
    ZERO: '0 Points',
    ONE: '1 Points',
    TWO: '2 Points',
    FOUR: '4 Points',
    EIGHT: '8 Points',
  };
  return map[pointEstimate] ?? pointEstimate;
}
