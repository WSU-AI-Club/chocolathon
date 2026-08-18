# Frame pipeline — how the film was made (and how to remake it)

The scroll film is 121 WebP frames in `public/frames/`, built from two Higgsfield
Kling 3.0 clips generated off the **real Cocoa Dolce product photos**. Total cost:
~25 credits. This folder is local tooling only — nothing here ships.

## The trick that made it work

1. **Never generate independent stills** — they don't cohere frame to frame.
2. **Generate the lid CLOSING, play it reversed.** Closing is more stable to
   generate, and reversed it means the "opening" payoff frame users dwell on is
   the real photograph.
3. **Pin both endpoints.** The closed state is a Nano Banana Pro still made from
   the real photos (plain navy lid top, gold side lettering — matching the actual
   packaging, which the video model got wrong on its own). The clip was generated
   with `--start-image` (real open photo) AND `--end-image` (that still), so any
   AI text-warping only exists mid-motion where the eye reads it as blur.
4. **Chain acts through a real anchor.** Act A ends (reversed) on the real open
   photo; Act B (bonbons rising) was generated FROM that same photo. The junction
   is seamless by construction.

## Regeneration commands

```powershell
# 1. Pristine closed-box still (both real photos as references)
higgsfield generate create nano_banana_pro `
  --prompt "<closed box description — plain navy top, gold side lettering>" `
  --image "<real closed-stack photo>" --image "<real open-box photo>" `
  --aspect_ratio 1:1 --resolution 2k --wait

# 2. Lid-close clip, both endpoints pinned
higgsfield generate create kling3_0 `
  --prompt "<locked camera, lid slowly closes, chocolates still>" `
  --start-image "<real open-box photo>" --end-image "<closed still from step 1>" `
  --duration 5 --aspect_ratio 1:1 --mode std --sound off --wait

# 3. Bonbons-rise clip from the same real photo
higgsfield generate create kling3_0 `
  --prompt "<locked camera, bonbons lift and float, slowly rotating>" `
  --start-image "<real open-box photo>" `
  --duration 5 --aspect_ratio 1:1 --mode std --sound off --wait

# 4. Extract: act A reversed + halved, act B forward + halved
ffmpeg -i act2_lidclose_v2.mp4 -vf "reverse,select='not(mod(n\,2))'" -vsync vfr `
  -c:v libwebp -quality 78 tmpA\a_%03d.webp
ffmpeg -i act3_bonbons_v1.mp4 -vf "select='not(mod(n\,2))'" -vsync vfr `
  -c:v libwebp -quality 78 tmpB\b_%03d.webp

# 5. Renumber into public/frames/f_000..f_120.webp:
#    A gives 001-061; B contributes from its SECOND frame (its first duplicates
#    the junction photo that A already ends on).
```

If frame count or act boundaries change, update `FRAME_COUNT` and the beat map
comment in `src/film/ScrollFilm.tsx`, and the beat reference comment in
`src/content/panels.config.tsx`.

## Clip inventory (in `clips/`)

| File | What | Status |
|---|---|---|
| `hero_closed_v2.png` | closed box WITH circular emblem on lid top (Michael's brand call, 2026-08-14) | **in use** (lid clip v3 endpoint) |
| `constellation_v1.png` | floating bonbons w/ correct flat-based dome shapes (refs: open-box photo + `artisan-dark-chocolate-truffles-assortment.webp`) | **in use** (bonbons v2 endpoint) |
| `act2_lidclose_v3.mp4` | Kling 3.0, pinned to hero v2 | **in use** → frames 0–60 reversed |
| `act3_bonbons_v2.mp4` | Kling 3.0, pinned to constellation — domes, not spheres | **in use** → frames 61–120 |
| `hero_closed_v1.png` | plain-top closed still | superseded — Michael wants the emblem on top |
| `act2_lidclose_v2.mp4` | pinned to plain-top hero | superseded |
| `act3_bonbons_v1.mp4` | bonbons rose as glossy SPHERES | **rejected — wrong chocolate shape.** The real bonbons are truncated domes with flat bases (see the truffle assortment photo). Video models drift to spheres unless the end frame pins the shapes. |
| `act2_lidclose_v1.mp4` | first attempt, no end pin | rejected — hallucinated lid-top logo styling |

**Shape rule for any future chocolate generation:** always reference
`artisan-dark-chocolate-truffles-assortment.webp` — flat-based dome / gumdrop
shapes, satin speckled finish, never glossy spheres or marbles.
