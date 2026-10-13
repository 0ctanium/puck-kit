import { Render, type Data } from '@puckeditor/core';
import { createBuilderConfig, defaultTokens } from 'puck-kit';
import { cn } from '@/lib/cn';

const config = createBuilderConfig();

type Item = { type: string; props: Record<string, unknown> };

let counter = 0;

/** Gives every node (and nested slot node) an id, unique on the page. */
function withIds(items: Item[], prefix: string): Item[] {
  return items.map((item) => {
    const props: Record<string, unknown> = { ...item.props };
    for (const [key, value] of Object.entries(props)) {
      if (Array.isArray(value) && value.every((v) => v && typeof v === 'object' && 'type' in v)) {
        props[key] = withIds(value as Item[], prefix);
      } else if (key === 'columns' && Array.isArray(value)) {
        props[key] = (value as { content: Item[] }[]).map((c) => ({ ...c, content: withIds(c.content ?? [], prefix) }));
      }
    }
    return { ...item, props: { ...props, id: (props.id as string) ?? `${prefix}-${item.type}-${++counter}` } };
  });
}

/** Fills each item with the component's default props (like dropping it in the editor). */
function withDefaults(items: Item[]): Item[] {
  return items.map((item) => {
    const defaults = (config.components[item.type]?.defaultProps ?? {}) as Record<string, unknown>;
    const props: Record<string, unknown> = { ...defaults, ...item.props };
    if (item.props.styles === undefined) props.styles = defaults.styles;
    for (const [key, value] of Object.entries(props)) {
      if (Array.isArray(value) && value.every((v) => v && typeof v === 'object' && 'type' in v)) {
        props[key] = withDefaults(value as Item[]);
      } else if (key === 'columns' && Array.isArray(value)) {
        props[key] = (value as { content: Item[] }[]).map((c) => ({ ...c, content: withDefaults(c.content ?? []) }));
      }
    }
    return { ...item, props };
  });
}

/**
 * Renders real puck-kit components server-side with Puck's `<Render>`, exactly as a public page
 * would (CSS compiled by the kit, hoisted to <head>). `content` is Puck data: missing props are
 * filled with each component's defaults.
 */
export function KitPreview({
  content,
  className,
  padding = 24,
  title,
}: {
  content: Item[];
  className?: string;
  padding?: number;
  title?: string;
}) {
  const prefix = `docs${++counter}`;
  const data: Data = {
    root: { props: { tokens: defaultTokens, styles: {} } as Data['root']['props'] },
    content: withIds(withDefaults(content), prefix) as Data['content'],
  };
  return (
    <div className={cn('not-prose my-6 overflow-hidden rounded-xl border', className)}>
      <div className="flex items-center justify-between border-b bg-fd-muted/50 px-3 py-1.5 text-xs text-fd-muted-foreground">
        <span className="font-medium">{title ?? 'Live preview'}</span>
        <span className="font-mono">{'<Render />'}</span>
      </div>
      <div className="bg-white text-[#111827]" style={{ padding }}>
        <Render config={config} data={data} />
      </div>
    </div>
  );
}
