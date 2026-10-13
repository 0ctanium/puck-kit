import { llms, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { docsRoute } from './shared';
import { defineDocs } from 'fumadocs-mdx/macro';
import { applyMdxPreset } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins';
import { remarkAutoTypeTable } from 'fumadocs-typescript';
import { transformerTwoslash } from 'fumadocs-twoslash';
import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
    mdxOptions: applyMdxPreset({
      remarkPlugins: [remarkMdxMermaid, remarkAutoTypeTable],
      remarkNpmOptions: { persist: { id: 'package-manager' } },
      rehypeCodeOptions: {
        themes: { light: 'github-light', dark: 'github-dark' },
        langs: ['ts', 'tsx', 'js', 'jsx', 'json', 'jsonc', 'bash', 'css', 'html', 'astro', 'mdx'],
        transformers: [
          ...(rehypeCodeDefaultOptions.transformers ?? []),
          transformerTwoslash(),
        ],
      },
    }),
  },
  meta: {
    schema: metaSchema,
  },
});

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${await page.data.getText('processed')}`,
});
