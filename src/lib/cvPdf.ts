import path from 'node:path'
import PDFDocument from 'pdfkit'
import type { Presentation, Publication } from '@/types/cv'
import { sortByDateDesc, sortByEndDateDesc } from '@/lib/utils'

// Renders a plain, single-column research CV from the same data the site
// uses, so the PDF never drifts from the CV page.

export interface CvPdfData {
	fullName: string
	title: string
	authorName: string
	websiteUrl: string
	contacts: { label: string; href: string }[]
	researchInterests?: string
	education: { degree: string; school: string; location?: string; time: string; description?: string }[]
	experiences: { title: string; company: string; location?: string; time: string; description?: string }[]
	publications: Publication[]
	presentations?: Presentation[]
	awards: { title: string; issuer: string; time: string; description?: string; link?: string }[]
	skills: { title: string; description: string }[]
	updated: Date
}

const MARGIN = 44
const TEXT = '#111111'
const MUTED = '#555555'
const RULE = '#cccccc'

// "2024 - 2026" -> "2024 – 2026"
const formatRange = (time: string) => time.replace(' - ', ' – ')

const hostOf = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

export function renderCvPdf(data: CvPdfData, fontDir: string): Promise<Buffer> {
	const doc = new PDFDocument({
		size: 'A4',
		margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
		info: { Title: `${data.fullName} – CV`, Author: data.fullName },
	})
	doc.registerFont('regular', path.join(fontDir, 'Inter-Regular.otf'))
	doc.registerFont('bold', path.join(fontDir, 'Inter-SemiBold.otf'))

	const chunks: Buffer[] = []
	doc.on('data', (chunk: Buffer) => chunks.push(chunk))
	const done = new Promise<Buffer>((resolve, reject) => {
		doc.on('end', () => resolve(Buffer.concat(chunks)))
		doc.on('error', reject)
	})

	const left = MARGIN
	const width = doc.page.width - MARGIN * 2
	const pageBottom = () => doc.page.height - MARGIN

	const section = (heading: string) => {
		if (doc.y > pageBottom() - 80) doc.addPage()
		else doc.moveDown(0.8)
		doc.font('bold').fontSize(10.5).fillColor(TEXT).text(heading.toUpperCase(), left, doc.y, { characterSpacing: 0.8 })
		const ruleY = doc.y + 2
		doc.moveTo(left, ruleY).lineTo(left + width, ruleY).lineWidth(0.5).strokeColor(RULE).stroke()
		doc.y = ruleY + 7
	}

	// Bold heading on the left, dates right-aligned on the same baseline.
	const entryHeading = (heading: string, time: string) => {
		if (doc.y > pageBottom() - 50) doc.addPage()
		const top = doc.y
		doc.font('regular').fontSize(9.5)
		const timeWidth = doc.widthOfString(time) + 12
		doc.font('bold').fontSize(10).fillColor(TEXT).text(heading, left, top, { width: width - timeWidth })
		const afterHeading = doc.y
		doc.font('regular').fontSize(9.5).fillColor(MUTED).text(time, left, top + 0.5, { width, align: 'right' })
		doc.y = Math.max(afterHeading, doc.y)
	}

	const muted = (text: string) => {
		doc.font('regular').fontSize(9.5).fillColor(MUTED).text(text, left, doc.y, { width })
	}

	const body = (text: string) => {
		doc.font('regular').fontSize(9.5).fillColor(TEXT).text(text, left, doc.y, { width, lineGap: 1 })
	}

	// Header
	doc.font('bold').fontSize(20).fillColor(TEXT).text(data.fullName, left, MARGIN)
	doc.moveDown(0.15)
	doc.font('regular').fontSize(10.5).fillColor(TEXT).text(data.title)
	doc.moveDown(0.3)
	doc.fontSize(9.5).fillColor(MUTED)
	data.contacts.forEach((contact, index) => {
		const last = index === data.contacts.length - 1
		doc.text(contact.label, { link: contact.href, continued: !last })
		if (!last) doc.text('  ·  ', { link: null, continued: true })
	})

	if (data.researchInterests) {
		section('Research Interests')
		body(data.researchInterests)
	}

	if (data.education.length > 0) {
		section('Education')
		sortByEndDateDesc(data.education).forEach((item, index) => {
			if (index > 0) doc.moveDown(0.6)
			entryHeading(item.degree, formatRange(item.time))
			muted(item.location ? `${item.school}, ${item.location}` : item.school)
			if (item.description) body(item.description)
		})
	}

	if (data.publications.length > 0) {
		section('Publications')
		sortByDateDesc(data.publications).forEach((pub, index) => {
			if (index > 0) doc.moveDown(0.6)
			if (doc.y > pageBottom() - 50) doc.addPage()
			doc.fontSize(9.5).fillColor(TEXT)
			// The closing period rides on the last author chunk: pdfkit may break
			// a line between continued chunks, which would orphan a lone ".".
			const [before, ...rest] = pub.authors.split(data.authorName)
			const after = rest.join(data.authorName)
			if (rest.length === 0) {
				doc.font('regular').text(`${before}. `, left, doc.y, { width, continued: true, lineGap: 1 })
			} else {
				doc.font('regular').text(before, left, doc.y, { width, continued: true, lineGap: 1 })
				doc.font('bold').text(after ? data.authorName : `${data.authorName}.`, { continued: true })
				doc.font('regular').text(after ? `${after}. ` : ' ', { continued: true })
			}
			doc.font('bold').text(`${pub.title}. `, { continued: true })
			doc.font('regular').text(`${pub.journal}, ${pub.time}.`)
			const links = [pub.link, pub.repo].filter((url): url is string => Boolean(url))
			doc.fillColor(MUTED)
			links.forEach((url, linkIndex) => {
				const last = linkIndex === links.length - 1
				doc.text(hostOf(url), { link: url, continued: !last })
				if (!last) doc.text('  ·  ', { link: null, continued: true })
			})
		})
	}

	if (data.presentations && data.presentations.length > 0) {
		section('Presentations')
		sortByDateDesc(data.presentations).forEach((item, index) => {
			if (index > 0) doc.moveDown(0.6)
			entryHeading(item.title, item.time)
			muted(`${item.type} · ${item.location ? `${item.event}, ${item.location}` : item.event}`)
		})
	}

	if (data.experiences.length > 0) {
		section('Experience')
		sortByEndDateDesc(data.experiences).forEach((item, index) => {
			if (index > 0) doc.moveDown(0.6)
			entryHeading(item.title, formatRange(item.time))
			muted(item.location ? `${item.company}, ${item.location}` : item.company)
			if (item.description) body(item.description)
		})
	}

	if (data.awards.length > 0) {
		section('Grants & Awards')
		sortByDateDesc(data.awards).forEach((award, index) => {
			if (index > 0) doc.moveDown(0.6)
			entryHeading(award.title, award.time)
			muted(award.issuer)
			if (award.description) body(award.description)
		})
	}

	if (data.skills.length > 0) {
		section('Skills')
		data.skills.forEach((skill) => {
			doc.fontSize(9.5).fillColor(TEXT)
			doc.font('bold').text(`${skill.title}: `, left, doc.y, { width, continued: true, lineGap: 1 })
			doc.font('regular').text(skill.description)
		})
	}

	// The footer sits in the bottom margin of the last page, so it never
	// pushes the CV onto an extra page. Zeroing the margin stops pdfkit from
	// treating text placed there as overflow.
	const updated = data.updated.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
	const bottomMargin = doc.page.margins.bottom
	doc.page.margins.bottom = 0
	doc.font('regular').fontSize(8).fillColor(MUTED)
		.text(`Updated ${updated} · ${hostOf(data.websiteUrl)}`, left, doc.page.height - bottomMargin + 14, { width, align: 'center', link: data.websiteUrl })
	doc.page.margins.bottom = bottomMargin

	doc.end()
	return done
}
