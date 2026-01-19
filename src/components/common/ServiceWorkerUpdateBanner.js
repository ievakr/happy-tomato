import React from 'react';

export default function ServiceWorkerUpdateBanner({ onReload, onDismiss }) {
  return (
    <div
      className="alert alert-info mb-0 rounded-0 d-flex flex-column flex-sm-row align-items-center justify-content-center gap-2"
      role="status"
    >
      <span className="small">A new version is available.</span>
      <div className="d-flex gap-2">
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={onReload}
        >
          Refresh
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={onDismiss}
        >
          Later
        </button>
      </div>
    </div>
  );
}
