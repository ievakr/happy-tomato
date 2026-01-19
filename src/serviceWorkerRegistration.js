// Register a basic service worker for offline support.
export const register = (config) => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        if (!config) {
          return;
        }

        const notifyWaitingUpdate = () => {
          if (registration.waiting && navigator.serviceWorker.controller && config.onUpdate) {
            config.onUpdate(registration);
          }
        };

        if (config.onUpdate) {
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (!installingWorker) {
              return;
            }

            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  config.onUpdate(registration);
                } else if (config.onSuccess) {
                  config.onSuccess(registration);
                }
              }
            });
          });
        }

        // Handle already waiting updates (e.g., devtools Update)
        notifyWaitingUpdate();
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  });
};

export const unregister = () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.ready
    .then((registration) => {
      registration.unregister();
    })
    .catch(() => undefined);
};
