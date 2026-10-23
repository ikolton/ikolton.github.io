import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { renderSocialCard, SOCIAL_CARD_WIDTH, SOCIAL_CARD_HEIGHT } from "./socialCard";

const FONT_DIR = path.resolve(__dirname, "../../scripts/fonts");
const PHOTO = fs.readFileSync(path.resolve(__dirname, "../assets/profile_pictures.jpg"));

// Width and height live at fixed offsets in a PNG's IHDR chunk.
const pngSize = (png: Buffer) => ({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) });

describe("renderSocialCard", () => {
  it("renders a 1200x630 PNG", () => {
    const png = renderSocialCard(
      {
        title: "PhD Candidate in Technical Computer Science",
        name: "Jane Doe",
        tagline: "Machine learning · Example University",
        url: "example.com",
        photo: PHOTO,
        photoMime: "image/jpeg",
      },
      FONT_DIR,
    );

    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(pngSize(png)).toEqual({ width: SOCIAL_CARD_WIDTH, height: SOCIAL_CARD_HEIGHT });
  });

  it("handles long text and characters that need escaping", () => {
    const png = renderSocialCard(
      {
        title: "A Very Long Title That Would Otherwise Run Into The Photo On The Right",
        name: "Bartłomiej Żółtowski-Wiśniewski",
        tagline: "Research on <models> & data for a long time across many different areas of study",
        url: "example.com",
        photo: PHOTO,
        photoMime: "image/jpeg",
      },
      FONT_DIR,
    );

    expect(pngSize(png)).toEqual({ width: SOCIAL_CARD_WIDTH, height: SOCIAL_CARD_HEIGHT });
  });
});
