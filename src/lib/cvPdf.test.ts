import { describe, it, expect } from "vitest";
import path from "node:path";
import { renderCvPdf, type CvPdfData } from "./cvPdf";

const FONT_DIR = path.resolve(__dirname, "../../scripts/fonts");

const data: CvPdfData = {
  fullName: "Jane Doe",
  title: "PhD Candidate, Example University",
  authorName: "Jane Doe",
  websiteUrl: "https://example.com",
  contacts: [{ label: "jane@example.com", href: "mailto:jane@example.com" }],
  education: [{ degree: "PhD", school: "Example University", time: "2026 - present" }],
  experiences: [{ title: "Intern", company: "Example Co", time: "05.2024 - 11.2024" }],
  publications: [
    {
      title: "A Paper",
      authors: "Jarosław Ćwikła, Jane Doe, Szymon Płotka",
      journal: "arXiv preprint arXiv:0000.00000",
      time: "2026",
      link: "https://arxiv.org/abs/0000.00000",
    },
  ],
  awards: [{ title: "Grant", issuer: "Example Foundation", time: "2025" }],
  skills: [{ title: "Engineering", description: "Python, PyTorch" }],
  updated: new Date("2026-10-01"),
};

describe("renderCvPdf", () => {
  it("renders a PDF document", async () => {
    const pdf = await renderCvPdf(data, FONT_DIR);

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it("renders when the author is not among a publication's authors", async () => {
    const pdf = await renderCvPdf(
      { ...data, publications: [{ ...data.publications[0], authors: "Someone Else" }] },
      FONT_DIR,
    );

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
