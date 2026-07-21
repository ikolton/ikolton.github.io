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
