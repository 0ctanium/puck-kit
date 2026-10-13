import { notFound } from "next/navigation";
import { isValidSlug, loadPage } from "@/lib/store";
import { Editor } from "./Editor";

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();
  return <Editor slug={slug} data={await loadPage(slug)} />;
}
