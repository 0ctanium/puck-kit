import { isValidSlug, savePage } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isValidSlug(slug)) return Response.json({ error: "Invalid slug" }, { status: 400 });
  await savePage(slug, await req.json());
  return Response.json({ ok: true });
}
