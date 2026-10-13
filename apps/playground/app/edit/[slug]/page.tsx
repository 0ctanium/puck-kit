import { notFound } from "next/navigation";
import { loadFonts } from "@/lib/fonts";
import { isValidSlug, loadPage } from "@/lib/store";
import { Editor } from "./Editor";

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();
  const [data, fonts] = await Promise.all([loadPage(slug), loadFonts()]);
  return <Editor slug={slug} data={data} fonts={fonts} />;
}
