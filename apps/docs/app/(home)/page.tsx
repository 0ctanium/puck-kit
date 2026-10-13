import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Blocks,
  Palette,
  MonitorSmartphone,
  MousePointerClick,
  Server,
  Type,
  Puzzle,
} from 'lucide-react';

const features = [
  {
    icon: Blocks,
    title: '19 native elements',
    text: 'Sections, containers, flex, grid, columns, lists, links, buttons, typography and media — nest them freely.',
    href: '/docs/components',
  },
  {
    icon: MousePointerClick,
    title: 'Webflow-style panel',
    text: 'Layout, spacing, size, position, typography, backgrounds, borders and effects with visual controls.',
    href: '/docs/styling/style-panel',
  },
  {
    icon: MonitorSmartphone,
    title: 'Responsive & states',
    text: 'Desktop-first breakpoints (or mobile-first), plus hover, pressed, focus and structural states.',
    href: '/docs/styling/breakpoints',
  },
  {
    icon: Palette,
    title: 'Design tokens',
    text: 'Colors, fonts and sizes as CSS variables, editable in a Tokens panel with usage counts and safe renames.',
    href: '/docs/styling/tokens',
  },
  {
    icon: Server,
    title: 'Plain CSS, zero client JS',
    text: 'Styles compile to CSS at render time. Public pages are server-rendered with no Tailwind and no build step.',
    href: '/docs/styling/css-output',
  },
  {
    icon: Type,
    title: 'Font library',
    text: 'Google, self-hosted or stylesheet fonts. Pages only load the fonts they actually use.',
    href: '/docs/styling/fonts',
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,var(--color-brand-soft),transparent)]"
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pt-20 pb-12 text-center md:pt-28">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border bg-fd-card px-3 py-1 text-xs text-fd-muted-foreground">
            <Puzzle className="size-3.5 text-fd-primary" />
            A plugin + component kit for Puck 0.23
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            Webflow-style building blocks for <span className="text-fd-primary">Puck</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-fd-muted-foreground">
            Generic elements you nest freely, each with a responsive style panel. Styles compile to plain CSS at
            render time — no Tailwind, no build step, no client JS on public pages.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/docs/quick-start"
              className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Get started <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-lg border bg-fd-card px-5 py-2.5 text-sm font-medium transition hover:bg-fd-accent"
            >
              Read the docs
            </Link>
          </div>
          <pre className="mt-8 rounded-lg border bg-fd-card px-4 py-2 font-mono text-sm text-fd-muted-foreground">
            <span className="text-fd-primary">pnpm</span> add @puckeditor/core@~0.23 puck-kit
          </pre>
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-0">
          <div className="overflow-hidden rounded-t-xl border border-b-0 bg-fd-card shadow-2xl shadow-fd-primary/10">
            <div className="flex items-center gap-1.5 border-b bg-fd-muted/60 px-3 py-2">
              <span className="size-2.5 rounded-full bg-red-400/80" />
              <span className="size-2.5 rounded-full bg-amber-400/80" />
              <span className="size-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <Image
              src="/screenshots/editor-overview.png"
              alt="The Puck editor with puck-kit: component drawer, canvas and style panel"
              width={1440}
              height={900}
              priority
              className="block h-auto w-full"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, text, href }) => (
          <Link
            key={title}
            href={href}
            className="group rounded-xl border bg-fd-card p-5 transition hover:border-fd-primary/40 hover:bg-fd-accent/40"
          >
            <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary">
              <Icon className="size-4.5" />
            </div>
            <h2 className="font-medium">{title}</h2>
            <p className="mt-1 text-sm text-fd-muted-foreground">{text}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
