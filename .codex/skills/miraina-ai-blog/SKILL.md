---
name: miraina-ai-blog
description: Research current AI news, choose a topic that matches MIRAINA's audience, write an SEO-optimized article, generate the required blog images, and publish it in this repository. Use when asked for today's AI blog, the latest AI news article, a daily AI update, or any MIRAINA blog post driven by recent AI announcements.
---

# MIRAINA AI Blog

Use this skill only inside the MIRAINA-Website repository. This workflow depends on current information, so use the web tool and prefer official or primary sources for factual claims.

## Required Reads

Read these files before drafting:

- `blogs/blog_template.html`
- the 3 newest `blogs/blog*.html`
- `data/data.json`
- `index.html`
- `sitemap.xml`
- `llms.txt`
- `references/seo-rules.md`
- `references/publish-checklist.md`

Read `references/ui-check.md` when you reach visual verification.

## Workflow

1. Research 5-7 candidate topics from the last 7 days with the web tool. Prioritize official announcements, Japanese business relevance, and topics connected to MIRAINA services such as LLMO, AI adoption, training, and automation.
2. Deepen research on the best topic. Keep exact source URLs, publish dates, product names, and any quoted numbers.
3. Determine the next blog number before creating any image or HTML assets.
4. Decide whether screenshots are necessary. Capture screenshots when the article cites concrete numbers, exact launch dates, official UI, or any claim that benefits from visual verification.
5. If screenshots are needed, capture 1-3 pages with Playwright, inspect the images to verify names, dates, and statistics, then convert the best 1-2 PNGs with `scripts/convert_screenshot.py`.
6. Classify the topic before writing the SEO structure. Decide whether the primary keyword is a definition-style topic (`concept`, `product`, `framework`, `spec`, `regulation`) or an event-style topic (`funding`, `launch`, `shutdown`, `acquisition`, `partnership`, `policy change`, `earnings`, `incident`). This classification controls the title pattern, H2 structure, and tone.
7. Design the SEO structure from the latest 3 blog posts. Follow `references/seo-rules.md` for keyword, title, description, heading, and tag rules. Do not force event-style topics into a `...とは？` frame.
8. Create `blogs/blogXXX.html` from `blogs/blog_template.html`. Keep the existing MIRAINA structure, write 2000-4000 Japanese characters, include the 芝優作 editor section, and place converted screenshots in `<figure class="article-figure">`.
9. Generate the article hero and card images with `scripts/generate_thumbnail.py <blog_num> "<title>"`. The script reads template PNGs from `bg_images/` in this skill, applies `blog_num % 3` as `A/B/C`, and renders the article H1 onto both the hero and card images.
10. Update the required publish surfaces by following `references/publish-checklist.md`.
11. Run a mechanical integrity check and a visual UI check. Use desktop and mobile renders and fix issues before finishing.
12. Report the title, file path, primary keyword, updated files, generated image paths, source URLs, and any fact corrections found during screenshot review.

## Topic Classification And Title Policy

Choose the title shape only after classifying the topic.

- Use `...とは？` only when the reader is genuinely looking for a definition, mechanism, or product explanation.
- Do not use `...とは？` for event-style facts that are naturally expressed as a sentence in Japanese, such as funding, shutdowns, acquisitions, partnerships, policy changes, or launch announcements.
- If the phrase sounds unnatural when read aloud as a noun, rewrite it as a factual headline. Good: `OpenAIが1220億ドルを調達`. Bad: `OpenAI 1220億ドル調達とは？`
- Apply the same classification to the H1, TOC, H2s, meta description, card copy, and `llms.txt`. Do not let only the body become factual while the title remains pseudo-definitional.
- When in doubt, prefer a headline that states the fact first, then explains the business impact.

## Screenshot Guidance

Capture screenshots only when they improve accuracy or comprehension. Skip them when the article is conceptual and does not cite fragile facts.

When you capture screenshots:

- prefer official pages over secondary coverage
- save the raw PNGs outside the repository, then convert only the selected images into `images/blogs_images`
- place the first converted figure under the H2 that explains the most important announcement or data point
- add a factual caption with the source organization

## Checks

Do not finish until all of the following are true:

- `blogXXX.html` exists
- `og:image` and `.article-thumbnail` point to `blogXXX-1.webp`
- `data/data.json` points to `blog-cardXXX.webp`
- `index.html`, `sitemap.xml`, and `llms.txt` reference the new blog
- event-style topics are not phrased as `...とは？` in the title, TOC, or first H2
- desktop and mobile screenshots show no layout breakage
