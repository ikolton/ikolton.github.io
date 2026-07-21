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

main().catch((err) => {
  console.warn(`[fetch-publications] Unexpected error (${(err as Error).message}) — keeping existing src/data/publications.generated.json`);
});
