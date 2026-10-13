import { notFound } from "next/navigation";
import { Render } from "@puckeditor/core";
import { fontMetadata } from "puck-kit";
import { config } from "@/lib/config";
import { loadFonts } from "@/lib/fonts";
import { loadPage } from "@/lib/store";
import { cache } from "react";

export const dynamic = "force-dynamic";

const normalizeSlug = (params: { slug: string[] }) => {
  if (!params.slug || params.slug.length === 0) return "home";
  return params.slug.join("/");
};

const load = cache(async (params: { slug: string[] }) => {
  const slug = normalizeSlug(params);
  return loadPage(slug);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const data = await load(await params);
  return {
    title:
      (data?.root?.props as { title?: string } | undefined)?.title ||
      "Untitled",
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const data = await load(await params);
  if (!data) notFound();
  // Only the fonts this page uses are loaded.
  return <Render config={config} data={data} metadata={fontMetadata(await loadFonts(), data)} />;
}
