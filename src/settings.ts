export const profile = {
	fullName: 'Ignacy Kolton',
	title: 'PhD student in Computer Science',
	secondaryTitle: 'Machine Learning Researcher',
	institute: 'Jagiellonian University',
	bio: "I'm a PhD student in Computer Science at Jagiellonian University, working on machine learning, computer vision, and generative models — mainly applied to medical imaging.",
	author_name: 'Ignacy Kolton', // Author name to be highlighted in the papers section
	semanticScholarAuthorId: '', // Fill in your Semantic Scholar author ID (from your profile URL: semanticscholar.org/author/.../<ID>) to enable auto-fetching publications at build time. Leave empty to keep the committed src/data/publications.generated.json as-is.
	research_areas: [
		{
			title: 'Medical Imaging',
			description: 'Primary PhD focus: applying machine learning and computer vision to multimodal medical data for diagnostic and research purposes.',
		},
		{
			title: 'Computer Vision & Generative Models',
			description: 'Includes Gaussian Splatting for representing medical volumetric data, interpolation, and 3D mesh reconstruction.',
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
	website_url: 'https://ikolton.github.io', // Astro needs to know your site’s deployed URL to generate a sitemap. It must start with http:// or https://
	menu_left: false,
	transitions: true,
	excerptLength: 200,
	postPerPage: 5,
    base: '', // Repository name starting with /
    enableBlog: false, // Flip to true once src/content/BlogPosts has posts
}

export const seo = {
	default_title: 'Ignacy Kolton',
	default_description: 'Personal website of Ignacy Kolton, PhD student in Computer Science at Jagiellonian University.',
	default_image: '/images/favicon.ico',
}
