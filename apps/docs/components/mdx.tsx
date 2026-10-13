import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { Banner } from 'fumadocs-ui/components/banner';
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import * as Twoslash from 'fumadocs-twoslash/ui';
import { Mermaid } from './mermaid';
import { Screenshot } from './screenshot';
import { KitPreview } from './kit-preview';
import { ComponentHeader, PropsCard } from './component-header';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    ...Twoslash,
    img: (props) => <ImageZoom {...(props as React.ComponentProps<typeof ImageZoom>)} />,
    Step,
    Steps,
    Accordion,
    Accordions,
    File,
    Files,
    Folder,
    TypeTable,
    Banner,
    InlineTOC,
    Mermaid,
    Screenshot,
    KitPreview,
    ComponentHeader,
    PropsCard,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
