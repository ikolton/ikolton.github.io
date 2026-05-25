// 1. Import utilities from `astro:content`
import { defineCollection, z } from "astro:content";

// 2. Import loader(s)
import { glob } from "astro/loaders";

import { template } from "./settings";

// 3. Define your collection(s)
const blog = defineCollection({
    // The collection stays registered (so `getCollection('blog')` keeps its
    // types) but while the blog is disabled we use a silent no-op loader, so
    // the empty BlogPosts directory doesn't log a warning on every build.
    // To re-enable: set template.enableBlog = true and add .md posts.
    loader: template.enableBlog
        ? glob({ pattern: "**/*.md", base: "./src/content/BlogPosts" })
        : { name: "blog-disabled", load: async () => {} },
    schema: z.object({
        title: z.string(),
        date: z.string(),
        excerpt: z.string(),
        tags: z.array(z.string()).optional(),
    }),
});
// 4. Export a single `collections` object to register your collection(s)
export const collections = { blog };
