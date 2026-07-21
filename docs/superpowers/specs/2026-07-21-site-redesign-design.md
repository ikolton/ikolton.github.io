# Personal site redesign — design doc

Date: 2026-07-21
Status: approved, pending implementation plan

## Context

The current site (`ikolton.github.io`, Astro + Tailwind + DaisyUI) was built as a student for fun and now looks dated/templated. The owner is now a PhD student in Computer Science at Jagiellonian University, working on machine learning, computer vision, and generative models, with applications ranging from medical imaging (primary focus) to AI safety. Goal: a minimal, professional, inviting site that sells them well to other researchers — credible for collaboration, postdoc/faculty search, conference contacts — while remaining a clean CV/publication record.

## Visual identity

- **Dark-first**: default theme follows `prefers-color-scheme`, with an explicit light/dark toggle (persisted via localStorage, replacing the current DaisyUI `theme-change` multi-theme picker with a simple two-state toggle).
- **Typography**: clean sans stack for body/UI; monospace accent (`ui-monospace` stack) used sparingly for labels, tags, and metadata (e.g. "PHD STUDENT · COMPUTER SCIENCE", research tags).
- **Color**: near-black/near-white neutrals as the base; one accent color (teal, as validated in the brainstorm mockup: `#6ee7c7` dark / `#0f9d6d` light) used sparingly for links/labels/highlights — not spread across buttons and cards the way DaisyUI's default component styling does today.
- **Layout language**: generous whitespace, left-aligned hero/content (not centered), thin 1px hairline dividers instead of shadowed/bordered DaisyUI cards, tag-style pills for research areas and publication topics.
- Direction validated via brainstorm mockups: "Technical Minimal" (dark, mono accents, grid-driven) was the chosen tone, adjusted for light-mode parity and borrowing information-density/structure conventions from classic academic faculty pages (clear nav, sectioned content, skimmable publication list) rather than staying purely stylistic.

## Information architecture

Nav: **Home · Research · Publications · CV · Contact**

- **Home** — photo, one-line bio (see Content updates below), current focus called out with medical imaging first, other areas (computer vision, generative models, AI safety) mentioned as lighter secondary interests, a short "recent publications" preview, links to Research/Publications/CV.
- **Research** — expands on the bio: focus areas as structured entries, medical imaging prominent, others secondary. Replaces the current `research_areas` array's DaisyUI-card visual treatment with the new pill/section style.
- **Publications** — full publication list, populated from the build-time auto-fetch (see below). Replaces `src/pages/papers.astro`'s DaisyUI card rendering.
- **CV** — keeps the existing `cv.ts`-driven timeline approach (education, experience, awards) via `CvTimeline.astro`, restyled to drop DaisyUI classes in favor of the new design system.
- **Contact** — email + socials (LinkedIn, GitHub, Google Scholar), kept simple, no contact form.

**Not built now, structurally reserved for later:**
- **Projects** (`src/pages/projects.astro`, `src/data/projects.ts`) — files kept in the repo but unrouted/unlinked from nav. Re-enable by re-adding the nav link when wanted.
- **Blog** (`src/content/BlogPosts/`, `src/content.config.ts`) — stays disabled via `template.enableBlog = false`, unchanged from current behavior.

**Removed outright:**
- **Afterhours** (`src/pages/afterhours.astro`) — deleted entirely, not just unlinked. Doesn't fit the professional-researcher framing and there's no plan to bring it back as-is.

## Publications auto-fetch

Today's `papers.astro` reads a **manually maintained** array (`publications` in `src/data/cv.ts`) — there is no existing automated fetch despite the git history mentioning "auto-populate." The redesign adds a real one:

- A build-time Node script (e.g. `scripts/fetch-publications.ts`) calls the **Semantic Scholar API** (free, official, no key required for basic author-lookup use) using the owner's Semantic Scholar author ID, and writes a generated data file (e.g. `src/data/publications.generated.json`).
- The script runs as a `prebuild` step (or equivalent Astro/CI hook) before `astro build`, so the GitHub Actions deploy workflow picks up new papers automatically on each deploy.
- Publications data is split out of `cv.ts` into its own module/type so the fetch script and the CV timeline (education/experience/awards, which stay manually maintained in `cv.ts`) aren't tangled together.
- The fetch is abstracted behind a source-specific function (e.g. `fetchFromSemanticScholar(): Publication[]`) so adding another source (ORCID, arXiv) later is additive — a new function plus a merge/de-dupe step — not a rewrite. Not needed today (only 2 preprints currently), explicitly deferred.
- **Resilience**: if the Semantic Scholar API call fails at build time (network issue, rate limit), the build must not fail outright — fall back to the last committed generated file so an external API hiccup doesn't block deploying unrelated changes.
- Pages (`Publications`, Home's "recent publications" preview) read from the generated file, using the existing `Publication` type shape (`title`, `authors`, `journal`/venue, `time`, `link`, `repo`, `abstract`) already defined in `src/types/cv.ts`, adjusted as needed to match what Semantic Scholar actually returns.

## Tech stack

- **Keep Astro** as the static site generator and GitHub Pages deploy pipeline (`.github/workflows/deploy.yml`) — the "dated" feel comes from DaisyUI's off-the-shelf component styling, not from Astro itself, and Astro remains well-suited to a low-maintenance static personal site.
- **Remove `daisyui`** dependency and its entry in `tailwind.config.mjs`.
- Rebuild `src/components/ui/*` as plain Tailwind-styled Astro components implementing the new design system, same responsibilities as today:
  - `Navbar.astro`, `Hero.astro`, `Footer.astro`, `PublicationsList.astro`, `CvTimeline.astro`, `SocialIcons.astro`, `ThemeSelector.astro`/`DarkLightController.astro`, `Grid.astro`, `List.astro`, `ArticleList.astro` (only relevant if blog re-enabled), `Pagination.astro` (only relevant if blog re-enabled), `BetterIcon.astro`.
  - `ThemeSelector`/`DarkLightController` simplified from DaisyUI's arbitrary multi-theme picker (`retro`/`coffee`) to a two-state light/dark toggle, defaulting to `prefers-color-scheme`, persisted via localStorage (can keep using the `theme-change` package or drop it for a minimal custom implementation — implementation plan to decide).

## Content updates

- `src/settings.ts`:
  - `profile.title`: `'MS student in Computer Science'` → `'PhD student in Computer Science'`.
  - Bio/one-liner reflects: *"PhD student in Computer Science at Jagiellonian University, working on machine learning, computer vision, and generative models, with applications ranging from medical imaging to AI safety."*
  - `profile.research_areas`: reordered so **Medical Data Analysis leads**; Gaussian Splatting and Adversarial Attacks with RL remain but are visually secondary (smaller/less prominent treatment on Home, full detail still on Research page).
- Photo: kept on Home (existing assets in `src/assets/` — `profile_pictures.jpg` / `profile_pictures1.jpg` — pick one during implementation, or ask for a new one).

## Out of scope for this redesign

- Projects and Blog content/pages (structurally reserved, not built or linked).
- ORCID/arXiv publication sources (deferred, abstraction left open).
- Contact form (email/socials only).
- Any change to the GitHub Pages / GitHub Actions deploy mechanism itself.
