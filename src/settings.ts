export const profile = {
	fullName: 'Ignacy Kolton',
	title: 'MS student in Computer Science',
	institute: 'Jagiellonian University',
	author_name: 'Ignacy Kolton', // Author name to be highlighted in the papers section
	research_areas: [
		{ title: 'Computer Vision', description: 'My (work in progress) master thesis is connected to medical data segmentation', field: 'machine-learning' },
		{ 
		title: 'Gaussian Splatting', 
		description: 'Used Gaussian Splatting for representing medical volumetric data, interpolation, and 3D mesh reconstruction', 
		field: 'computer-vision' 
		},
		{ 
		title: 'Medical Data Analysis', 
		description: 'Applying machine learning methods to analyze and process medical data for diagnostic and research purposes', 
		field: 'machine-learning' 
		},
		{ 
		title: 'Adversarial Attacks with Reinforcement Learning', 
		description: 'Exploring the use of LLMs and RL to generate adversarial prompts for image generation models', 
		field: 'machine-learning' 
		},

	],
	development_areas: [
	{ 
		title: 'C++', 
		description: 'My first and favourite language — I enjoy low-level programming, optimization, and understanding how things work under the hood.' 
	},
	{ 
		title: '.NET / C#', 
		description: 'Experience from both personal and university projects, including fully functional Windows applications built from scratch.' 
	},
	{ 
		title: 'Python', 
		description: 'Used mainly for machine learning and data analysis, with strong familiarity with libraries such as PyTorch, NumPy, and pandas.' 
	},
	{ 
		title: 'Other Languages', 
		description: 'Also experienced with Java, shell scripting, and low-level programming in assembler, as well as basic web development.' 
	},
	],

}

// Set equal to an empty string to hide the icon that you don't want to display
export const social = {
	email: 'contact[at]ikolton.com',
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
	lightTheme: 'retro', // Select one of the Daisy UI Themes or create your own
	darkTheme: 'coffee', // Select one of the Daisy UI Themes or create your own
	excerptLength: 200,
	postPerPage: 5,
    base: '' // Repository name starting with /
}

export const seo = {
	default_title: 'Ignacy Koltom',
	default_description: 'Personal website of Ignacy Kolton, MS student in Computer Science at Jagiellonian University.',
	default_image: '/images/favicon.ico',
}
