// Takes the documentation screenshots from the playground (apps/playground, `pnpm dev`).
//
//   pnpm --filter docs screenshots            # all
//   pnpm --filter docs screenshots editor     # only names containing "editor"
//
// Writes the gallery page to apps/playground/data/docs-gallery.json (gitignored), then captures:
// - components on the public page (/docs-gallery), one PNG per `#shot-<name>`;
// - editor UI on /edit/home and /edit/docs-gallery (panels, sections, popovers).
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gallery } from './gallery.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, '../public/screenshots');
const PLAYGROUND = path.join(here, '../../playground/data');
const BASE = process.env.PLAYGROUND_URL ?? 'http://localhost:3030';
const filter = process.argv[2];

await mkdir(OUT, { recursive: true });
await writeFile(path.join(PLAYGROUND, 'docs-gallery.json'), JSON.stringify(gallery, null, 2));

const browser = await chromium.launch();
const HIDE_DEV = 'nextjs-portal{display:none!important}';
const want = (name) => !filter || name.includes(filter);
const done = [];

async function newPage(width = 1440, height = 900) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2, locale: 'en-US' });
  await page.addInitScript((css) => {
    addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = css;
      document.head.append(s);
    });
  }, HIDE_DEV);
  return page;
}

async function save(target, name, options = {}) {
  if (!want(name)) return;
  await target.screenshot({ path: path.join(OUT, `${name}.png`), animations: 'disabled', ...options });
  done.push(name);
}

/* ------------------------------------------------------------------ components (public page) */

{
  const page = await newPage(1200, 900);
  await page.goto(`${BASE}/docs-gallery`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500); // images, video players
  for (const item of gallery.content) {
    const name = item.props.advanced.htmlId.replace(/^shot-/, '');
    await save(page.locator(`#shot-${name}`), `component-${name}`);
  }
  await page.close();
}

/* ------------------------------------------------------------------ editor helpers */

