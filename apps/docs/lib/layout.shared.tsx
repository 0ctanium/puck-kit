import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="9" height="9" rx="2.5" className="fill-fd-primary" />
      <rect x="13" y="2" width="9" height="9" rx="2.5" className="fill-fd-primary/40" />
      <rect x="2" y="13" width="9" height="9" rx="2.5" className="fill-fd-primary/40" />
      <rect x="13" y="13" width="9" height="9" rx="2.5" className="fill-fd-primary/70" />
    </svg>
  );
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-semibold">
          <Logo />
          {appName}
        </span>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      { text: 'Documentation', url: '/docs', active: 'nested-url' },
      { text: 'Components', url: '/docs/components', active: 'nested-url' },
    ],
  };
}
