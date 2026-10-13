/* The site is served at both `/` (chocolathon.vercel.app) and
   `/chocolathon/` (proxied from www.wsuaiclub.com). Always go through
   this for API calls; `/chocolathon/api/*` is rewritten to `/api/*`. */
export const apiUrl = (path: string): string => "/chocolathon" + path;
