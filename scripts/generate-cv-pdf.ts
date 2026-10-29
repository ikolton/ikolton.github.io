import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { profile, social, template } from "../src/settings";
import { awards, education, experiences, presentations, skills } from "../src/data/cv";
import { publications } from "../src/data/publications";
import { renderCvPdf } from "../src/lib/cvPdf";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.resolve(__dirname, "fonts");
const OUT_PATH = path.resolve(__dirname, "../public/cv.pdf");

async function main() {
  const website = template.website_url;
  const contacts = [
    social.email && { label: social.email, href: `mailto:${social.email}` },
    { label: website.replace(/^https?:\/\//, ""), href: website },
    social.github && { label: social.github.replace(/^https?:\/\/(www\.)?/, ""), href: social.github },
    social.linkedin && { label: "LinkedIn", href: social.linkedin },
    social.scholar && { label: "Google Scholar", href: social.scholar },
  ].filter(Boolean) as { label: string; href: string }[];

  // The current degree's school stands in for the affiliation line.
  const current = education.find((item) => /present/i.test(item.time));
  const title = current ? `${profile.title}, ${current.school}` : profile.title;

  const pdf = await renderCvPdf(
    {
      fullName: profile.fullName,
      title,
      authorName: profile.author_name,
      websiteUrl: website,
      contacts,
      researchInterests: profile.research_interests,
      education,
      experiences,
      publications,
      presentations,
      awards,
      skills,
      updated: new Date(),
    },
    FONT_DIR,
  );

  fs.writeFileSync(OUT_PATH, pdf);
  console.log(`[generate-cv-pdf] Wrote ${path.relative(process.cwd(), OUT_PATH)}`);
}

main();
