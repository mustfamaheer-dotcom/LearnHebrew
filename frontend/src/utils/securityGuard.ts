/**
 * Enterprise Frontend Security Guard
 * Enforces client-side security policies:
 * 1. Blocks right-click context menu.
 * 2. Blocks DevTools inspection shortcuts (F12, Ctrl+Shift+I/J/C, Cmd+Opt+I/J/C, Ctrl+U).
 * 3. Prevents asset dragging and unauthorized source copying.
 * 4. Silences sensitive console logs in production environments.
 * 5. Implements anti-debugging and anti-tamper heartbeat.
 */

/**
 * Enterprise Frontend Security Guard
 * Cleaned up to allow standard browser interactions:
 * - Full right-click context menu enabled (Open in new tab, copy, inspect).
 * - Middle-click mouse wheel enabled to open tabs naturally.
 * - Standard keyboard shortcuts enabled.
 */

export const initSecurityGuard = (): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Image dragging protection only
  document.addEventListener(
    'dragstart',
    (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'IMG') {
        e.preventDefault();
      }
    },
    { capture: true }
  );
};

