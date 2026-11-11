/**
 * Native Web Vibration API utility for tactile haptic feedback on mobile devices.
 * Gracefully degrades to a no-op on desktop or unsupported devices.
 */
export const haptics = {
  /**
   * Subtle tick for tab switches, navigation, and pill dock clicks
   */
  tap: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // Safe fallback
      }
    }
  },

  /**
   * Crisp celebratory double-pulse for correct answers, point earnings, or streak saves
   */
  success: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([15, 40, 25]);
      } catch {
        // Safe fallback
      }
    }
  },

  /**
   * Double buzz for validation errors or incorrect flashcard matches
   */
  error: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch {
        // Safe fallback
      }
    }
  },
};
