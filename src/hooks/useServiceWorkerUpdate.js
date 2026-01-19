import { useCallback, useEffect, useState } from 'react';

export default function useServiceWorkerUpdate() {
  const [registration, setRegistration] = useState(null);
  const isSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

  useEffect(() => {
    if (!isSupported) {
      return undefined;
    }

    navigator.serviceWorker.ready
      .then((readyRegistration) => {
        setRegistration(readyRegistration);
      })
      .catch(() => undefined);

    const handler = (event) => {
      if (event?.detail?.registration) {
        setRegistration(event.detail.registration);
      }
    };

    window.addEventListener('sw-update-ready', handler);
    return () => window.removeEventListener('sw-update-ready', handler);
  }, [isSupported]);

  const dismissUpdate = useCallback(() => {
    setRegistration(null);
  }, []);

  const applyUpdate = useCallback(() => {
    if (!registration) {
      return;
    }

    let hasReloaded = false;
    const reload = () => {
      if (hasReloaded) {
        return;
      }
      hasReloaded = true;
      window.location.reload();
    };

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', reload, {
        once: true
      });
    }

    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      reload();
    }
  }, [registration]);

  return {
    isSupported,
    updateReady: Boolean(registration),
    applyUpdate,
    dismissUpdate
  };
}
