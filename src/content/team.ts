/* ═══════════════════════════════════════════════════════════════════
   THE TEAM — the AI Club leadership who put Chocolathon on (2026-09-18).

   Static on purpose: the landing page's team section and the /team
   page both read this file, and neither needs a round trip to
   /api/hub for eight names that never change on the day. Order is
   the opening-ceremony slide. Not the whole leadership: the rest of
   the board is competing, so they are not listed here.

   Photos are 256px circles cut from each person's LinkedIn photo
   (DT's from his own portrait), in /public/chocolathon/team/, the
   same treatment as the judges and speakers.
   ═══════════════════════════════════════════════════════════════════ */

import { DTMEDIA_URL } from "./links";

export type TeamMember = {
  name: string;
  role: string;
  linkedin: string;
  photo: string;
  /* A second link beside LinkedIn, for a member with a site of their own. */
  site?: { label: string; url: string };
};

export const TEAM: TeamMember[] = [
  {
    name: "Michael Goldberg",
    role: "Co-Founder and President",
    linkedin: "https://www.linkedin.com/in/goldberg-michael/",
    photo: "/chocolathon/team/michael-goldberg.webp",
  },
  {
    name: "Shane Vithana",
    role: "AI Consultant",
    linkedin: "https://www.linkedin.com/in/shanvithana/",
    photo: "/chocolathon/team/shane-vithana.webp",
  },
  {
    name: "Ronish Rasaily",
    role: "VP of Engineering",
    linkedin: "https://www.linkedin.com/in/ronish-rasaily/",
    photo: "/chocolathon/team/ronish-rasaily.webp",
  },
  {
    name: "Alexis Gandanzara",
    role: "Director of Marketing",
    linkedin: "https://www.linkedin.com/in/alexis-gandanzara/",
    photo: "/chocolathon/team/alexis-gandanzara.webp",
  },
  {
    name: "Jeena Kirby-Moore",
    role: "Director of Social Media",
    linkedin: "https://www.linkedin.com/in/jeena-moore-kirby/",
    photo: "/chocolathon/team/jeena-kirby-moore.webp",
  },
  {
    name: "DT",
    role: "Founder and CEO, DTMedia",
    linkedin: "https://www.linkedin.com/in/akindotun-ogunbiyi-99442b34a/",
    photo: "/chocolathon/team/dt.webp",
    site: { label: "DTMedia", url: DTMEDIA_URL },
  },
  {
    name: "Aurora Parnell",
    role: "Event Coordinator",
    linkedin: "https://www.linkedin.com/in/aurora-parnell/",
    photo: "/chocolathon/team/aurora-parnell.webp",
  },
  {
    name: "Nya Vargas",
    role: "Graphic Design",
    linkedin: "https://www.linkedin.com/in/nya-vargas-05353631b/",
    photo: "/chocolathon/team/nya-vargas.webp",
  },
];
