// Puck data for the screenshot gallery page (`/docs-gallery` in the playground).
// Each demo is a top-level Box with an HTML id `shot-<name>`, screenshotted on the public page;
// element ids are stable (`<name>-…`) so the editor shots can select them.

const primary = 'var(--pk-color-primary)';

/** The kit's default props (styles included), as when a component is dropped in the editor. */
const DEFAULTS = {
  Section: { tag: 'section', styles: { base: { paddingTop: '64px', paddingBottom: '64px' } } },
  Container: {
    tag: 'div',
    styles: {
      base: { width: '100%', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '16px', paddingRight: '16px', maxWidth: '960px' },
      wide: { maxWidth: '1200px' },
      tablet: { maxWidth: '728px' },
      mobile: { maxWidth: 'none' },
    },
  },
  VerticalFlex: { tag: 'div', styles: { base: { display: 'flex', flexDirection: 'column', gap: '16px' } } },
  HorizontalFlex: { tag: 'div', styles: { base: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px' } } },
  Grid: {
    tag: 'div',
    styles: { base: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gridTemplateRows: 'auto auto', gap: '16px' } },
  },
  Box: { tag: 'div', styles: {} },
  List: { tag: 'ul', styles: { base: { paddingLeft: '24px' } } },
  ListItem: { tag: 'li', styles: {} },
  LinkBlock: { tag: 'a', href: '#', target: '', styles: { base: { display: 'block', color: 'inherit', textDecoration: 'none' } } },
  Heading: { tag: 'h2', text: 'Heading', styles: { base: { fontSize: '32px', fontWeight: '700', lineHeight: '1.2' } } },
  Paragraph: { tag: 'p', styles: {} },
  Text: { tag: 'div', styles: {} },
  Quote: { tag: 'blockquote', styles: { base: { paddingLeft: '16px', fontStyle: 'italic', fontSize: '20px' } } },
  Image: { src: '', alt: '', loading: 'lazy', styles: { base: { display: 'block', maxWidth: '100%', height: 'auto' } } },
};

const BUTTON_STYLES = {
  base: {
    display: 'inline-block', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '20px', paddingRight: '20px',
    backgroundColor: primary, color: 'var(--pk-color-white)', borderRadius: '6px', borderWidth: '0', fontWeight: '600',
    textDecoration: 'none', textAlign: 'center', cursor: 'pointer',
    transition: 'transform 150ms ease, box-shadow 200ms ease, filter 200ms ease',
  },
  'base:hover': { transform: 'translate(0px, -1px)', boxShadow: '0px 4px 12px 0px rgba(17, 24, 39, 0.15)', filter: 'brightness(110%)' },
  'base:focus-visible': { boxShadow: '0px 0px 0px 3px rgba(79, 70, 229, 0.35)' },
  'base:active': { transform: 'scale(0.98, 0.98)', boxShadow: 'none', filter: 'brightness(95%)' },
};

const VIDEO = {
  title: '', autoplay: false, muted: false, loop: false, controls: true, start: 0, privacy: true,
  styles: { base: { display: 'block', width: '100%', height: 'auto', aspectRatio: '16/9', borderWidth: '0', borderStyle: 'none' } },
};

/** Merge styles per key (breakpoint / state). */
function mergeStyles(a = {}, b = {}) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = { ...(a[k] ?? {}), ...v };
  return out;
}

function el(type, id, props = {}, content) {
  const d = DEFAULTS[type] ?? {};
  const p = { ...d, ...props, id, styles: mergeStyles(d.styles, props.styles), advanced: props.advanced ?? {} };
  if (content) p.content = content;
  else if (['Section', 'Container', 'VerticalFlex', 'HorizontalFlex', 'Grid', 'Box', 'List', 'ListItem', 'LinkBlock'].includes(type))
    p.content = p.content ?? [];
  return { type, props: p };
}

const button = (id, label, styles) => ({
  type: 'Button',
  props: { id, tag: 'a', label, href: '#', target: '', styles: mergeStyles(BUTTON_STYLES, styles), advanced: {} },
});

