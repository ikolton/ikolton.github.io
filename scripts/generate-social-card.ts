import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { profile, seo, template } from "../src/settings";
import { renderSocialCard } from "../src/lib/socialCard";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.resolve(__dirname, "fonts");
const PHOTO_PATH = path.resolve(__dirname, "../src/assets/profile_pictures.jpg");
const OUT_PATH = path.resolve(__dirname, "../public", seo.default_image.replace(/^\//, ""));

const png = renderSocialCard(
  {
    title: profile.title,
    name: profile.fullName,
    tagline: seo.social_card_tagline,
    url: template.website_url.replace(/^https?:\/\//, ""),
    photo: fs.readFileSync(PHOTO_PATH),
    photoMime: "image/jpeg",
  },
  FONT_DIR,
);

fs.writeFileSync(OUT_PATH, png);
console.log(`[generate-social-card] Wrote ${path.relative(process.cwd(), OUT_PATH)}`);
