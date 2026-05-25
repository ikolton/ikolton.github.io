import { profile, template } from '@/settings'

export function highlightAuthor(authors: string): string{
	const author = authors.split(', ')
	if (author.includes(profile.author_name)){
		return authors.replace(profile.author_name, `<span class='font-medium underline'>${profile.author_name}</span>`)
	}
	return authors
}

export function trimExcerpt(excerpt: string): string {
	const excerptLength = template.excerptLength
	return excerpt.length > excerptLength ? `${excerpt.substring(0, excerptLength)}...` : excerpt
}

// Returns a new array sorted newest-first by a parseable `time` string
// (e.g. "January 2026"). Does not mutate the input.
export function sortByDateDesc<T extends { time: string }>(items: T[]): T[] {
	return [...items].sort(
		(a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
	)
}
