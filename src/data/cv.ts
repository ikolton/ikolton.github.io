export const experiences = [
	{
		company: 'HERE Technologies',
		time: '05.2024 - 11.2024',
		title: 'Software Engineer Internship',
		location: '',
		description: 'Refactored legacy code in Java and Swift, improving structure and readability, and updated unit and integration tests to increase coverage and reliability. Optimized older C++ components by enhancing memory usage and execution time. Collaborated closely with the team in Agile ceremonies and daily work to clarify requirements and align technical decisions. Used GitLab for version control and CI, and worked with internal tooling for builds and testing.',
	},
	// {
	// 	company: 'Radium Institute (Institut du Radium)',
	// 	time: '1914 - 1934',
	// 	title: 'Director',
	// 	location: 'Paris, France',
	// 	description: 'Led groundbreaking studies on radioactivity and mentored future Nobel Prize laureates.',
	// },
];

export const education = [
	{
		school: 'Jagiellonian University',
		time: '2021 - 2024',
		degree: 'Bachelor’s in Computer Science',
		location: 'Krakow, Poland',
		description: 'Developed a strong foundation in computer science and mathematics, along with practical experience in software development for web, mobile, and desktop platforms.',

	},
	{
		school: 'Jagiellonian University',
		time: '2024 - 2026(expected)',
		degree: 'Master’s in Computer Science',
		location: 'Krakow, Poland',
		description: 'Focused on machine learning and computer vision, with involvement in practical research projects and publications. Continued developing programming skills, including low-level languages such as assembler.',
	},
	// {
	// 	school: 'University of Paris',
	// 	time: '1891 - 1895',
	// 	degree: 'Master’s in Physics and Mathematics',
	// 	location: 'Paris, France',
	// 	description: 'Graduated at the top of her class in physics and second in mathematics.',
	// },
];

export const skills = [
	{
		title: 'Machine Learning & AI',
		description: 'Machine Learning, LLMs, NLP, PyTorch, NumPy, pandas',
	},
	{
		title: 'Programming Languages',
		description: 'C++, Python, .NET, C#, Java, Shell, Assembler',
	},
	{
		title: 'Software Engineering',
		description: 'OOP, SOLID, Design Patterns, Unit Testing, PyTest, Google Test',
	},
	{
		title: 'DevOps & Tools',
		description: 'Git, GitLab, CI/CD, Docker, Jira, Agile',
	},
	{
		title: 'Systems',
		description: 'Linux, macOS, Windows',
	},
	{
		title: 'Databases',
		description: 'SQL',
	},
	{
		title: 'Mathematics',
		description: 'Statistics, Calculus, Linear Algebra',
	},
	// {
	// 	title: 'Experimental Techniques',
	// 	description: 'Spectroscopy, Isolation of Radioactive Elements, Radiation Measurement',
	// },
];

export const publications = [
	{
		title:
		'ReLAPSe: Reinforcement-Learning-trained Adversarial Prompt Search for Erased concepts in unlearned diffusion models',
		authors:
		'Ignacy Kolton, Kacper Marzol, Paweł Batorski, Marcin Mazur, Paul Swoboda, Przemysław Spurek',
		journal: 'arXiv preprint arXiv:2602.00350',
		time: 'January 2026',
		link: 'https://arxiv.org/abs/2602.00350',
		repo: 'https://github.com/gmum/ReLaPSe',
		abstract:
		"Machine unlearning is a key defense mechanism for removing unauthorized concepts from text-to-image diffusion models, yet recent evidence shows that latent visual information often persists after unlearning. Existing adversarial approaches for exploiting this leakage are constrained by fundamental limitations: optimization-based methods are computationally expensive due to per-instance iterative search. At the same time, reasoning-based and heuristic techniques lack direct feedback from the target model's latent visual representations. To address these challenges, we introduce ReLAPSe, a policy-based adversarial framework that reformulates concept restoration as a reinforcement learning problem. ReLAPSe trains an agent using Reinforcement Learning with Verifiable Rewards (RLVR), leveraging the diffusion model's noise prediction loss as a model-intrinsic and verifiable feedback signal. This closed-loop design directly aligns textual prompt manipulation with latent visual residuals, enabling the agent to learn transferable restoration strategies rather than optimizing isolated prompts. By pioneering the shift from per-instance optimization to global policy learning, ReLAPSe achieves efficient, near-real-time recovery of fine-grained identities and styles across multiple state-of-the-art unlearning methods, providing a scalable tool for rigorous red-teaming of unlearned diffusion models.",
 	},
	{
		title: 'MedGS: Gaussian Splatting for Multi-Modal 3D Medical Imaging',
		authors: 'Kacper Marzol, Ignacy Kolton, Weronika Smolak-Dyżewska, Joanna Kaleta, Marcin Mazur, Przemysław Spurek',
		journal: 'arXiv preprint arXiv:2509.16806',
		time: 'September 2025',
		link: 'https://arxiv.org/abs/2509.16806',
		repo: 'https://github.com/gmum/MedGS',
		abstract: 'Multi-modal three-dimensional (3D) medical imaging data, derived from ultrasound, magnetic resonance imaging (MRI), and potentially computed tomography (CT), provide a widely adopted approach for non-invasive anatomical visualization. Accurate modeling, registration, and visualization in this setting depend on surface reconstruction and frame-to-frame interpolation. Traditional methods often face limitations due to image noise and incomplete information between frames. To address these challenges, we present MedGS, a semi-supervised neural implicit surface reconstruction framework that employs a Gaussian Splatting (GS)-based interpolation mechanism. In this framework, medical imaging data are represented as consecutive two-dimensional (2D) frames embedded in 3D space and modeled using Gaussian-based distributions. This representation enables robust frame interpolation and high-fidelity surface reconstruction across imaging modalities.',
	},
];