const textLink = (id, text) => ({
  type: 'TextLink',
  props: {
    id, text, href: '#', target: '',
    styles: { base: { color: primary, textDecoration: 'underline', cursor: 'pointer', transition: 'opacity 150ms ease' }, 'base:hover': { opacity: '0.75' } },
    advanced: {},
  },
});

const text = (id, html, styles) => el('Text', id, { text: html, styles });
const para = (id, html, styles) => el('Paragraph', id, { text: html, styles });
const heading = (id, t, tag = 'h2', styles) => el('Heading', id, { text: t, tag, styles });

const chip = (id, label, bg) =>
  el('Box', id, {
    styles: {
      base: {
        paddingTop: '16px', paddingBottom: '16px', paddingLeft: '20px', paddingRight: '20px', backgroundColor: bg,
        color: '#ffffff', borderRadius: '10px', fontWeight: '600', textAlign: 'center',
      },
    },
  }, [text(`${id}-t`, `<p>${label}</p>`)]);

const colors = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc'];

/** A screenshot frame: `#shot-<name>`, white with padding. */
const NARROW = new Set(['box', 'list', 'list-item', 'link-block', 'button', 'heading', 'paragraph', 'text', 'text-link', 'quote', 'image', 'youtube', 'vimeo']);

const shot = (name, content, styles = NARROW.has(name) ? { width: '720px' } : {}) =>
  el('Box', `shot-${name}`, {
    advanced: { htmlId: `shot-${name}` },
    styles: { base: { paddingTop: '40px', paddingBottom: '40px', paddingLeft: '40px', paddingRight: '40px', backgroundColor: '#ffffff', ...styles } },
  }, content);

const card = {
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#e5e7eb', borderRadius: '12px',
  paddingTop: '24px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px', backgroundColor: '#ffffff',
};

