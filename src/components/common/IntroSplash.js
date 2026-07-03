import React from 'react';
import introImage from '../../assets/intro.png';

/**
 * Branded full-screen intro shown once during app boot (auth + initial calendar data).
 * Mounted from App only — keep a single instance to avoid the tomato flashing in/out.
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
      <img
        src={introImage}
        alt="Happy Tomato"
        style={{
          display: 'block',
          width: 'min(72vw, 288px)',
          height: 'auto',
          maxHeight: '66vh',
        }}
      />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
