import { useCallback, useEffect, useState } from 'react';

export default function useServiceWorkerUpdate() {
  const [registration, setRegistration] = useState(null);
  const isSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

  useEffect(() => {
    if (!isSupported) {
      return undefined;
    }

    let isMounted = true;

    const handleUpdateReady = (nextRegistration) => {
      if (!isMounted) {
        return;
      }
      if (nextRegistration?.waiting && navigator.serviceWorker?.controller) {
        setRegistration(nextRegistration);
      }
    };

    navigator.serviceWorker.ready
      .then((readyRegistration) => {
        handleUpdateReady(readyRegistration);

        readyRegistration.addEventListener('updatefound', () => {
          const installingWorker = readyRegistration.installing;
          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              handleUpdateReady(readyRegistration);
            }
          });
        });
      })
      .catch(() => undefined);

    const handler = (event) => {
      if (event?.detail?.registration) {
        handleUpdateReady(event.detail.registration);
      }
    };

    window.addEventListener('sw-update-ready', handler);
    return () => {
      isMounted = false;
      window.removeEventListener('sw-update-ready', handler);
    };
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
    updateReady: Boolean(registration?.waiting),
    applyUpdate,
    dismissUpdate
  };
}
