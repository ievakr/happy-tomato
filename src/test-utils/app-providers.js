import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../context/ToastContext';

/**
 * Minimal provider stack for rendering App or ContextWrapper in tests.
 */
export function AppTestProviders({ children, queryClient }) {
  const client =
    queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

export const mockAuthUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
};
