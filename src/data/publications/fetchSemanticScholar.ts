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
