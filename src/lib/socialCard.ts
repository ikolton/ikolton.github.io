import path from 'node:path'
import PDFDocument from 'pdfkit'
import { Resvg } from '@resvg/resvg-js'

// Renders the 1200×630 link-preview image (og:image) from the site's own
// data. The SVG is laid out by hand and rasterized with resvg, so no browser
// is needed at build time.

export interface SocialCardData {
	title: string
	name: string
	tagline: string
	url: string
	photo: Buffer
	photoMime: string
}

export const SOCIAL_CARD_WIDTH = 1200
export const SOCIAL_CARD_HEIGHT = 630

const PAD = 96
const PHOTO_RADIUS = 140
const PHOTO_CX = SOCIAL_CARD_WIDTH - PAD - PHOTO_RADIUS
const TEXT_WIDTH = PHOTO_CX - PHOTO_RADIUS - PAD - 56

const BACKGROUND = '#0a0a0a'
const ACCENT = '#5eead4'
const TEXT = '#fafafa'
const MUTED = '#a3a3a3'
const FAINT = '#737373'

const escapeXml = (text: string) =>
	text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// resvg can't measure text, so widths come from pdfkit, which reads the same
// font files.
function createMeasurer(fontDir: string) {
	const doc = new PDFDocument({ autoFirstPage: false })
	doc.registerFont('regular', path.join(fontDir, 'Inter-Regular.otf'))
	doc.registerFont('bold', path.join(fontDir, 'Inter-SemiBold.otf'))
	return (text: string, font: 'regular' | 'bold', size: number, letterSpacing = 0) =>
		doc.font(font).fontSize(size).widthOfString(text) + letterSpacing * text.length
}

// Largest size up to `max` at which the text fits `width`.
function fitSize(measure: (size: number) => number, max: number, width: number) {
	let size = max
	while (size > 12 && measure(size) > width) size -= 1
	return size
}

// Greedy word wrap into at most `maxLines` lines.
function wrap(text: string, fits: (line: string) => boolean, maxLines: number) {
	const lines: string[] = []
	let line = ''
	for (const word of text.split(' ')) {
		const candidate = line ? `${line} ${word}` : word
		if (line && !fits(candidate)) {
			lines.push(line)
			line = word
		} else {
			line = candidate
		}
	}
	if (line) lines.push(line)
	return lines.slice(0, maxLines)
}

export function renderSocialCard(data: SocialCardData, fontDir: string): Buffer {
	const measure = createMeasurer(fontDir)

	const title = data.title.toUpperCase()
	const titleSpacing = 3
	const titleSize = fitSize((size) => measure(title, 'regular', size, titleSpacing), 22, TEXT_WIDTH)
	const nameSize = fitSize((size) => measure(data.name, 'bold', size), 84, TEXT_WIDTH)
	const taglineSize = 30
	const taglineFits = (line: string) => measure(line, 'regular', taglineSize) <= TEXT_WIDTH
	// Break at " · " when that gives at most two lines that fit; otherwise wrap by word.
	const segments = data.tagline.split(' · ')
	const taglineLines = segments.length <= 2 && segments.every(taglineFits)
		? segments
		: wrap(data.tagline, taglineFits, 2)

	const taglineLeading = taglineSize * 1.45
	const blockHeight = titleSize + 30 + nameSize + 28 + taglineLeading * taglineLines.length
	let y = (SOCIAL_CARD_HEIGHT - blockHeight) / 2

	const titleY = y + titleSize
	y = titleY + 30
	const nameY = y + nameSize * 0.8
	y = nameY + 28 + nameSize * 0.2
	const taglineY = taglineLines.map((_, index) => y + taglineSize + index * taglineLeading)

	const photo = `data:${data.photoMime};base64,${data.photo.toString('base64')}`
	const photoCY = SOCIAL_CARD_HEIGHT / 2

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SOCIAL_CARD_WIDTH}" height="${SOCIAL_CARD_HEIGHT}" viewBox="0 0 ${SOCIAL_CARD_WIDTH} ${SOCIAL_CARD_HEIGHT}">
	<defs><clipPath id="photo"><circle cx="${PHOTO_CX}" cy="${photoCY}" r="${PHOTO_RADIUS}"/></clipPath></defs>
	<rect width="100%" height="100%" fill="${BACKGROUND}"/>
	<text x="${PAD}" y="${titleY}" font-family="Inter" font-size="${titleSize}" letter-spacing="${titleSpacing}" fill="${ACCENT}">${escapeXml(title)}</text>
	<text x="${PAD}" y="${nameY}" font-family="Inter" font-weight="600" font-size="${nameSize}" letter-spacing="${-nameSize * 0.02}" fill="${TEXT}">${escapeXml(data.name)}</text>
	${taglineLines.map((line, index) => `<text x="${PAD}" y="${taglineY[index]}" font-family="Inter" font-size="${taglineSize}" fill="${MUTED}">${escapeXml(line)}</text>`).join('\n\t')}
	<text x="${PAD}" y="${SOCIAL_CARD_HEIGHT - 52}" font-family="Inter" font-size="22" letter-spacing="1" fill="${FAINT}">${escapeXml(data.url)}</text>
	<image href="${photo}" x="${PHOTO_CX - PHOTO_RADIUS}" y="${photoCY - PHOTO_RADIUS}" width="${PHOTO_RADIUS * 2}" height="${PHOTO_RADIUS * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo)"/>
	<circle cx="${PHOTO_CX}" cy="${photoCY}" r="${PHOTO_RADIUS}" fill="none" stroke="#262626" stroke-width="3"/>
</svg>`

	const resvg = new Resvg(svg, {
		font: {
			fontFiles: [path.join(fontDir, 'Inter-Regular.otf'), path.join(fontDir, 'Inter-SemiBold.otf')],
			loadSystemFonts: false,
			defaultFontFamily: 'Inter',
		},
	})
	return resvg.render().asPng()
}
