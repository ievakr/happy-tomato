import React from 'react';

export default function OfflineBanner() {
  return (
    <div
      className="alert alert-warning mb-0 rounded-0 text-center small"
      role="status"
    >
      You are offline. Some features may be unavailable.
    </div>
  );
}
