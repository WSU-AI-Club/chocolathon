/* DTMedia's block (added 2026-09-15). DTMedia is a social media and
   digital content agency run by DT (Akindotun Ogunbiyi), a WSU student
   and AI Club member, and it is covering the event on the 19th. It sits
   right after OCPD's block because the two are the same shape, one mark
   plus two lines, and the point of this one is the line that says a
   student built it. The one difference from OCPD is the link out: the
   block exists to send people to his site. Keep it that brief. */

import { DTMEDIA_URL } from "./links";

export default function CoveredBySection() {
  return (
    <section className="border-t border-ink/10 bg-white px-5 py-20 text-center">
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <img
          src="/chocolathon/sponsors/dtmedia.png"
          alt="DTMedia"
          className="h-10 w-auto md:h-12"
        />
        <h2 className="mt-8 font-display text-2xl font-semibold leading-tight tracking-tight text-ink md:text-3xl">
          Filmed by one of our own.
        </h2>
        <p className="mt-3 max-w-md text-base leading-relaxed text-ink/80">
          DTMedia is a social media and digital content agency built by DT, a
          WSU student and AI Club member: photography, video, brand strategy,
          and web design. He is behind the camera all day on the 19th.
        </p>
        <div className="mt-7 flex justify-center">
          <a
            className="btn-ghost !bg-white"
            href={DTMEDIA_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            See DTMedia&rsquo;s work
          </a>
        </div>
      </div>
    </section>
  );
}
