import * as Sentry from '@sentry/react';

let initialized = false;

const getDsn = () => process.env.REACT_APP_SENTRY_DSN;

export const initSentry = () => {
  if (initialized) return;
  const dsn = getDsn();
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.REACT_APP_VERSION || undefined,
    tracesSampleRate: 0,
  });

  initialized = true;
};

export const setSentryUser = (userId) => {
  if (!getDsn()) return;
  if (!initialized) initSentry();
  Sentry.setUser(userId ? { id: userId } : null);
};

export const captureError = (error, context = {}) => {
  if (!getDsn()) return;
  if (!initialized) initSentry();

  Sentry.withScope((scope) => {
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    if (context.extras) {
      Object.entries(context.extras).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    if (context.contexts) {
      Object.entries(context.contexts).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }

    Sentry.captureException(error);
  });
};
