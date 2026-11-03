import type { Publication } from '@/types/cv'

// Builds a BibTeX entry in the style Google Scholar exports for arXiv
// preprints, from the same fields the publication cards use.

const STOPWORDS = new Set(['a', 'an', 'the', 'on', 'of', 'for', 'and', 'in', 'to', 'with'])

// "Jarosław B. Ćwikła" -> "jaroslaw b. cwikla"; BibTeX keys must be ASCII.
const toAscii = (text: string) =>
	text
		.replace(/ł/g, 'l')
		.replace(/Ł/g, 'L')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')

// "Pedro R. A. S. Bassi" -> "Bassi, Pedro R. A. S."
function toBibtexName(name: string): string {
	const parts = name.trim().split(/\s+/)
	if (parts.length < 2) return name.trim()
	const last = parts.pop() as string
	return `${last}, ${parts.join(' ')}`
}

export function citationKey(publication: Publication): string {
	const firstAuthor = publication.authors.split(',')[0].trim().split(/\s+/).pop() ?? 'paper'
	const word = publication.title
		.split(/\s+/)
		.map((w) => toAscii(w).toLowerCase().replace(/[^a-z0-9]/g, ''))
		.find((w) => w && !STOPWORDS.has(w))
	return `${toAscii(firstAuthor).toLowerCase().replace(/[^a-z]/g, '')}${publication.time}${word ?? ''}`
}

export function toBibtex(publication: Publication): string {
	const authors = publication.authors.split(',').map(toBibtexName).join(' and ')
	const fields = [
		// Double braces keep acronyms like "ReLAPSe" from being lowercased.
		`  title = {{${publication.title}}}`,
		`  author = {${authors}}`,
		`  journal = {${publication.journal}}`,
		`  year = {${publication.time}}`,
		publication.link && `  url = {${publication.link}}`,
	].filter(Boolean)
	return `@article{${citationKey(publication)},\n${fields.join(',\n')}\n}`
}
