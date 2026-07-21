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

// Experiences/education carry a "start - end" range; order by the end date,
// keeping anything marked present/now/current/today first. Returns a new
// array, does not mutate the input.
export function sortByEndDateDesc<T extends { time: string }>(items: T[]): T[] {
	const presentValues = ['present', 'now', 'current', 'today']
	return [...items].sort((a, b) => {
		if (presentValues.includes(a.time?.split(' - ')[1]?.toLowerCase())) {
			return -1
		}
		const dateA = new Date(a.time?.split(' - ')[1])
		const dateB = new Date(b.time?.split(' - ')[1])
		return dateB.getTime() - dateA.getTime()
	})
}