export const gallery = {
  root: {
    props: {
      title: 'Docs gallery',
      tokens: {
        colors: [
          { name: 'Primary', value: '#4f46e5' },
          { name: 'Text', value: '#111827' },
          { name: 'Muted', value: '#6b7280' },
          { name: 'Surface', value: '#f3f4f6' },
          { name: 'White', value: '#ffffff' },
        ],
        fonts: [
          { name: 'Sans', value: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
          { name: 'Serif', value: "ui-serif, Georgia, Cambria, 'Times New Roman', serif" },
          { name: 'Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
        ],
        sizes: [
          { name: 'XS', value: '4px' },
          { name: 'SM', value: '8px' },
          { name: 'MD', value: '16px' },
          { name: 'LG', value: '32px' },
          { name: 'XL', value: '64px' },
        ],
      },
      styles: {},
    },
  },
  content: [
    shot('section', [
      el('Section', 'section-demo', { styles: { base: { backgroundColor: 'var(--pk-color-surface)', borderRadius: '12px' } } }, [
        el('Container', 'section-container', {}, [
          el('VerticalFlex', 'section-flex', { styles: { base: { alignItems: 'center', textAlign: 'center' } } }, [
            heading('section-h', 'A full-width section', 'h2'),
            para('section-p', '<p>Sections add vertical rhythm: 64px of padding above and below by default.</p>', {
              base: { color: 'var(--pk-color-muted)' },
            }),
          ]),
        ]),
      ]),
    ]),
    shot('container', [
      el('Section', 'container-section', { styles: { base: { backgroundColor: '#eef2ff', paddingTop: '32px', paddingBottom: '32px', borderRadius: '12px' } } }, [
        el('Container', 'container-demo', {
          styles: { base: { borderWidth: '2px', borderStyle: 'dashed', borderColor: primary, borderRadius: '8px', paddingTop: '24px', paddingBottom: '24px', backgroundColor: '#ffffff' } },
        }, [
          para('container-p', '<p><strong>Container</strong> — centered, max 960px on Desktop, 1200px on Wide, 728px on Tablet, full width on Mobile.</p>'),
        ]),
      ]),
    ]),
    shot('vertical-flex', [
      el('VerticalFlex', 'vflex-demo', {}, [chip('vflex-1', 'One', colors[0]), chip('vflex-2', 'Two', colors[1]), chip('vflex-3', 'Three', colors[2])]),
    ]),
    shot('horizontal-flex', [
      el('HorizontalFlex', 'hflex-demo', {}, [
        chip('hflex-1', 'One', colors[0]),
        el('Box', 'hflex-2', {
          styles: { base: { flexGrow: '1', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '20px', paddingRight: '20px', backgroundColor: colors[1], color: '#ffffff', borderRadius: '10px', fontWeight: '600', textAlign: 'center' } },
        }, [text('hflex-2-t', '<p>Two (grow)</p>')]),
        chip('hflex-3', 'Three', colors[2]),
      ]),
    ]),
    shot('grid', [
      el('Grid', 'grid-demo', {}, [
        el('Box', 'grid-1', {
          styles: { base: { gridRow: 'span 2', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '20px', paddingRight: '20px', backgroundColor: colors[0], color: '#ffffff', borderRadius: '10px', fontWeight: '600', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        }, [text('grid-1-t', '<p>Spans 2 rows</p>')]),
        chip('grid-2', 'Two', colors[1]),
        chip('grid-3', 'Three', colors[2]),
      ]),
    ]),
    shot('columns', [
      {
        type: 'Columns',
        props: {
          id: 'columns-demo',
          columns: ['Design', 'Build', 'Ship'].map((t, i) => ({
            content: [
              el('VerticalFlex', `columns-c${i}`, { styles: { base: { ...card, gap: '8px' } } }, [
                heading(`columns-h${i}`, t, 'h3', { base: { fontSize: '20px' } }),
                para(`columns-p${i}`, '<p>Each column is its own drop zone. Columns stack on phones.</p>', { base: { color: 'var(--pk-color-muted)' } }),
              ]),
            ],
          })),
          styles: { base: { display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }, mobile: { gridTemplateColumns: 'minmax(0,1fr)' } },
          advanced: {},
        },
      },
    ]),
    shot('box', [
      el('Box', 'box-demo', { tag: 'article', styles: { base: { ...card, maxWidth: '420px', boxShadow: '0px 8px 24px 0px rgba(17, 24, 39, 0.08)' } } }, [
        heading('box-h', 'A box as a card', 'h3', { base: { fontSize: '22px', marginBottom: '8px' } }),
        para('box-p', '<p>Box is a plain element with a drop zone. Pick a semantic tag (article, aside, nav…) and style it.</p>', { base: { color: 'var(--pk-color-muted)' } }),
      ]),
    ]),
    shot('list', [
      el('List', 'list-demo', { styles: { base: { display: 'flex', flexDirection: 'column', gap: '8px' } } }, [
        el('ListItem', 'list-1', {}, [text('list-1-t', '<p>Section, Container, Flex, Grid, Columns</p>')]),
        el('ListItem', 'list-2', {}, [text('list-2-t', '<p>Box, List, Link Block, Button</p>')]),
        el('ListItem', 'list-3', {}, [text('list-3-t', '<p>Heading, Paragraph, Text, Text Link, Quote</p>')]),
      ]),
    ]),
    shot('list-item', [
      el('List', 'listitem-list', { styles: { base: { paddingLeft: '0', maxWidth: '480px' } } }, [
        ...['Unlimited pages', 'Responsive styles', 'Design tokens', 'Custom fonts'].map((t, i) =>
          el('ListItem', `listitem-${i}`, {
            styles: {
              base: { display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px', borderRadius: '8px' },
              'base:odd': { backgroundColor: 'var(--pk-color-surface)' },
            },
          }, [
            el('Box', `listitem-${i}-dot`, { styles: { base: { width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: primary } } }),
            text(`listitem-${i}-t`, `<p>${t}</p>`),
          ]),
        ),
      ]),
    ]),
    shot('link-block', [
      el('LinkBlock', 'linkblock-demo', {
        styles: {
          base: { ...card, maxWidth: '420px', transition: 'border-color 150ms ease, box-shadow 150ms ease' },
          'base:hover': { borderColor: primary, boxShadow: '0px 8px 24px 0px rgba(79, 70, 229, 0.12)' },
        },
      }, [
        heading('linkblock-h', 'Getting started →', 'h3', { base: { fontSize: '20px', marginBottom: '6px' } }),
        para('linkblock-p', '<p>The whole card is one link. Drop anything inside a Link Block.</p>', { base: { color: 'var(--pk-color-muted)' } }),
      ]),
    ]),
    shot('button', [
      el('HorizontalFlex', 'button-row', {}, [
        button('button-demo', 'Get started'),
        button('button-outline', 'Learn more', {
          base: { backgroundColor: 'transparent', color: primary, borderWidth: '1px', borderStyle: 'solid', borderColor: primary },
        }),
      ]),
    ]),
    shot('heading', [
      el('VerticalFlex', 'heading-stack', { styles: { base: { gap: '8px' } } }, [
        heading('heading-demo', 'Heading 1', 'h1', { base: { fontSize: '48px', fontWeight: '800', lineHeight: '1.1' } }),
        heading('heading-2', 'Heading 2', 'h2'),
        heading('heading-3', 'Heading 3', 'h3', { base: { fontSize: '24px', fontWeight: '600' } }),
      ]),
    ]),
    shot('paragraph', [
      para('paragraph-demo', '<p>A <strong>Paragraph</strong> holds rich text: <em>emphasis</em>, <a href="#">links</a> and lists, but no headings.</p><p>Consecutive paragraphs get a little space between them, like in an article.</p>', {
        base: { maxWidth: '560px', fontSize: '17px', lineHeight: '1.6' },
      }),
    ]),
    shot('text', [
      text('text-demo', '<h3>Rich text block</h3><p>The Text element accepts every rich text feature:</p><ul><li>headings</li><li>bulleted and numbered lists</li><li>quotes and code</li></ul>', {
        base: { maxWidth: '560px' },
      }),
    ]),
    shot('text-link', [
      el('HorizontalFlex', 'textlink-row', { styles: { base: { gap: '6px' } } }, [
        text('textlink-t', '<p>Questions?</p>'),
        textLink('textlink-demo', 'Contact our team'),
      ]),
    ]),
    shot('quote', [
      el('Quote', 'quote-demo', {
        text: '<p>“Design is not just what it looks like and feels like. Design is how it works.”</p>',
        styles: { base: { borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: primary, maxWidth: '560px' } },
      }),
    ]),
    shot('image', [
      el('Image', 'image-demo', {
        src: 'https://picsum.photos/seed/mountains/1200/800',
        alt: 'Mountains',
        styles: { base: { width: '100%', maxWidth: '560px', aspectRatio: '16/10', objectFit: 'cover', borderRadius: '12px' } },
      }),
    ]),
    shot('youtube', [
      { type: 'YouTube', props: { ...VIDEO, id: 'youtube-demo', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', styles: mergeStyles(VIDEO.styles, { base: { maxWidth: '640px', borderRadius: '12px' } }), advanced: {} } },
    ]),
    shot('vimeo', [
      { type: 'Vimeo', props: { ...VIDEO, id: 'vimeo-demo', url: 'https://vimeo.com/76979871', styles: mergeStyles(VIDEO.styles, { base: { maxWidth: '640px', borderRadius: '12px' } }), advanced: {} } },
    ]),
    shot('banner', [
      {
        type: 'Banner',
        props: {
          id: 'banner-demo',
          title: 'Ship faster with design tokens',
          text: 'Every color, font and size here comes from the page’s tokens — change them once in the Tokens panel.',
          background: {
            color: 'var(--pk-color-primary)',
            image: 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 60%)',
            size: 'auto', position: '0% 0%', repeat: 'repeat',
          },
          textColor: 'var(--pk-color-white)',
          font: 'var(--pk-font-serif)',
          align: 'center',
          padding: 56,
          radius: 16,
          showButton: true,
          buttonLabel: 'Get started',
          buttonColor: 'var(--pk-color-text)',
        },
      },
    ]),
  ],
};
