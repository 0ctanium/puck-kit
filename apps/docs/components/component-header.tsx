import { icons } from 'lucide-react';
import type { ReactNode } from 'react';

const categoryColor: Record<string, string> = {
  Structure: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  Basic: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Typography: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Media: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
};

function toPascal(name: string) {
  return name.replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase());
}

/**
 * Summary strip at the top of a component page: its drawer icon, category, the Puck component
 * name (key in `config.components`) and rendered tag(s).
 */
export function ComponentHeader({
  name,
  icon,
  category,
  tags,
  slot,
  children,
}: {
  /** Key in `config.components`. */
  name: string;
  /** Lucide icon name used in the drawer, e.g. "square-dashed-text". */
  icon: string;
  category: 'Structure' | 'Basic' | 'Typography' | 'Media';
  tags: string[];
  /** Accepts children (has a drop zone). */
  slot?: boolean;
  children?: ReactNode;
}) {
  const Icon = icons[toPascal(icon) as keyof typeof icons] ?? icons.Box;
  return (
    <div className="not-prose my-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border bg-fd-card p-4">
      <div className="flex size-11 items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary">
        <Icon className="size-5" />
      </div>
      <dl className="flex flex-1 flex-wrap gap-x-6 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-fd-muted-foreground">Component</dt>
          <dd className="font-mono font-medium">{name}</dd>
        </div>
        <div>
          <dt className="text-xs text-fd-muted-foreground">Category</dt>
          <dd>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor[category]}`}>{category}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-fd-muted-foreground">Renders</dt>
          <dd className="font-mono text-xs">
            {tags.map((t, i) => (
              <span key={t}>
                {i > 0 && <span className="text-fd-muted-foreground"> · </span>}
                {`<${t}>`}
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-fd-muted-foreground">Children</dt>
          <dd className="text-xs">{slot ? 'Drop zone (slot)' : 'None'}</dd>
        </div>
      </dl>
      {children}
    </div>
  );
}

/** A compact two-column card listing default styles as CSS. */
export function PropsCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="not-prose my-4 rounded-xl border bg-fd-card p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">{title}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
