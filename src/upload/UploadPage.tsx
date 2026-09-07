/* ═══════════════════════════════════════════════════════════════════
   UPLOAD PAGE — drop the form export, publish it to the judges.

   For Michael at 2:15 on September 19. Drag the Excel workbook (or a
   CSV) that Microsoft Forms produced onto this page. It is parsed in the
   browser, the columns are matched the same way the command-line script
   matches them, a preview shows what the judges would see, and Publish
   sends it to /api/judging with the upload key. Nothing else on the site
   changes; the judge page reads the new set on refresh.

   The upload key is asked for once and kept in this browser. The page
   is unlisted; the key is what actually protects the write.
   ═══════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";

import { JUDGE_PATH } from "../content/links";
import { mapRows, type Judging } from "../judge/mapRows";
import "../chocolathon.css";

const KEY_STORAGE = "choco-upload-key";

type Parsed = { judging: Judging; missing: string[]; headers: string[] };

export default function UploadPage() {
  const [key, setKey] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [live, setLive] = useState<{ count: number; publishedAt?: string } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    document.title = "Chocolathon — Publish submissions";
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    try {
      setKey(localStorage.getItem(KEY_STORAGE) ?? "");
    } catch {
      /* private window; the field starts empty */
    }
    return () => tag.remove();
  }, []);

  const refreshLive = useCallback(async () => {
    try {
      const r = await fetch("/api/judging", { cache: "no-store" });
      if (!r.ok) {
        setLive(null);
        return;
      }
      const j = (await r.json()) as Judging;
      setLive({ count: j.count, publishedAt: j.publishedAt });
    } catch {
      setLive(null);
    }
  }, []);

  useEffect(() => {
    void refreshLive();
  }, [refreshLive]);

  const readFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "" });
      if (rows.length < 2) {
        setError("That file has a header row but no responses.");
        setParsed(null);
        return;
      }
      const [header, ...data] = rows;
      const { judging, missing } = mapRows(header.map(String), data.map((r) => r.map(String)), file.name);
      setParsed({ judging, missing, headers: header.map(String) });
    } catch {
      setError("Could not read that file. It should be the Excel workbook from Forms, or a CSV.");
      setParsed(null);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) void readFile(f);
    },
    [readFile],
  );

  async function publish() {
    if (!parsed || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      localStorage.setItem(KEY_STORAGE, key);
    } catch {
      /* fine */
    }
    try {
      const r = await fetch("/api/judging", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-upload-key": key.trim() },
        body: JSON.stringify(parsed.judging),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j?.error ?? `Publish failed (${r.status}).`);
      } else {
        setResult(`Published ${j.count} submissions. Judges refresh and they are there.`);
        void refreshLive();
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const build = parsed?.judging.submissions.filter((s) => s.track === "build") ?? [];
  const pitch = parsed?.judging.submissions.filter((s) => s.track === "pitch") ?? [];
  const canPublish = !!parsed && parsed.missing.length === 0 && key.trim().length > 0 && !busy;

  return (
    <div className="choco-root min-h-screen bg-white">
      <main className="mx-auto max-w-3xl px-5 pb-32 pt-16 sm:px-8">
        <p className="label label-strong">Chocolathon · Publish submissions</p>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink">
          Drop the export here.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
          At 2:15: in Forms, Responses, "Open in Excel". Drag that workbook onto the box
          below, check the preview, publish. The judge page updates on refresh.
        </p>

        <p className="label mt-8">
          {live
            ? `Judges currently see ${live.count} submissions` +
              (live.publishedAt
                ? `, published ${new Date(live.publishedAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: "America/Chicago",
                  })}`
                : "")
            : "Judges currently see nothing published"}
        </p>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={
            "mt-8 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed px-6 text-center transition-colors " +
            (dragging ? "border-ink bg-ink/[0.04]" : "border-ink/30 hover:border-ink/60")
          }
        >
          <span className="font-display text-2xl font-semibold text-ink">
            {parsed ? parsed.judging.source : "Drag the Excel file here"}
          </span>
          <span className="mt-2 text-base text-ink/80">or click to choose a file · .xlsx or .csv</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void readFile(f);
            }}
          />
        </label>

        {error ? (
          <p role="alert" className="mt-6 border-l-2 border-gold pl-4 text-base text-ink">
            {error}
          </p>
        ) : null}

        {parsed ? (
          <section className="mt-10 border-t border-ink/15 pt-8">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
              {parsed.judging.count} submissions
            </h2>
            <p className="label mt-2">
              {build.length} Build · {pitch.length} Pitch
              {parsed.judging.sample ? " · sample file" : ""}
            </p>

            {parsed.missing.length ? (
              <p role="alert" className="mt-5 border-l-2 border-gold pl-4 text-base text-ink">
                Could not find a column for: {parsed.missing.join(", ")}. The headers in the file
                are: {parsed.headers.join(" | ")}
              </p>
            ) : null}

            <ol className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
              {parsed.judging.submissions.map((s) => (
                <li key={s.n} className="grid gap-1 py-3 sm:grid-cols-[3rem_1fr] sm:gap-4">
                  <span className="label">{s.track === "build" ? "Build" : "Pitch"}</span>
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-ink">
                      {s.team || <em className="font-normal text-ink/80">no team name</em>}
                      {s.prompt ? <span className="label ml-3">{s.prompt}</span> : null}
                    </span>
                    <span className="block truncate text-sm text-ink/80">
                      {s.sentence || s.product}
                    </span>
                    {!s.product || !s.video ? (
                      <span className="label label-accent block">missing a link</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end">
              <label className="flex-1">
                <span className="label">Upload key</span>
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  autoComplete="off"
                  className="mt-2 w-full border-0 border-b-2 border-ink/20 bg-transparent px-0 py-2 text-base text-ink outline-none focus:border-gold"
                />
              </label>
              <button
                type="button"
                onClick={() => void publish()}
                disabled={!canPublish}
                className="btn-cta disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Publishing…" : "Publish to the judges"}
              </button>
            </div>

            {result ? (
              <p className="mt-6 border-l-2 border-gold pl-4 text-base text-ink">
                {result}{" "}
                <a href={JUDGE_PATH} target="_blank" rel="noopener noreferrer" className="underline decoration-gold underline-offset-4">
                  Open the judge page
                </a>
              </p>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
