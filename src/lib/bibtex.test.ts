import { describe, it, expect } from "vitest";
import { citationKey, toBibtex } from "./bibtex";

const paper = {
  title: "The Diagnostic Loss: Asymmetric Supervision",
  authors: "Jarosław B. Ćwikła, Pedro R. A. S. Bassi, Szymon Płotka",
  journal: "arXiv preprint arXiv:2610.30980",
  time: "2026",
  link: "https://arxiv.org/abs/2610.30980",
};

describe("citationKey", () => {
  it("combines the ASCII first-author surname, year and first non-stopword", () => {
    expect(citationKey(paper)).toBe("cwikla2026diagnostic");
  });

  it("strips punctuation from the title word", () => {
    expect(citationKey({ ...paper, title: "ReLAPSe: Something", authors: "Ignacy Kolton" })).toBe("kolton2026relapse");
  });
});

describe("toBibtex", () => {
  it("formats authors as 'Last, First' joined with 'and'", () => {
    expect(toBibtex(paper)).toBe(
      [
        "@article{cwikla2026diagnostic,",
        "  title = {{The Diagnostic Loss: Asymmetric Supervision}},",
        "  author = {Ćwikła, Jarosław B. and Bassi, Pedro R. A. S. and Płotka, Szymon},",
        "  journal = {arXiv preprint arXiv:2610.30980},",
        "  year = {2026},",
        "  url = {https://arxiv.org/abs/2610.30980}",
        "}",
      ].join("\n"),
    );
  });

  it("omits the url field when there is no link", () => {
    expect(toBibtex({ ...paper, link: undefined })).not.toContain("url =");
  });
});
