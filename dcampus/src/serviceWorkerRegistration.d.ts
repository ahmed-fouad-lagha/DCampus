// This file is used to declare types for the service worker registration module
// No need for 'declare module' since we're using a direct import

export function register(config?: {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}): void;

export function unregister(): void;