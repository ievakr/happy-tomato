import React from 'react';
import introImage from '../../assets/intro.png';

/**
 * Branded full-screen intro shown while the app boots (auth, code chunks, and
 * the initial calendar data). Replaces the plain "Loading…" spinners with the
 * Happy Tomato mascot so the very first thing users see is the brand.
 *
 * `label` is used only for screen readers; the image already carries the name.
 */
export default function IntroSplash({ label = 'Loading Happy Tomato…' }) {
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white"
      style={{ zIndex: 2000, padding: 'env(safe-area-inset-top) 1rem env(safe-area-inset-bottom)' }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <style>{`
        @keyframes happy-tomato-intro-pop {
          0% { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes happy-tomato-intro-breathe {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>

      <img
        src={introImage}
        alt="Happy Tomato"
        style={{
          width: 'min(72vw, 288px)',
          height: 'auto',
          maxHeight: '66vh',
          animation:
            'happy-tomato-intro-pop 0.45s ease-out both, happy-tomato-intro-breathe 2.6s ease-in-out 0.45s infinite',
        }}
      />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
