import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

const RouterContext = createContext<{ path: string; navigate: (p: string) => void }>({
  path: '/',
  navigate: () => {},
});
const RouteParamsContext = createContext<Record<string, string>>({});

function normalizePath(path: string): string {
  const [withoutQuery] = path.split('?');
  const cleaned = withoutQuery.replace(/^#/, '').replace(/\/+$/, '');
  if (!cleaned || cleaned === '/') return '/';
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

function matchRoute(routePath: string, currentPath: string): { matched: boolean; params: Record<string, string> } {
  if (routePath === '/' && currentPath === '/dashboard') return { matched: true, params: {} };
  if (routePath === currentPath) return { matched: true, params: {} };

  const routeSegments = routePath.split('/').filter(Boolean);
  const currentSegments = currentPath.split('/').filter(Boolean);
  if (routeSegments.length !== currentSegments.length) return { matched: false, params: {} };

  const params: Record<string, string> = {};
  for (let i = 0; i < routeSegments.length; i += 1) {
    const routeSeg = routeSegments[i];
    const currentSeg = currentSegments[i];
    if (routeSeg.startsWith(':')) {
      params[routeSeg.slice(1)] = decodeURIComponent(currentSeg);
      continue;
    }
    if (routeSeg !== currentSeg) return { matched: false, params: {} };
  }
  return { matched: true, params };
}

export function HashRouter({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => normalizePath(window.location.hash.replace('#', '') || '/dashboard'));

  useEffect(() => {
    const onHashChange = () => setPath(normalizePath(window.location.hash.replace('#', '') || '/dashboard'));
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) window.location.hash = '/dashboard';
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (newPath: string) => {
    window.location.hash = newPath;
  };

  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
}

export function useNavigate() {
  return useContext(RouterContext).navigate;
}

export function useLocation() {
  return { pathname: useContext(RouterContext).path };
}

export function useParams<T extends Record<string, string> = Record<string, string>>() {
  return useContext(RouteParamsContext) as T;
}

export function Routes({ children }: { children: ReactNode }) {
  const { path } = useContext(RouterContext);
  let match: ReactNode = null;
  let params: Record<string, string> = {};
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const routePath = (child as ReactElement<{ path: string }>).props.path;
    const routeMatched = matchRoute(routePath, path);
    if (routeMatched.matched) {
      match = child;
      params = routeMatched.params;
    }
  });

  if (!match) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">404 - 页面未找到</div>;
  return <RouteParamsContext.Provider value={params}>{match}</RouteParamsContext.Provider>;
}

export function Route(props: { path: string; element: ReactNode }) {
  return <>{props.element}</>;
}
