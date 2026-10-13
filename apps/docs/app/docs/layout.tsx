import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { Banner } from 'fumadocs-ui/components/banner';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <>
      <Banner id="puck-kit-0.1" changeLayout={false}>
        puck-kit is pre-1.0: APIs may still change between minor versions.
      </Banner>
      <DocsLayout tree={source.getPageTree()} {...baseOptions()} links={[]}>
        {children}
      </DocsLayout>
    </>
  );
}
