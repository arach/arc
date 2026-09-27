/**
 * Canonical origin + mount path for the site build.
 *
 * Vite sets BASE_URL to `base` from vite.config ('/arc/' on hudsonkit.com,
 * '/' on arc.jdi.sh), so the same bundle can live at either root — the
 * canonical URL is derived from where the page is actually served, with
 * VITE_SITE_URL as an explicit override.
 */
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined) ??
  (typeof window !== 'undefined'
    ? window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, '')
    : 'https://arc.jdi.sh')
