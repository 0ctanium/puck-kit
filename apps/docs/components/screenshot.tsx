import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { cn } from '@/lib/cn';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Reads a PNG's intrinsic size from its header (screenshots are taken at 2× DPR). */
function pngSize(file: string): { width: number; height: number } | undefined {
  const full = path.join(process.cwd(), 'public', file);
  if (!existsSync(full)) return undefined;
  const buf = readFileSync(full);
  return { width: buf.readUInt32BE(16) / 2, height: buf.readUInt32BE(20) / 2 };
}

/**
 * A screenshot from `public/screenshots`, framed and zoomable.
 * `variant="browser"` adds a small window chrome above it.
 */
export function Screenshot({
  src,
  alt,
  caption,
  variant = 'plain',
  className,
  maxWidth,
}: {
  src: string;
  alt: string;
  caption?: string;
  variant?: 'plain' | 'browser' | 'panel';
  className?: string;
  /** CSS max-width of the frame, e.g. 360 for a narrow panel shot. */
  maxWidth?: number;
}) {
  const file = src.startsWith('/') ? src : `/screenshots/${src}`;
  const size = pngSize(file) ?? { width: 1200, height: 750 };

  return (
    <figure className={cn('not-prose my-6', className)} style={maxWidth ? { maxWidth } : undefined}>
      <div
        className={cn(
          'overflow-hidden rounded-xl border bg-fd-card shadow-sm',
          variant === 'panel' && 'bg-[repeating-conic-gradient(var(--color-fd-muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px] p-4',
        )}
      >
        {variant === 'browser' && (
          <div className="flex items-center gap-1.5 border-b bg-fd-muted/60 px-3 py-2">
            <span className="size-2.5 rounded-full bg-red-400/80" />
            <span className="size-2.5 rounded-full bg-amber-400/80" />
            <span className="size-2.5 rounded-full bg-emerald-400/80" />
          </div>
        )}
        <ImageZoom
          src={file}
          alt={alt}
          width={size.width}
          height={size.height}
          className={cn('block h-auto w-full', variant === 'panel' && 'rounded-lg border shadow-md')}
        />
      </div>
      {caption && <figcaption className="mt-2 text-center text-sm text-fd-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