const editorPage = async (slug, { width = 1440, height = 900 } = {}) => {
  const page = await newPage(width, height);
  await page.goto(`${BASE}/edit/${slug}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  return page;
};

const rightSidebar = (page) => page.locator('[class*="_Sidebar--right_"]');
const leftSidebar = (page) => page.locator('[class*="_Sidebar--left_"]');
const header = (page) => page.locator('[class*="_PuckLayout-header_"]');

/** Drawer labels of the elements selected below (to check the selection landed on them). */
const LABELS = {
  'section-demo': 'Section', 'container-demo': 'Container', 'vflex-demo': 'V Flex', 'hflex-demo': 'H Flex',
  'grid-demo': 'Grid', 'columns-demo': 'Columns', 'box-demo': 'Box', 'list-demo': 'List', 'listitem-0': 'List Item',
  'linkblock-demo': 'Link Block', 'button-demo': 'Button', 'heading-demo': 'Heading', 'heading-2': 'Heading',
  'paragraph-demo': 'Paragraph', 'text-demo': 'Text', 'textlink-demo': 'Text Link', 'quote-demo': 'Quote',
  'image-demo': 'Image', 'youtube-demo': 'YouTube', 'vimeo-demo': 'Vimeo', 'banner-demo': 'Promo Banner',
  'hflex-2': 'Box', 'grid-1': 'Box',
};

/** Selects an element in the canvas by its Puck id. */
async function select(page, id) {
  const frame = page.frameLocator('iframe');
  const el = frame.locator(`[data-puck-component="${id}"]`).first();
  await el.scrollIntoViewIfNeeded();
  await el.click({ position: { x: 4, y: 4 } });
  await page.waitForTimeout(400);
  // A click on a container may land on a child: go up through the breadcrumbs.
  const label = LABELS[id];
  if (!label) return;
  for (let i = 0; i < 4; i++) {
    const title = (await rightSidebar(page).locator('[class*="_SidebarSection-heading_"]').first().innerText()).trim();
    if (title === label) break;
    await rightSidebar(page).locator('[class*="_SidebarSection-breadcrumbs_"] button').last().click();
    await page.waitForTimeout(300);
  }
}

/** Screenshot of a panel, cut just below its last visible content. */
async function saveTrimmed(page, panel, name, contentSelector) {
  if (!want(name)) return;
  const box = await panel.boundingBox();
  const bottom = await panel.evaluate((root, sel) => {
    let max = 0;
    for (const n of root.querySelectorAll(sel)) {
      const r = n.getBoundingClientRect();
      if (r.height > 0 && r.width > 0) max = Math.max(max, r.bottom);
    }
    return max;
  }, contentSelector);
  const height = Math.max(120, Math.min(box.height, bottom - box.y + 24));
  await save(page, name, { clip: { x: box.x, y: box.y, width: box.width, height } });
}

async function tab(page, name) {
  await rightSidebar(page).locator('[class*="KitFieldsTabButton"]', { hasText: new RegExp(`^${name}$`) }).click();
  await page.waitForTimeout(300);
}

/** A style panel section, expanded. */
async function section(page, title) {
  const sec = rightSidebar(page).locator('section[class*="__section"]').filter({
    has: page.locator('button[class*="__header"] > span', { hasText: new RegExp(`^${title}$`) }),
  });
  const body = sec.locator('[class*="__body"]');
  if (!(await body.count())) {
    await sec.locator('button[class*="__header"]').click();
    await page.waitForTimeout(300);
  }
  await sec.scrollIntoViewIfNeeded();
  return sec;
}

/** Click a viewport button in the header (0 = widest). */
async function viewport(page, index) {
  await header(page).locator('[class*="ViewportBar"][class*="__button"]').nth(index).click();
  await page.waitForTimeout(800);
}

/* ------------------------------------------------------------------ editor: overview */

{
  const page = await editorPage('home');
  await save(page, 'editor-overview');
  await save(leftSidebar(page), 'editor-drawer');
  await save(header(page), 'editor-header');
  await save(page.locator('[class*="ViewportBar"][class*="__bar"]').first(), 'editor-viewport-bar');

  // Tokens panel
  await page.locator('[class*="_NavItem_"]').filter({ hasText: 'Tokens' }).click();
  await page.waitForTimeout(500);
  await saveTrimmed(page, leftSidebar(page), 'editor-tokens', 'button, [class*="__row"]');

  // Mobile viewport
  await page.locator('[class*="_NavItem_"]').filter({ hasText: 'Blocks' }).click();
  await viewport(page, 3);
  await page.waitForTimeout(800);
  await save(page, 'editor-mobile');
  await page.close();
}

/* ------------------------------------------------------------------ editor: per component */

const components = {
  section: 'section-demo',
  container: 'container-demo',
  'vertical-flex': 'vflex-demo',
  'horizontal-flex': 'hflex-demo',
  grid: 'grid-demo',
  columns: 'columns-demo',
  box: 'box-demo',
  list: 'list-demo',
  'list-item': 'listitem-0',
  'link-block': 'linkblock-demo',
  button: 'button-demo',
  heading: 'heading-demo',
  paragraph: 'paragraph-demo',
  text: 'text-demo',
  'text-link': 'textlink-demo',
  quote: 'quote-demo',
  image: 'image-demo',
  youtube: 'youtube-demo',
  vimeo: 'vimeo-demo',
  banner: 'banner-demo',
};

{
  const page = await editorPage('docs-gallery', { height: 1200 });
  for (const [name, id] of Object.entries(components)) {
    if (!want(`fields-${name}`) && !want(`canvas-${name}`)) continue;
    await select(page, id);
    await tab(page, 'Settings');
    await saveTrimmed(page, rightSidebar(page), `fields-${name}`, 'input, textarea, button, label, [class*="_Input_"]');
  }
  await page.close();
}

/* ------------------------------------------------------------------ editor: style panel */

{
  const page = await editorPage('docs-gallery', { height: 1400 });

  await select(page, 'button-demo');
  await tab(page, 'Style');
  await saveTrimmed(page, rightSidebar(page), 'style-panel', 'section, button');
  await save(rightSidebar(page).locator('[class*="StylePanel"][class*="__bar"]').first(), 'style-breakpoints');

  // State dropdown open
  await rightSidebar(page).locator('[class*="__stateTrigger"]').click();
  await page.waitForTimeout(300);
  await save(page, 'style-states', { clip: await clipAround(page, rightSidebar(page), 520) });
  await page.keyboard.press('Escape');

  const sections = [
    ['layout-flex', 'hflex-demo', 'Layout'],
    ['layout-grid', 'grid-demo', 'Layout'],
    ['flex-child', 'hflex-2', 'Flex child'],
    ['grid-child', 'grid-1', 'Grid child'],
    ['spacing', 'button-demo', 'Spacing'],
    ['size', 'image-demo', 'Size'],
    ['position', 'box-demo', 'Position'],
    ['typography', 'heading-demo', 'Typography'],
    ['backgrounds', 'section-demo', 'Backgrounds'],
    ['borders', 'box-demo', 'Borders'],
    ['effects', 'box-demo', 'Effects'],
  ];
  for (const [name, id, title] of sections) {
    if (!want(`section-${name}`)) continue;
    await select(page, id);
    await tab(page, 'Style');
    await save(await section(page, title), `section-${name}`);
  }

  // Popovers (they open beside the panel): clip the right part of the window.
  async function popover(name, id, title, trigger) {
    if (!want(name)) return;
    await select(page, id);
    await tab(page, 'Style');
    const sec = await section(page, title);
    const target = typeof trigger === 'function' ? trigger(sec) : sec.locator(trigger).first();
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    await target.click();
    await page.waitForTimeout(500);
    // Frame the trigger + the open popover / listbox, with some context around.
    const boxes = [box];
    for (const pop of await page.locator('[class*="__popover"], [class*="__listbox"]').all()) {
      if (await pop.isVisible()) boxes.push(await pop.boundingBox());
    }
    const pad = 32;
    const x0 = Math.max(0, Math.min(...boxes.map((b) => b.x)) - pad);
    const y0 = Math.max(0, Math.min(...boxes.map((b) => b.y)) - pad);
    const x1 = Math.min(1440, Math.max(...boxes.map((b) => b.x + b.width)) + pad);
    const y1 = Math.min(1400, Math.max(...boxes.map((b) => b.y + b.height)) + pad);
    await save(page, name, { clip: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  await popover('popover-color', 'heading-demo', 'Typography', '[class*="__swatch"]');
  await popover('popover-font', 'heading-demo', 'Typography', (sec) => sec.locator('[class*="__dropdown"]').first());
  await popover('popover-background', 'section-demo', 'Backgrounds', (sec) => sec.locator('[class*="__swatch"]').first());
  await popover('popover-shadow', 'box-demo', 'Effects', (sec) => sec.getByText('Outside').first());
  await popover('popover-grid-tracks', 'grid-demo', 'Layout', (sec) => sec.locator('button[title="Edit grid"]').last());

  // Inherited values: Heading on Tablet (font size set on Desktop).
  if (want('style-inherited')) {
    await select(page, 'heading-2');
    await tab(page, 'Style');
    await viewport(page, 2);
    await save(await section(page, 'Typography'), 'style-inherited');
    await viewport(page, 1);
  }
  await page.close();
}

async function clipAround(page, locator, height) {
  const box = await locator.boundingBox();
  return { x: box.x, y: box.y, width: box.width, height: Math.min(height, page.viewportSize().height - box.y) };
}

await browser.close();
console.log(`Saved ${done.length} screenshots:\n  ${done.join('\n  ')}`);
