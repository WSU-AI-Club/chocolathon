/* The team's video, in the card. YouTube, Vimeo, Google Drive and Loom
   become a player; a SharePoint link, a bare file, or anything the
   parser does not know becomes a large button instead. The outbound
   link is always there under it, because a player can still refuse to
   load (an unlisted video set to no-embed, a Drive file shared to one
   account) and a judge on a clock needs one obvious way out. */

import { videoEmbed } from "../judging/embed";

export default function VideoEmbed({ url, team }: { url: string; team: string }) {
  const embed = url ? videoEmbed(url) : null;

  return (
    <div className="mt-6">
      {embed ? (
        <iframe
          src={embed.src}
          loading="lazy"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full rounded-sm border border-ink/10"
          title={`${team} video`}
        />
      ) : url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn-cta">
          Watch the video
          <span aria-hidden="true">→</span>
        </a>
      ) : (
        <p className="text-base leading-relaxed text-ink/80">This team did not leave a video link.</p>
      )}

      {url ? (
        <p className="mt-3">
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn-ghost-sm">
            Open the video in a new tab
          </a>
        </p>
      ) : null}
    </div>
  );
}
