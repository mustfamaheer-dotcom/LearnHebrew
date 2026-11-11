import confetti from 'canvas-confetti';

/**
 * High-performance canvas-confetti celebration triggers
 */
export const triggerConfetti = {
  /**
   * Classic side-cannon burst for lesson bookings and test completion
   */
  celebrate: () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#0d4e5f', '#14b8a6', '#f59e0b', '#8b5cf6', '#10b981'],
        disableForReducedMotion: true,
      });
    } catch {
      // Fallback
    }
  },

  /**
   * Grand fireworks burst for streak milestones, 100% quiz scores, and level promotions
   */
  fireworks: () => {
    try {
      const end = Date.now() + 1.2 * 1000;
      const colors = ['#0d4e5f', '#2dd4bf', '#fbbf24', '#a855f7'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.75 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.75 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch {
      // Fallback
    }
  },
};
