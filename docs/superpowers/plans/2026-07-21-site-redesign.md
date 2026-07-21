# Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current DaisyUI-styled Astro site into a minimal, dark-first, professionally-designed personal site for a PhD student, with a real build-time publications fetch from Semantic Scholar, per `docs/superpowers/specs/2026-07-21-site-redesign-design.md`.

**Architecture:** Keep Astro + Tailwind. Drop the `daisyui` plugin and its component classes entirely; replace with hand-written Tailwind utility markup using Tailwind's built-in `dark:` variant (class-based dark mode) and the built-in `emerald` palette as the accent, matching the teal accent validated in brainstorming mockups. Publications move from a hand-maintained array in `cv.ts` into a generated JSON file produced by a `prebuild` script that calls the Semantic Scholar API, with graceful fallback to the last-committed file on fetch failure.

**Tech Stack:** Astro 5, Tailwind CSS 3 (no DaisyUI), `@tailwindcss/typography`, Vitest (new — for the publications-fetch logic), `tsx` (new — to run the TypeScript prebuild script), Node 22.

**Testing note:** This repo has no test framework today and most of the redesign is presentational Astro/Tailwind markup with no meaningful unit-testable logic — for those tasks, "test" means running `npm run dev` and visually comparing against the approved mockups at `.superpowers/brainstorm/53545-1784622641/content/visual-style.html` and `light-dark.html`. The one piece of real logic — mapping Semantic Scholar API responses into `Publication` objects — gets proper TDD with Vitest, since that's where bugs (wrong field mapping, missing fallback) would actually bite silently.

---

## Task 1: Remove DaisyUI

**Files:**
- Modify: `package.json`
- Modify: `tailwind.config.mjs`

- [ ] **Step 1: Uninstall the DaisyUI and theme-change packages**

Run: `npm uninstall daisyui theme-change`

- [ ] **Step 2: Replace `tailwind.config.mjs` contents**

```js
/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
    theme: {
        extend: {},
    },
    plugins: [require("@tailwindcss/typography")],
};
```

- [ ] **Step 3: Verify the build still runs (it will render unstyled/broken until later tasks restyle components — that's expected)**

Run: `npm run build`
Expected: build completes without a "Cannot find module 'daisyui'" error. Visual breakage is expected and fixed in later tasks.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json tailwind.config.mjs
git commit -m "Remove DaisyUI in favor of hand-written Tailwind styling"
```

---

## Task 2: Set up Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest and tsx**

Run: `npm install -D vitest tsx`

- [ ] **Step 2: Add a `test` script to `package.json`**

In the `"scripts"` block, add:

```json
"test": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
```

- [ ] **Step 4: Verify Vitest runs with zero tests found**

Run: `npm test`
Expected: Vitest reports "No test files found" (or similar) with exit code — this is fine, it confirms the runner works before Task 3 adds real tests.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "Add Vitest for testing publication-fetch logic"
```

---

## Task 3: Publications type and Semantic Scholar mapping (TDD)

**Files:**
- Modify: `src/types/cv.ts`
- Create: `src/data/publications/fetchSemanticScholar.ts`
- Test: `src/data/publications/fetchSemanticScholar.test.ts`

- [ ] **Step 1: Remove the `Publication` interface's dependency on manual authorship — no change needed to the type itself.** Confirm current shape in `src/types/cv.ts` stays as-is:

```ts
export interface Publication {
  title: string;
  authors: string;
  journal: string;
  time: string;
  link?: string;
  repo?: string;
  abstract?: string;
}
```

(No edit needed here — this step just confirms the target shape the mapper must produce. Skip to Step 2.)

- [ ] **Step 2: Write the failing tests for `mapSemanticScholarPaper`**

Create `src/data/publications/fetchSemanticScholar.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { mapSemanticScholarPaper, fetchSemanticScholarPublications } from "./fetchSemanticScholar";

describe("mapSemanticScholarPaper", () => {
  it("maps a full paper with an arXiv id to a Publication", () => {
    const paper = {
      paperId: "abc123",
      title: "ReLAPSe: Reinforcement-Learning-trained Adversarial Prompt Search",
      year: 2026,
      venue: "",
      abstract: "Machine unlearning is a key defense mechanism...",
      authors: [{ name: "Ignacy Kolton" }, { name: "Kacper Marzol" }],
      externalIds: { ArXiv: "2602.00350" },
      openAccessPdf: null,
    };

    const result = mapSemanticScholarPaper(paper);

    expect(result).toEqual({
      title: "ReLAPSe: Reinforcement-Learning-trained Adversarial Prompt Search",
      authors: "Ignacy Kolton, Kacper Marzol",
      journal: "arXiv:2602.00350",
      time: "2026",
      link: "https://arxiv.org/abs/2602.00350",
      abstract: "Machine unlearning is a key defense mechanism...",
    });
  });

  it("prefers an open-access PDF link over an arXiv id when both are present", () => {
    const paper = {
      paperId: "def456",
      title: "Some Paper",
      year: 2025,
      venue: "NeurIPS",
      abstract: "An abstract.",
      authors: [{ name: "Jane Doe" }],
      externalIds: { ArXiv: "2501.00001" },
      openAccessPdf: { url: "https://example.com/paper.pdf" },
    };

    const result = mapSemanticScholarPaper(paper);

    expect(result.link).toBe("https://example.com/paper.pdf");
    expect(result.journal).toBe("NeurIPS");
  });

  it("falls back to an empty link when there is no PDF, arXiv id, or DOI", () => {
    const paper = {
      paperId: "ghi789",
      title: "Untracked Paper",
      year: null,
      venue: null,
      abstract: null,
      authors: [],
      externalIds: {},
      openAccessPdf: null,
    };

    const result = mapSemanticScholarPaper(paper);

    expect(result.link).toBe("");
    expect(result.time).toBe("");
    expect(result.abstract).toBe("");
    expect(result.journal).toBe("Preprint");
    expect(result.authors).toBe("");
  });
});

describe("fetchSemanticScholarPublications", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an empty array immediately when no author id is given", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await fetchSemanticScholarPublications("");

    expect(result).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetches and maps publications for a given author id", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            paperId: "abc123",
            title: "A Paper",
            year: 2025,
            venue: "arXiv",
            abstract: "Abstract text.",
            authors: [{ name: "Ignacy Kolton" }],
            externalIds: { ArXiv: "2501.00001" },
            openAccessPdf: null,
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await fetchSemanticScholarPublications("some-author-id");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.semanticscholar.org/graph/v1/author/some-author-id/papers?fields=title,authors,venue,year,abstract,externalIds,openAccessPdf",
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("A Paper");
  });

  it("throws when the API responds with a non-OK status", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
    });
    vi.stubGlobal("fetch", fetchSpy);

    await expect(fetchSemanticScholarPublications("some-author-id")).rejects.toThrow(
      "Semantic Scholar API request failed: 429 Too Many Requests",
    );
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './fetchSemanticScholar'` (the module doesn't exist yet).

- [ ] **Step 4: Implement `src/data/publications/fetchSemanticScholar.ts`**

```ts
import type { Publication } from "@/types/cv";

interface SemanticScholarPaper {
  paperId: string;
  title: string;
  year: number | null;
  venue: string | null;
  abstract: string | null;
  authors: { name: string }[];
  externalIds?: { ArXiv?: string; DOI?: string };
  openAccessPdf?: { url: string } | null;
}

interface SemanticScholarAuthorResponse {
  data: SemanticScholarPaper[];
}

const SEMANTIC_SCHOLAR_FIELDS =
  "title,authors,venue,year,abstract,externalIds,openAccessPdf";

export function mapSemanticScholarPaper(paper: SemanticScholarPaper): Publication {
  const authors = paper.authors.map((a) => a.name).join(", ");

  const link =
    paper.openAccessPdf?.url ??
    (paper.externalIds?.ArXiv
      ? `https://arxiv.org/abs/${paper.externalIds.ArXiv}`
      : undefined) ??
    (paper.externalIds?.DOI ? `https://doi.org/${paper.externalIds.DOI}` : "");

  const journal =
    paper.venue ||
    (paper.externalIds?.ArXiv ? `arXiv:${paper.externalIds.ArXiv}` : "Preprint");

  return {
    title: paper.title,
    authors,
    journal,
    time: paper.year ? String(paper.year) : "",
    link,
    abstract: paper.abstract ?? "",
  };
}

