export type Route = { name: "home" } | { name: "post"; slug: string } | { name: "not-found"; path: string };

function basePath(): string {
  const base = import.meta.env.BASE_URL;
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

/** Pure core of {@link pathWithoutBase}: strip a known base prefix. No env access. */
export function stripBase(pathname: string, base: string): string {
  if (base !== "" && (pathname === base || pathname.startsWith(`${base}/`))) {
    const rest = pathname.slice(base.length);
    return rest === "" ? "/" : rest;
  }
  return pathname;
}

/** Pure core of {@link withBase}: prefix a path with a known base. No env access. */
export function joinBase(path: string, base: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base === "/" ? "" : base.replace(/\/$/, "")}${clean}`;
}

/** Strip the Pages sub-path (`/repo`) so routes match on `/…`; never hardcode `/`. */
export function pathWithoutBase(pathname: string, base: string = basePath()): string {
  return stripBase(pathname, base);
}

export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  return joinBase(path, base);
}

export function parseRoute(pathname: string, base?: string): Route {
  const path = base === undefined ? pathWithoutBase(pathname) : pathWithoutBase(pathname, base);
  if (path === "/") return { name: "home" };
  const post = path.match(/^\/post\/([^/]+)\/?$/);
  if (post?.[1]) return { name: "post", slug: decodeURIComponent(post[1]) };
  return { name: "not-found", path };
}

export function navigate(path: string): void {
  history.pushState(null, "", withBase(path));
  dispatchEvent(new PopStateEvent("popstate"));
}

export function currentRoute(): Route {
  return parseRoute(window.location.pathname);
}

/** Intercept same-origin app links so history navigation stays client-side. */
export function handleLinkClick(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  const anchor = (event.target as HTMLElement | null)?.closest?.("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) {
    return;
  }
  if (anchor.target === "_blank" || anchor.hasAttribute("download") || anchor.getAttribute("rel") === "external") {
    return;
  }
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || /^[a-z]+:/i.test(href)) return;
  let url: URL;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return;
  }
  if (url.origin !== window.location.origin) return;
  event.preventDefault();
  if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
    history.pushState(null, "", url.pathname + url.search);
    dispatchEvent(new PopStateEvent("popstate"));
  }
  if (url.hash) {
    document.getElementById(url.hash.slice(1))?.scrollIntoView();
  }
}
