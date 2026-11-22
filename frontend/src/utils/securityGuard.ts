/**
 * Enterprise Frontend Security Guard
 * Enforces client-side security policies:
 * 1. Blocks right-click context menu.
 * 2. Blocks DevTools inspection shortcuts (F12, Ctrl+Shift+I/J/C, Cmd+Opt+I/J/C, Ctrl+U).
 * 3. Prevents asset dragging and unauthorized source copying.
 * 4. Silences sensitive console logs in production environments.
 * 5. Implements anti-debugging and anti-tamper heartbeat.
 */

export const initSecurityGuard = (): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 1. Disable Right-Click Context Menu
  document.addEventListener(
    'contextmenu',
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    },
    { capture: true }
  );

  // 2. Disable DevTools & Source Inspection Keyboard Shortcuts
  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      // F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl + Shift + I / J / C (DevTools, Console, Element Inspector)
      if (isCtrlOrCmd && e.shiftKey) {
        const key = e.key.toUpperCase();
        if (key === 'I' || key === 'J' || key === 'C') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // Mac: Cmd + Option + I / J / C
      if (e.metaKey && e.altKey) {
        const key = e.key.toUpperCase();
        if (key === 'I' || key === 'J' || key === 'C') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // Ctrl + U or Cmd + U (View Source)
      if (isCtrlOrCmd && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + S or Cmd + S (Save Page)
      if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    { capture: true }
  );

  // 3. Disable image dragging to protect platform media
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

  // 4. Production Console Silencing & Anti-Tamper Notice
  if (import.meta.env.PROD) {
    const noop = () => {};
    // Suppress verbose logs in production
    window.console.log = noop;
    window.console.debug = noop;
    window.console.info = noop;

    // Self-clearing console interval
    setInterval(() => {
      try {
        console.clear();
      } catch {
        // ignore
      }
    }, 5000);
  }

  // 5. Anti-Debugging Detector in Production
  if (import.meta.env.PROD) {
    setInterval(() => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const end = performance.now();
      if (end - start > 100) {
        // DevTools opened and execution paused
        try {
          console.clear();
        } catch {}
      }
    }, 2500);
  }
};