export async function fetchSemanticScholarPublications(
  authorId: string,
): Promise<Publication[]> {
  if (!authorId) return [];

  const url = `https://api.semanticscholar.org/graph/v1/author/${authorId}/papers?fields=${SEMANTIC_SCHOLAR_FIELDS}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(
      `Semantic Scholar API request failed: ${res.status} ${res.statusText}`,
    );
  }

  const body = (await res.json()) as SemanticScholarAuthorResponse;
  return body.data.map(mapSemanticScholarPaper);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all 6 tests in `fetchSemanticScholar.test.ts` green.

- [ ] **Step 6: Commit**

```bash
git add src/data/publications/fetchSemanticScholar.ts src/data/publications/fetchSemanticScholar.test.ts
git commit -m "Add Semantic Scholar publication mapping with tests"
```

---

## Task 4: Prebuild script and generated publications data

**Files:**
- Create: `scripts/fetch-publications.ts`
- Create: `src/data/publications.generated.json`
- Create: `src/data/publications.ts`
- Modify: `src/settings.ts`
- Modify: `package.json`
- Modify: `.gitignore` (confirm generated file is NOT ignored — it must be committed as the fallback)

- [ ] **Step 1: Add a `semanticScholarAuthorId` field to `profile` in `src/settings.ts`**

Find the `profile` export and add the field near `author_name`:

```ts
	author_name: 'Ignacy Kolton', // Author name to be highlighted in the papers section
	semanticScholarAuthorId: '', // Fill in your Semantic Scholar author ID (from your profile URL: semanticscholar.org/author/.../<ID>) to enable auto-fetching publications at build time. Leave empty to keep the committed src/data/publications.generated.json as-is.
```

- [ ] **Step 2: Seed the initial generated publications file with the two current preprints**

Create `src/data/publications.generated.json`:

```json
[
  {
    "title": "ReLAPSe: Reinforcement-Learning-trained Adversarial Prompt Search for Erased concepts in unlearned diffusion models",
    "authors": "Ignacy Kolton, Kacper Marzol, Paweł Batorski, Marcin Mazur, Paul Swoboda, Przemysław Spurek",
    "journal": "arXiv preprint arXiv:2602.00350",
    "time": "2026",
    "link": "https://arxiv.org/abs/2602.00350",
    "repo": "https://github.com/gmum/ReLaPSe",
    "abstract": "Machine unlearning is a key defense mechanism for removing unauthorized concepts from text-to-image diffusion models, yet recent evidence shows that latent visual information often persists after unlearning. Existing adversarial approaches for exploiting this leakage are constrained by fundamental limitations: optimization-based methods are computationally expensive due to per-instance iterative search. At the same time, reasoning-based and heuristic techniques lack direct feedback from the target model's latent visual representations. To address these challenges, we introduce ReLAPSe, a policy-based adversarial framework that reformulates concept restoration as a reinforcement learning problem. ReLAPSe trains an agent using Reinforcement Learning with Verifiable Rewards (RLVR), leveraging the diffusion model's noise prediction loss as a model-intrinsic and verifiable feedback signal. This closed-loop design directly aligns textual prompt manipulation with latent visual residuals, enabling the agent to learn transferable restoration strategies rather than optimizing isolated prompts. By pioneering the shift from per-instance optimization to global policy learning, ReLAPSe achieves efficient, near-real-time recovery of fine-grained identities and styles across multiple state-of-the-art unlearning methods, providing a scalable tool for rigorous red-teaming of unlearned diffusion models."
  },
  {
    "title": "MedGS: Gaussian Splatting for Multi-Modal 3D Medical Imaging",
    "authors": "Kacper Marzol, Ignacy Kolton, Weronika Smolak-Dyżewska, Joanna Kaleta, Marcin Mazur, Przemysław Spurek",
    "journal": "arXiv preprint arXiv:2509.16806",
    "time": "2025",
    "link": "https://arxiv.org/abs/2509.16806",
    "repo": "https://github.com/gmum/MedGS",
    "abstract": "Multi-modal three-dimensional (3D) medical imaging data, derived from ultrasound, magnetic resonance imaging (MRI), and potentially computed tomography (CT), provide a widely adopted approach for non-invasive anatomical visualization. Accurate modeling, registration, and visualization in this setting depend on surface reconstruction and frame-to-frame interpolation. Traditional methods often face limitations due to image noise and incomplete information between frames. To address these challenges, we present MedGS, a semi-supervised neural implicit surface reconstruction framework that employs a Gaussian Splatting (GS)-based interpolation mechanism. In this framework, medical imaging data are represented as consecutive two-dimensional (2D) frames embedded in 3D space and modeled using Gaussian-based distributions. This representation enables robust frame interpolation and high-fidelity surface reconstruction across imaging modalities."
  }
]
```

- [ ] **Step 3: Create the thin re-export module `src/data/publications.ts`**

```ts
import type { Publication } from "@/types/cv";
import publicationsData from "./publications.generated.json";

export const publications: Publication[] = publicationsData as Publication[];
```

- [ ] **Step 4: Create the prebuild script `scripts/fetch-publications.ts`**

```ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { profile } from "../src/settings";
import { fetchSemanticScholarPublications } from "../src/data/publications/fetchSemanticScholar";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.resolve(__dirname, "../src/data/publications.generated.json");

async function main() {
  const authorId = profile.semanticScholarAuthorId;

  if (!authorId) {
    console.warn(
      "[fetch-publications] No semanticScholarAuthorId configured in src/settings.ts — skipping fetch, keeping existing src/data/publications.generated.json",
    );
    return;
  }

  try {
    const publications = await fetchSemanticScholarPublications(authorId);

    if (publications.length === 0) {
      console.warn(
        "[fetch-publications] Semantic Scholar returned zero publications — keeping existing src/data/publications.generated.json",
      );
      return;
    }

    fs.writeFileSync(OUT_PATH, `${JSON.stringify(publications, null, 2)}\n`);
    console.log(
      `[fetch-publications] Wrote ${publications.length} publications to ${OUT_PATH}`,
    );
  } catch (err) {
    console.warn(
      `[fetch-publications] Fetch failed (${(err as Error).message}) — keeping existing src/data/publications.generated.json`,
    );
  }
}

main();
```

- [ ] **Step 5: Wire the script into the build via a `prebuild` npm script**

In `package.json`, add to `"scripts"`:

```json
"prebuild": "tsx scripts/fetch-publications.ts",
```

npm automatically runs `prebuild` before `build`, so `npm run build` (used by the `withastro/action` GitHub Actions step) picks this up with no workflow changes needed.

- [ ] **Step 6: Verify the script runs safely with no author id configured**

Run: `npx tsx scripts/fetch-publications.ts`
Expected: prints `[fetch-publications] No semanticScholarAuthorId configured...` and exits 0. `src/data/publications.generated.json` is unchanged.

- [ ] **Step 7: Verify `npm run build` still succeeds end-to-end**

Run: `npm run build`
Expected: prebuild log line appears, then Astro build completes.

- [ ] **Step 8: Commit**

```bash
git add scripts/fetch-publications.ts src/data/publications.generated.json src/data/publications.ts src/settings.ts package.json package-lock.json
git commit -m "Add build-time Semantic Scholar publications fetch with committed fallback"
```

---

## Task 5: Remove publications from `cv.ts` and repoint consumers

**Files:**
- Modify: `src/data/cv.ts`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/research.astro`
- Modify: `src/pages/cv.astro`
- Modify: `src/pages/papers.astro` → rename to `src/pages/publications.astro`

- [ ] **Step 1: Delete the `publications` export from `src/data/cv.ts`**

Remove this whole block from `src/data/cv.ts` (it now lives in `src/data/publications.generated.json`, sourced via `src/data/publications.ts`):

```ts
export const publications = [
	{
		title:
		'ReLAPSe: Reinforcement-Learning-trained Adversarial Prompt Search for Erased concepts in unlearned diffusion models',
		...
	},
	{
		title: 'MedGS: Gaussian Splatting for Multi-Modal 3D Medical Imaging',
		...
	},
];
```

- [ ] **Step 2: Update `src/pages/index.astro` to import `publications` from the new module**

Change:

```ts
import { publications } from '@/data/cv'
```

to:

```ts
import { publications } from '@/data/publications'
```

- [ ] **Step 3: Update `src/pages/research.astro` the same way**

Change:

```ts
import { publications } from "@/data/cv";
```

to:

```ts
import { publications } from "@/data/publications";
```

Also update the "Latest Publications" link target from `/papers` to `/publications`:

```ts
href={`${template.base}/papers`}
```
→
```ts
href={`${template.base}/publications`}
```

- [ ] **Step 4: Update `src/pages/cv.astro`**

Change the import:

```ts
import { experiences, education, skills, publications, awards } from "@/data/cv";
```

to:

```ts
import { experiences, education, skills, awards } from "@/data/cv";
import { publications } from "@/data/publications";
```

Update the same `/papers` link to `/publications`:

```ts
href={`${template.base}/papers`}
```
→
```ts
href={`${template.base}/publications`}
```

- [ ] **Step 5: Rename `papers.astro` to `publications.astro` and repoint its import**

Run: `git mv src/pages/papers.astro src/pages/publications.astro`

Then in the new `src/pages/publications.astro`, change:

```ts
import { publications } from "@/data/cv";
```

to:

```ts
import { publications } from "@/data/publications";
```

- [ ] **Step 6: Verify the build succeeds and no page references the removed export**

Run: `npm run build`
Expected: build succeeds. Run `grep -rn "publications.*@/data/cv\|@/data/cv.*publications" src/` — expected: no matches.

- [ ] **Step 7: Commit**

```bash
git add src/data/cv.ts src/pages/index.astro src/pages/research.astro src/pages/cv.astro src/pages/papers.astro src/pages/publications.astro
git commit -m "Move publications data out of cv.ts into generated publications module"
```

---

## Task 6: Content updates — PhD status, bio, research area ordering

**Files:**
- Modify: `src/settings.ts`

- [ ] **Step 1: Update `profile.title`**

Change:

```ts
	title: 'MS student in Computer Science',
```

to:

```ts
	title: 'PhD student in Computer Science',
```

- [ ] **Step 2: Reorder and reword `profile.research_areas` so medical imaging leads and the description reflects PhD focus**

Replace the `research_areas` array with:

```ts
	research_areas: [
		{
			title: 'Medical Imaging',
			description: 'Primary PhD focus: applying machine learning and computer vision to multimodal medical data for diagnostic and research purposes.',
			field: 'machine-learning'
		},
		{
			title: 'Computer Vision & Generative Models',
			description: 'Includes Gaussian Splatting for representing medical volumetric data, interpolation, and 3D mesh reconstruction.',
			field: 'computer-vision'
		},
		{
			title: 'AI Safety',
			description: 'Exploring the use of LLMs and reinforcement learning to generate adversarial prompts for image generation models, in the context of unlearning and red-teaming.',
			field: 'machine-learning'
		},
	],
```

- [ ] **Step 3: Verify Astro type-checks the changed file cleanly**

Run: `npx astro check`
Expected: no new errors introduced by `settings.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/settings.ts
git commit -m "Update profile to PhD status, lead with medical imaging focus"
```

---

## Task 7: Theme toggle — dark-first, system-aware, two-state

**Files:**
- Modify: `src/components/Head.astro`
- Create: `src/components/ui/ThemeToggle.astro`
- Delete: `src/components/ui/DarkLightController.astro`
- Delete: `src/components/ui/ThemeSelector.astro`

- [ ] **Step 1: Replace the theme-related `<script>` blocks in `src/components/Head.astro`**

Remove these two blocks:

```astro
<script is:inline define:vars={{ defaultTheme: template.lightTheme }}>
  // Get stored theme or fall back to the configured light theme
  const getStoredTheme = () => localStorage.getItem('theme') || defaultTheme;

  // Apply theme immediately to prevent flash
  document.documentElement.setAttribute('data-theme', getStoredTheme());

  // Re-apply theme after navigation
  document.addEventListener('astro:after-swap', () => {
    document.documentElement.setAttribute('data-theme', getStoredTheme());
  });
</script>
<script>
	import { themeChange } from 'theme-change'
	themeChange()

  // Re-initialize after Astro view transitions
  document.addEventListener('astro:after-swap', () => {
    themeChange(false); // false = don't persist to localStorage
  });
</script>
```

Replace with a single inline, blocking script that sets a `dark` class on `<html>` before first paint, based on localStorage override or `prefers-color-scheme`:

```astro
<script is:inline>
  (function () {
    function applyTheme() {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = stored ? stored === 'dark' : prefersDark;
      document.documentElement.classList.toggle('dark', isDark);
    }
    applyTheme();
    document.addEventListener('astro:after-swap', applyTheme);
  })();
</script>
```

- [ ] **Step 2: Create `src/components/ui/ThemeToggle.astro`**

```astro
<button
  id="theme-toggle"
  type="button"
  aria-label="Toggle dark and light theme"
  class="inline-flex size-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 dark:hidden">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden size-4 dark:block">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </svg>
</button>

<script is:inline>
  (function () {
    function bind() {
      const btn = document.getElementById('theme-toggle');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      });
    }
    bind();
    document.addEventListener('astro:after-swap', bind);
  })();
</script>
```

- [ ] **Step 3: Delete the now-unused DaisyUI-based theme components**

Run: `git rm src/components/ui/DarkLightController.astro src/components/ui/ThemeSelector.astro`

(References to these are removed from `Layout.astro` in Task 8, which happens next — if you run the dev server before Task 8, you'll see import errors; that's expected and resolved by the next task.)

- [ ] **Step 4: Commit**

```bash
git add -A src/components/Head.astro src/components/ui/ThemeToggle.astro
git commit -m "Replace DaisyUI multi-theme picker with a simple system-aware dark/light toggle"
```

---

## Task 8: Rebuild Layout — top nav, no drawer sidebar

**Files:**
- Modify: `src/layouts/Layout.astro`

- [ ] **Step 1: Replace the full contents of `src/layouts/Layout.astro`**

The DaisyUI `drawer`/sidebar structure is replaced with a simple top nav bar (matching the approved "Technical Minimal" mockup), since the site only has 5 nav items and doesn't need a collapsible drawer.

```astro
---
import { ClientRouter } from 'astro:transitions';

import Head from '@/components/Head.astro'
import Footer from '@/components/ui/Footer.astro'
import Navbar from '@/components/ui/Navbar.astro'

import { seo, template } from '@/settings'

type Props = {
	title?: string
	description?: string
	image?: string
}

const {
	title = seo.default_title,
	description = seo.default_description,
	image = seo.default_image,
} = Astro.props
---

<!doctype html>
<html lang='en'>
	<head>
		{template.transitions && <ClientRouter />}
		<Head title={title} description={description} image={image} />
	</head>
	<body class="bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
		<div class="mx-auto flex min-h-screen max-w-4xl flex-col px-6">
			<Navbar />
			<main class="flex-1 py-10">
				<slot />
			</main>
			<Footer />
		</div>
	</body>
</html>

<style>
	html,
	body {
		margin: 0;
		width: 100%;
		height: 100%;
	}
</style>
```

- [ ] **Step 2: Confirm the dev server renders the homepage without console errors (styling comes in later tasks)**

Run: `npm run dev` (leave running), open `http://localhost:4321/`
Expected: page loads, no red errors in the browser console about missing imports (`DarkLightController`, `ThemeSelector`, `BetterIcon` usage removed from Layout).

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "Replace drawer-sidebar layout with a top nav layout"
```

---

## Task 9: Rebuild Navbar as a top nav bar

**Files:**
- Modify: `src/components/ui/Navbar.astro`
- Modify: `src/components/ui/SocialIcons.astro`

- [ ] **Step 1: Replace the full contents of `src/components/ui/Navbar.astro`**

Implements the nav from the design doc: Home · Research · Publications · CV · Contact, with Blog appearing only when populated, Projects and Afterhours removed from nav, theme toggle on the right.

```astro
---
import { profile, template } from '@/settings'
import SocialIcons from './SocialIcons.astro'
import ThemeToggle from './ThemeToggle.astro'
import { getCollection } from 'astro:content'

const isBlogPopulated = template.enableBlog
	? await getCollection('blog').then((collection) => collection.length > 0)
	: false

const navItems = [
	{ href: `${template.base}/`, label: 'Home' },
	{ href: `${template.base}/research`, label: 'Research' },
	{ href: `${template.base}/publications`, label: 'Publications' },
	{ href: `${template.base}/cv`, label: 'CV' },
	...(isBlogPopulated ? [{ href: `${template.base}/blog/1`, label: 'Blog' }] : []),
	{ href: `${template.base}/contact`, label: 'Contact' },
]

const { fullName } = profile
---

<header class="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 py-5 dark:border-neutral-800">
	<a href={`${template.base}/`} class="text-sm font-bold uppercase tracking-wide no-underline hover:opacity-80">
		{fullName}
	</a>

	<nav class="flex flex-wrap items-center gap-5 text-sm text-neutral-600 dark:text-neutral-300">
		{navItems.map((item) => (
			<a href={item.href} class="hover:text-neutral-900 dark:hover:text-white">
				{item.label}
			</a>
		))}
	</nav>

	<div class="flex items-center gap-3">
		<SocialIcons />
		<ThemeToggle />
	</div>
</header>
```

- [ ] **Step 2: Restyle `src/components/ui/SocialIcons.astro`**

Replace the DaisyUI `hover:bg-primary/20` treatment with plain neutral/emerald hover states. Change every occurrence of:

```
class={`${calculatedContainerSize} inline-flex items-center justify-center rounded-xl hover:bg-primary/20 transition-all duration-300`}
```

to:

```
class={`${calculatedContainerSize} inline-flex items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-emerald-600 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-emerald-300`}
```

(There are 4 occurrences: LinkedIn, GitHub, Scholar, Email — replace all 4.)

- [ ] **Step 3: Verify the nav renders correctly in the browser**

Run: `npm run dev`, open `http://localhost:4321/`
Expected: top nav shows name on the left, Home/Research/Publications/CV/Contact links, social icons + theme toggle on the right. No Projects or Afterhours links.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Navbar.astro src/components/ui/SocialIcons.astro
git commit -m "Rebuild navbar as a top nav bar matching the approved design"
```

---

## Task 10: Restyle Footer

**Files:**
- Modify: `src/components/ui/Footer.astro`

- [ ] **Step 1: Replace the full contents**

```astro
---
import { profile } from '@/settings'

const { fullName } = profile
---

<footer class="border-t border-neutral-200 py-8 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-500">
	<p>© {new Date().getFullYear()} {fullName}</p>
</footer>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Footer.astro
git commit -m "Restyle footer without DaisyUI classes"
```

---

## Task 11: Rebuild Hero and BetterIcon

**Files:**
- Modify: `src/components/ui/Hero.astro`
- Modify: `src/components/ui/BetterIcon.astro`

- [ ] **Step 1: Replace the full contents of `src/components/ui/Hero.astro`**

Matches the approved mockup: mono label line, left-aligned headline using the exact bio line, photo on the right on large screens.

```astro
---
import { Image } from 'astro:assets'
import SocialIcons from './SocialIcons.astro'

const { fullName, title, institute, profilePicture } = Astro.props
---

<div class="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
	<div class="max-w-xl">
		<p class="mb-3 font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-300">
			{title}{institute ? ` · ${institute}` : ''}
		</p>
		<h1 class="mb-4 text-2xl font-semibold leading-snug text-neutral-900 dark:text-neutral-50">
			{fullName} — PhD student in Computer Science, working on machine learning, computer vision, and generative models, with applications ranging from medical imaging to AI safety.
		</h1>
		<div class="mt-6">
			<SocialIcons />
		</div>
	</div>
	<Image
		src={profilePicture}
		alt={fullName}
		class="hidden size-40 rounded-full object-cover lg:block"
	/>
</div>
```

- [ ] **Step 2: Restyle `src/components/ui/BetterIcon.astro`**

Replace DaisyUI `bg-primary/20 text-primary` with plain emerald:

```astro
<!--
Pass any SVG icon as children (recommended width/height : w-6 h-6 or size-6)
-->
<div class="inline-flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
		<slot />
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Hero.astro src/components/ui/BetterIcon.astro
git commit -m "Rebuild hero with PhD bio line, restyle BetterIcon accent"
```

---

## Task 12: Rebuild homepage

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/components/ui/Grid.astro`
- Modify: `src/components/ui/ArticleList.astro`

- [ ] **Step 1: Restyle `src/components/ui/Grid.astro`**

Replace DaisyUI card classes (`bg-base-200`, `hover:bg-base-300`, `text-accent`) with hairline-bordered cards:

```astro
---
interface Props {
  gridTitle: string;
  gridItems: {
    title: string;
    description: string;
    link?: string;
  }[];
}

const {gridTitle, gridItems} = Astro.props;
---
<h2 class="mb-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">{gridTitle}</h2>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
  {gridItems.map((item) => (
    item.link ? (
      <a
        href={item.link}
        class="block rounded-lg border border-neutral-200 p-5 no-underline transition-colors hover:border-emerald-400 dark:border-neutral-800 dark:hover:border-emerald-500"
      >
        <h3 class="mb-2 font-medium text-emerald-600 dark:text-emerald-300">
          {item.title} →
        </h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p>
      </a>
    ) : (
      <div class="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
        <h3 class="mb-2 font-medium text-neutral-900 dark:text-neutral-50">{item.title}</h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p>
      </div>
    )
  ))}
</div>
```

- [ ] **Step 2: Restyle `src/components/ui/ArticleList.astro`**

```astro
---
interface Props {
  listTitle: string;
  listItems: {
    title: string;
    journal: string;
    time: string;
  }[];
}
const {listTitle, listItems} = Astro.props
---

<h2 class="mb-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">{listTitle}</h2>
<div class="divide-y divide-neutral-200 dark:divide-neutral-800">
	{listItems.map(item => (
		<div class="py-3">
			<h3 class="text-sm font-medium text-neutral-900 dark:text-neutral-50">{item.title}</h3>
			<p class="font-mono text-xs text-neutral-500 dark:text-neutral-500">
				{item.journal} · {item.time}
			</p>
		</div>
	))}
</div>
```

- [ ] **Step 3: Replace the full contents of `src/pages/index.astro`**

Simplifies section wrappers (drops `border-b`/`pt-12` DaisyUI-era spacing in favor of consistent vertical rhythm) and keeps the existing data flow (research/dev grid items, recent publications).

```astro
---
import Layout from '@/layouts/Layout.astro'

import { profile, template } from '@/settings'
import { publications } from '@/data/publications'
import { sortByDateDesc } from '@/lib/utils'
import ProfilePictures from '@/assets/profile_pictures.jpg'
import Hero from '@/components/ui/Hero.astro'
import Grid from '@/components/ui/Grid.astro'
import ArticleList from '@/components/ui/ArticleList.astro'

const { fullName, title, institute, research_areas, development_areas } = profile
const recentPublications = sortByDateDesc(publications).slice(0, 5)

const researchGridItems = [
  ...research_areas,
  {
    title: 'More',
    description: 'Learn more about my research and current focus.',
    link: `${template.base}/research`,
  },
]

const devGridItems = [
  ...development_areas,
  {
    title: 'More',
    description: 'See my full CV for technical details and experience.',
    link: `${template.base}/cv`,
  },
]
---

<Layout>
	<section class="border-b border-neutral-200 pb-12 dark:border-neutral-800">
		<Hero fullName={fullName} title={title} institute={institute} profilePicture={ProfilePictures} />
	</section>

	<section class="border-b border-neutral-200 py-12 dark:border-neutral-800">
		<Grid gridTitle="Research Areas" gridItems={researchGridItems} />
	</section>

	<section class="border-b border-neutral-200 py-12 dark:border-neutral-800">
		<Grid gridTitle="Software Development" gridItems={devGridItems} />
	</section>

	<section class="py-12">
		<ArticleList listTitle="Recent Publications" listItems={recentPublications} />
	</section>
</Layout>
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`, open `http://localhost:4321/`
Expected: hero shows PhD bio, Research Areas grid leads with Medical Imaging, Recent Publications lists the two current preprints.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Grid.astro src/components/ui/ArticleList.astro src/pages/index.astro
git commit -m "Rebuild homepage sections without DaisyUI classes"
```

---

## Task 13: Restyle Research page

**Files:**
- Modify: `src/pages/research.astro`
- Modify: `src/components/ui/PublicationsList.astro`

- [ ] **Step 1: Restyle `src/components/ui/PublicationsList.astro`**

Drop `prose`-dependent DaisyUI hover accent (`hover:text-accent`) for emerald, keep structure:

```astro
---
import { isSkill } from '@/types/cv';
import type { Skill, Publication } from '@/types/cv';
import { highlightAuthor } from '@/lib/utils'

interface Props {
	elements: (Skill | Publication)[]
}

const { elements } = Astro.props
---
<ul class="space-y-8">
  {elements.map((element) => (
    <li>
      { isSkill(element)
        ? <>
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">{element.title}</h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">{element.description}</p>
        </> : <>
      <a
        href={element.link as string}
        class="block text-neutral-900 hover:text-emerald-600 dark:text-neutral-50 dark:hover:text-emerald-300 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        <h3 class="text-lg font-semibold mb-2">{element.title}</h3>
      </a>
      <p class="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
        <span set:html={highlightAuthor(element.authors as string)} />
      </p>
      <p class="font-mono text-xs text-neutral-500 dark:text-neutral-500 mb-3">
        {element.journal} · {element.time}
      </p>
      <p class="text-sm text-neutral-600 dark:text-neutral-400">{element.abstract}</p>
      </>
    }
    </li>
  ))}
</ul>
```

- [ ] **Step 2: Replace the full contents of `src/pages/research.astro`**

Drops the `prose` class (typography plugin defaults fight the custom neutral palette) in favor of explicit utility classes, keeps data flow identical:

```astro
---
import Layout from "@/layouts/Layout.astro";
import { profile, template } from "@/settings";
import BetterIcon from "@/components/ui/BetterIcon.astro";
import PublicationsList from "@/components/ui/PublicationsList.astro";
import { publications } from "@/data/publications";
import { sortByDateDesc } from "@/lib/utils";
import { RESEARCH_ICONS } from "@/data/researchIcons";

const { research_areas } = profile;
const latestPublications = sortByDateDesc(publications).slice(0, 5);
---

<Layout title="Research">
  <h1 class="mb-8 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Research</h1>

  <p class="mb-12 text-base text-neutral-700 dark:text-neutral-300">
    My PhD focuses on applying machine learning and computer vision to medical imaging — using techniques like Gaussian Splatting for 3D reconstruction and multimodal data representation. I'm also interested in generative models and AI safety, including how reinforcement learning can be used to probe and red-team unlearning in diffusion models.
  </p>

  <h2 class="mb-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">Research Areas</h2>
  <div class="mb-12 grid gap-8">
    {research_areas.map((area) => (
      <div class="flex gap-5 items-start">
        <BetterIcon>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" class="size-5 stroke-current">
            <path stroke-linecap="round" stroke-linejoin="round" d={RESEARCH_ICONS[area.field as keyof typeof RESEARCH_ICONS]?.path || RESEARCH_ICONS['computer-science'].path} />
          </svg>
        </BetterIcon>
        <div>
          <h3 class="mb-1 text-base font-semibold text-neutral-900 dark:text-neutral-50">{area.title}</h3>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">{area.description}</p>
        </div>
      </div>
    ))}
  </div>

  {latestPublications.length > 0 && (
    <section class="mb-12">
      <h2 class="mb-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
        <a href={`${template.base}/publications`} class="hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors">
          Latest Publications
        </a>
      </h2>
      <PublicationsList elements={latestPublications} />
    </section>
  )}
</Layout>
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`, open `http://localhost:4321/research`
Expected: Medical Imaging listed first under Research Areas, publications list renders below.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/PublicationsList.astro src/pages/research.astro
git commit -m "Restyle research page"
```

---

## Task 14: Restyle CvTimeline and CV page

**Files:**
- Modify: `src/components/ui/CvTimeline.astro`
- Modify: `src/components/ui/List.astro`
- Modify: `src/pages/cv.astro`

- [ ] **Step 1: Replace the full contents of `src/components/ui/CvTimeline.astro`**

Drops the DaisyUI `timeline` component entirely in favor of a simple left-bordered list (works identically on mobile and desktop, no responsive `timeline-compact` hacks needed):

```astro
---
import { isExperience } from '@/types/cv';
import type { Experience, Education } from '@/types/cv';

interface Props {
	elements: (Experience | Education)[]
}

const { elements } = Astro.props
---

<ul class="space-y-8 border-l border-neutral-200 dark:border-neutral-800">
	{elements.map((element) => (
		<li class="pl-6 -ml-px border-l-2 border-transparent">
			<time class="font-mono text-xs text-neutral-500 dark:text-neutral-500">{element.time}</time>
			<div class="mt-1 text-base font-semibold text-neutral-900 dark:text-neutral-50">
				{isExperience(element) ? element.title : element.degree}
			</div>
			<div class="mt-0.5 text-sm font-medium text-neutral-600 dark:text-neutral-400">
				{isExperience(element) ? element.company : element.school}
				{element.location && <span> · {element.location}</span>}
			</div>
			{element.description && (
				<p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{element.description}</p>
			)}
		</li>
	))}
</ul>
```

Note: the `colored` prop is dropped — it only ever toggled a DaisyUI accent class that no longer exists. Callers are updated in Step 3.

- [ ] **Step 2: Restyle `src/components/ui/List.astro`**

```astro
---
interface Props {
  listTitle: string;
  listItems: {
    title: string;
    description: string;
    location?: string;
  }[];
}
const {listTitle, listItems} = Astro.props
---
<h2 class="mb-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">{listTitle}</h2>
<div class="grid gap-4 mb-12 md:grid-cols-2">
  {listItems.map((item) => (
    <div class="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
      <h3 class="mb-2 font-medium text-neutral-900 dark:text-neutral-50">{item.title}</h3>
      <p class="text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p>
    </div>
  ))}
</div>
```

- [ ] **Step 3: Replace the full contents of `src/pages/cv.astro`**

Drops `CvTimeline`'s `colored` prop, DaisyUI `card`/`prose` classes, updates the PhD bio, keeps sort logic identical:

```astro
---
import Layout from "@/layouts/Layout.astro";
import { experiences, education, skills, awards } from "@/data/cv";
import { publications } from "@/data/publications";
import CvTimeline from "@/components/ui/CvTimeline.astro";

import type { Experience, Education, Award } from "@/types/cv";
import List from "@/components/ui/List.astro";
import PublicationsList from "@/components/ui/PublicationsList.astro";
import { sortByDateDesc } from "@/lib/utils";
import { template } from "@/settings";

const orderByEndDate = <T extends { time: string }>(a: T, b: T) => {
	const presentValues = ["present", "now", "current", "today"];
	if (presentValues.includes(a.time?.split(" - ")[1]?.toLowerCase())) {
		return -1;
	}
	const dateA = new Date(a.time?.split(" - ")[1]);
	const dateB = new Date(b.time?.split(" - ")[1]);
	return dateB.getTime() - dateA.getTime();
};

const orderedExperiences: Experience[] = [...experiences].sort(orderByEndDate);
const orderedEducations: Education[] = [...education].sort(orderByEndDate);
const orderedAwards: Award[] = sortByDateDesc(awards);
const orderedPublications = sortByDateDesc(publications);
---

<Layout title="CV">
	<section class="mb-12">
		<h2 class="mb-6 border-b border-neutral-200 pb-2 text-lg font-semibold text-neutral-900 dark:border-neutral-800 dark:text-neutral-50">About Me</h2>
		<p class="text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
			I'm a PhD student in Computer Science at Jagiellonian University, working on machine learning, computer vision, and generative models, with applications ranging from medical imaging to AI safety. My PhD focuses on medical imaging. I'm also passionate about software engineering — I enjoy low-level programming in C++, designing systems and architectures, and building practical tools that solve real problems.
		</p>
	</section>

	{orderedEducations.length > 0 && (
		<section class="mb-12">
			<h2 class="mb-6 border-b border-neutral-200 pb-2 text-lg font-semibold text-neutral-900 dark:border-neutral-800 dark:text-neutral-50">Education</h2>
			<CvTimeline elements={orderedEducations} />
		</section>
	)}

	{orderedExperiences.length > 0 && (
		<section class="mb-12">
			<h2 class="mb-6 border-b border-neutral-200 pb-2 text-lg font-semibold text-neutral-900 dark:border-neutral-800 dark:text-neutral-50">Experience</h2>
			<CvTimeline elements={orderedExperiences} />
		</section>
	)}

	{orderedAwards.length > 0 && (
		<section class="mb-12">
			<h2 class="mb-6 border-b border-neutral-200 pb-2 text-lg font-semibold text-neutral-900 dark:border-neutral-800 dark:text-neutral-50">Grants & Awards</h2>
			<div class="space-y-6">
				{orderedAwards.map((award) => (
					<div class="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
						<h3 class="text-base font-semibold text-neutral-900 dark:text-neutral-50">
							{award.link ? (
								<a href={award.link} target="_blank" rel="noopener noreferrer" class="hover:text-emerald-600 dark:hover:text-emerald-300">
									{award.title}
								</a>
							) : (
								award.title
							)}
						</h3>
						<p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
							{award.issuer} · {award.time}
						</p>
						{award.description && (
							<p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{award.description}</p>
						)}
					</div>
				))}
			</div>
		</section>
	)}

	{skills.length > 0 && (
		<section class="mb-12">
			<List listTitle="Skills" listItems={skills} />
		</section>
	)}

	{orderedPublications.length > 0 && (
		<section class="mb-12">
			<h2 class="mb-6 border-b border-neutral-200 pb-2 text-lg font-semibold text-neutral-900 dark:border-neutral-800 dark:text-neutral-50">
				<a href={`${template.base}/publications`} class="hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors">
					Publications
				</a>
			</h2>
			<PublicationsList elements={orderedPublications} />
		</section>
	)}
</Layout>
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`, open `http://localhost:4321/cv`
Expected: About Me reflects PhD status, timeline entries render as a left-bordered list, no DaisyUI classes remain.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/CvTimeline.astro src/components/ui/List.astro src/pages/cv.astro
git commit -m "Restyle CV timeline and page"
```

---

## Task 15: Restyle Publications page

**Files:**
- Modify: `src/pages/publications.astro`

- [ ] **Step 1: Replace the full contents**

```astro
---
import Layout from "@/layouts/Layout.astro";
import { publications } from "@/data/publications";
import { sortByDateDesc } from "@/lib/utils";
import { highlightAuthor } from "@/lib/utils";

const ALL_PUBLICATIONS = sortByDateDesc(publications);
---

<Layout title="Publications">
  <h1 class="mb-8 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Publications</h1>

  <div class="space-y-10">
    {ALL_PUBLICATIONS.map((paper) => (
      <article class="border-b border-neutral-200 pb-10 last:border-b-0 dark:border-neutral-800">
        <h2 class="text-lg font-semibold">
          <a href={paper.link} target="_blank" rel="noopener noreferrer" class="text-neutral-900 hover:text-emerald-600 dark:text-neutral-50 dark:hover:text-emerald-300">
            {paper.title}
          </a>
        </h2>
        <p class="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
          <span set:html={highlightAuthor(paper.authors)} />
        </p>
        <p class="mt-1 font-mono text-xs text-neutral-500 dark:text-neutral-500">
          {paper.journal} · {paper.time}
        </p>
        <p class="mt-3 text-sm text-neutral-600 dark:text-neutral-400">{paper.abstract}</p>
        <div class="mt-4 flex gap-3">
          {paper.repo && (
            <a href={paper.repo} target="_blank" rel="noopener noreferrer" class="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-emerald-400 hover:text-emerald-600 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300">
              Code
            </a>
          )}
          <a href={paper.link} target="_blank" rel="noopener noreferrer" class="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-emerald-400 hover:text-emerald-600 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300">
            Read Paper
          </a>
        </div>
      </article>
    ))}
  </div>
</Layout>
```

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`, open `http://localhost:4321/publications`
Expected: both preprints listed, newest first, Code/Read Paper buttons work.

- [ ] **Step 3: Commit**

```bash
git add src/pages/publications.astro
git commit -m "Restyle publications page"
```

---

## Task 16: Restyle Contact page

**Files:**
- Modify: `src/pages/contact.astro`

- [ ] **Step 1: Replace the full contents**

```astro
---
import Layout from "@/layouts/Layout.astro";
import { social } from "@/settings";
import LinkedIn from "@/assets/social-icons/linkedin-in.svg";
import GitHub from "@/assets/social-icons/github.svg";
import Scholar from "@/assets/social-icons/google-scholar.svg";
import Envelope from "@/assets/social-icons/envelope.svg";
---

<Layout title="Contact">
  <section class="text-center">
    <h1 class="mb-4 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Get in Touch</h1>
    <p class="mx-auto mb-10 max-w-xl text-base text-neutral-600 dark:text-neutral-400">
      I'm always happy to connect — whether it's about research, collaboration, or new ideas. Feel free to reach out.
    </p>
    <div class="flex flex-wrap justify-center gap-10">
      {social.linkedin && (
        <a href={social.linkedin} target="_blank" rel="noopener noreferrer" class="flex w-16 flex-col items-center gap-2 text-neutral-600 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-300">
          <LinkedIn class="size-6" fill="currentColor" />
          <span class="text-xs">LinkedIn</span>
        </a>
      )}
      {social.github && (
        <a href={social.github} target="_blank" rel="noopener noreferrer" class="flex w-16 flex-col items-center gap-2 text-neutral-600 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-300">
          <GitHub class="size-6" fill="currentColor" />
          <span class="text-xs">GitHub</span>
        </a>
      )}
      {social.scholar && (
        <a href={social.scholar} target="_blank" rel="noopener noreferrer" class="flex w-16 flex-col items-center gap-2 text-neutral-600 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-300">
          <Scholar class="size-6" fill="currentColor" />
          <span class="text-xs">Scholar</span>
        </a>
      )}
      {social.email && (
        <a href={`mailto:${social.email}`} class="flex w-16 flex-col items-center gap-2 text-neutral-600 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-300">
          <Envelope class="size-6" fill="currentColor" />
          <span class="text-xs">Email</span>
        </a>
      )}
    </div>
  </section>
</Layout>
```

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`, open `http://localhost:4321/contact`

- [ ] **Step 3: Commit**

```bash
git add src/pages/contact.astro
git commit -m "Restyle contact page"
```

---

## Task 17: Remove Afterhours, confirm Projects is unrouted-but-kept

**Files:**
- Delete: `src/pages/afterhours.astro`
- No change needed to `src/pages/projects.astro` / `src/data/projects.ts` (already unlinked from nav since Task 9's `Navbar.astro` rewrite doesn't reference `/projects`)

- [ ] **Step 1: Delete the Afterhours page**

Run: `git rm src/pages/afterhours.astro`

- [ ] **Step 2: Confirm `/projects` route still builds (page stays live at its URL, just not linked from nav) and `/afterhours` no longer builds**

Run: `npm run build`
Expected: `dist/projects/index.html` exists, `dist/afterhours/` does not exist. Check with:

```bash
ls dist/projects/index.html
ls dist/afterhours 2>&1 || echo "afterhours correctly removed"
```

- [ ] **Step 3: Commit**

```bash
git add -A src/pages/afterhours.astro
git commit -m "Remove Afterhours page"
```

---

## Task 18: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all `fetchSemanticScholar.test.ts` tests pass.

- [ ] **Step 2: Run Astro's type checker**

Run: `npx astro check`
Expected: no type errors.

- [ ] **Step 3: Run a full production build**

Run: `npm run build`
Expected: build succeeds, no DaisyUI-related warnings, prebuild fetch-publications log line appears.

- [ ] **Step 4: Manually walk every page in the dev server against the approved mockups**

Run: `npm run dev`, then visit and check each of: `/`, `/research`, `/publications`, `/cv`, `/contact`. Toggle dark/light with the new `ThemeToggle` button on each. Confirm:
- Dark mode matches system preference on first load (test by toggling OS dark mode if possible, or `localStorage.removeItem('theme')` + hard refresh)
- Toggling persists across navigation and page reloads
- No `/afterhours` link anywhere; no `/projects` link in nav
- Medical imaging appears first on Home and Research
- Compare overall look against `.superpowers/brainstorm/53545-1784622641/content/light-dark.html` (open directly in a browser tab, side-by-side)

- [ ] **Step 5: Grep for any leftover DaisyUI class names**

Run: `grep -rn "base-100\|base-200\|base-300\|btn-\|card-\|drawer\|daisyui\|data-theme\|text-accent\b" src/ --include="*.astro" --include="*.ts"`
Expected: no matches (aside from unrelated false positives worth a quick manual look).

- [ ] **Step 6: Final commit if any cleanup was needed from Step 5**

```bash
git add -A
git commit -m "Final cleanup pass after redesign verification"
```
