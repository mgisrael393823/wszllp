/**
 * Route prefetching utility for lazy-loaded components
 * Preloads routes when users hover over navigation links
 */

// Map of route paths to their lazy component imports
const routeMap: Record<string, () => Promise<any>> = {
  '/calendar': () => import('../components/calendar/CalendarPage'),
  '/documents': () => import('../components/documents/DocumentManagement'),
  '/documents/list': () => import('../components/documents/DocumentList'),
  '/documents/upload': () => import('../components/documents/DocumentUploadForm'),
  '/documents/detail': () => import('../components/documents/DocumentDetail'),
  '/invoices': () => import('../components/invoices/InvoicesPage'),
  '/invoices/detail': () => import('../components/invoices/InvoiceDetail'),
  '/workflows': () => import('../components/workflows/WorkflowDashboard'),
  '/workflows/detail': () => import('../components/workflows/WorkflowDetail'),
  '/templates': () => import('../components/document-templates/TemplateList'),
  '/admin': () => import('../components/admin/AdminPage'),
  '/notifications': () => import('../components/notifications/NotificationsPage'),
  '/activity': () => import('../components/activity/ActivityPage'),
  '/contacts': () => import('../components/contacts/ContactsPage'),
  '/profile': () => import('../components/user/ProfilePage'),
  '/settings': () => import('../components/user/SettingsPage'),
  '/efile': () => import('../components/efile/EFilePage'),
  '/service-logs': () => import('../components/service-logs/ServiceLogsList'),
};

// Cache for already prefetched routes
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a route component
 * @param path - The route path to prefetch
 */
export const prefetchRoute = (path: string) => {
  // Skip if already prefetched
  if (prefetchedRoutes.has(path)) {
    return;
  }

  // Find the route import function
  const routeImport = routeMap[path];
  if (!routeImport) {
    // Try to match partial paths (e.g., /documents/* matches /documents)
    const partialMatch = Object.keys(routeMap).find(key => path.startsWith(key));
    if (partialMatch && routeMap[partialMatch]) {
      routeMap[partialMatch]();
      prefetchedRoutes.add(partialMatch);
    }
    return;
  }

  // Prefetch the component
  routeImport()
    .then(() => {
      prefetchedRoutes.add(path);
    })
    .catch(error => {
      console.warn(`Failed to prefetch route ${path}:`, error);
    });
};

/**
 * Prefetch multiple routes
 * @param paths - Array of route paths to prefetch
 */
export const prefetchRoutes = (paths: string[]) => {
  paths.forEach(prefetchRoute);
};

/**
 * Prefetch common routes that users are likely to visit
 * Call this after initial page load
 */
export const prefetchCommonRoutes = () => {
  // Wait a bit after initial load to avoid competing with critical resources
  setTimeout(() => {
    prefetchRoutes([
      '/documents',
      '/cases',
      '/invoices',
      '/calendar',
    ]);
  }, 2000);
};

/**
 * Hook to use in navigation components
 * Returns a handler for mouse enter events
 */
export const usePrefetch = (path: string) => {
  return {
    onMouseEnter: () => prefetchRoute(path),
    onFocus: () => prefetchRoute(path),
  };
};