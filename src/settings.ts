export const profile = {
	fullName: 'Ignacy Kolton',
	title: 'PhD Candidate in Technical Computer Science',
	secondaryTitle: '',
	institute: '',
	bio: "I work on machine learning for medical imaging and I'm a member of the GMUM research group at Jagiellonian University.",
	group: { name: 'GMUM', url: 'https://gmum.net/' }, // Linked wherever the bio mentions it
	author_name: 'Ignacy Kolton', // Author name to be highlighted in the papers section
	semanticScholarAuthorId: '', // Fill in your Semantic Scholar author ID (from your profile URL: semanticscholar.org/author/.../<ID>) to enable auto-fetching publications at build time. Leave empty to keep the committed src/data/publications.generated.json as-is.
	research_summary: 'My PhD focuses on foundation models for multimodal medical data. Beyond my PhD, I also work on 3D representations of medical volumes.',
	research_interests: 'Computer vision and foundation models for medical imaging, vision-language models, 3D representations of medical volumes', // One-line summary at the top of the PDF CV
	research_areas: [
		{
			title: 'Medical Imaging',
			description: 'Applying machine learning and computer vision to multimodal medical data for diagnostic and research purposes.',
		},
		{
			title: 'Computer Vision & Generative Models',
			description: 'Gaussian Splatting for representing medical volumetric data, interpolation, and 3D mesh reconstruction.',
		},
	],

}

// Set equal to an empty string to hide the icon that you don't want to display
export const social = {
	email: 'contact@ikolton.com',
	linkedin: 'https://www.linkedin.com/in/ignacy-kolton/',
	// x: 'https://www.x.com/',
	github: 'https://github.com/ikolton',
	// gitlab: '',
	scholar: 'https://scholar.google.com/citations?user=23A4d_sAAAAJ&hl=pl&oi=ao',
	// inspire: '',
	// arxiv: '',
	// orcid: '',
}

export const template = {
	website_url: 'https://ikolton.com', // Astro needs to know your site’s deployed URL to generate a sitemap. It must start with http:// or https://
	menu_left: false,
	transitions: true,
	excerptLength: 200,
	postPerPage: 5,
    base: '', // Repository name starting with /
    enableBlog: false, // Flip to true once src/content/BlogPosts has posts
}

export const seo = {
	default_title: 'Ignacy Kolton',
	default_description: 'Personal website of Ignacy Kolton, PhD candidate in Technical Computer Science at Jagiellonian University.',
	default_image: '/og-card.png', // Link-preview image, generated at build time by scripts/generate-social-card.ts
	social_card_tagline: 'Machine learning for medical imaging · GMUM, Jagiellonian University',
}
