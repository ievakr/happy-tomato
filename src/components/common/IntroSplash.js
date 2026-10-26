import React from 'react';
import introImage from '../../assets/intro.png';
import './IntroSplash.css';

/**
 * Brief branded moment shown while the app starts.
 * The artwork (tomato and the original green wordmark) pulses once.
 */
export default function IntroSplash({ label = 'Happy Tomato' }) {
  return (
    <div
      className="intro-splash"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <img className="intro-splash-logo" src={introImage} alt="" />
    </div>
  );
}
