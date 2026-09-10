/* Standalone dev harness AND the route switch.

   There is deliberately no router dependency here. The site has exactly
   two views, and INTEGRATION.md's plan is for this page to eventually be
   mounted inside the club site's own router — a second router in this
   repo would have to be unpicked at that point. Twenty lines of pathname
   matching costs nothing and unpicks itself.

   When this does fold into the club site, register BOTH routes, and
   register them in the PUBLIC block: the competitor gate does its own
   auth against /api/hub, so a host-app auth redirect in front of it
   would send registered students to the wrong login screen. */

import { Suspense, lazy } from "react";

import ChocolathonPage from "./ChocolathonPage";
import { JUDGE_PATH, PEOPLE_PATH, UPLOAD_PATH } from "./content/links";

/* Lazy so the landing page never downloads the hub. Not a security
   measure — the gate is server-side — just weight. */
const CompetitorApp = lazy(() => import("./competitor/CompetitorApp"));
const JudgePage = lazy(() => import("./judge/JudgePage"));
const UploadPage = lazy(() => import("./upload/UploadPage"));
const PeoplePage = lazy(() => import("./people/PeoplePage"));

/* Matches /hq, /hq/, a mounted prefix such as /chocolathon/hq, and the
   older /prompts and /competitors paths so any link sent out before
   2026-09-06 keeps working. */
function isCompetitorRoute(pathname: string): boolean {
  return /(^|\/)(hq|prompts|competitors)\/?$/i.test(pathname);
}

/* The unlisted judge page; the token lives in links.ts. */
function isJudgeRoute(pathname: string): boolean {
  return new RegExp(`(^|/)${JUDGE_PATH.slice(1)}/?$`, "i").test(pathname);
}
function isUploadRoute(pathname: string): boolean {
  return new RegExp(`(^|/)${UPLOAD_PATH.slice(1)}/?$`, "i").test(pathname);
}
/* The public judges-and-speakers page (2026-09-10). */
function isPeopleRoute(pathname: string): boolean {
  return new RegExp(`(^|/)${PEOPLE_PATH.slice(1)}/?$`, "i").test(pathname);
}

export default function App() {
  if (typeof window !== "undefined" && isUploadRoute(window.location.pathname)) {
    return (
      <Suspense fallback={null}>
        <UploadPage />
      </Suspense>
    );
  }
  if (typeof window !== "undefined" && isJudgeRoute(window.location.pathname)) {
    return (
      <Suspense fallback={null}>
        <JudgePage />
      </Suspense>
    );
  }
  if (typeof window !== "undefined" && isPeopleRoute(window.location.pathname)) {
    return (
      <Suspense fallback={null}>
        <PeoplePage />
      </Suspense>
    );
  }
  if (typeof window !== "undefined" && isCompetitorRoute(window.location.pathname)) {
    return (
      <Suspense fallback={null}>
        <CompetitorApp />
      </Suspense>
    );
  }
  return <ChocolathonPage />;
}
