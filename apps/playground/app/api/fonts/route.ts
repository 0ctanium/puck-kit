import { loadFonts, sanitizeFonts, saveFonts } from "@/lib/fonts";

export async function GET() {
  return Response.json(await loadFonts());
}

export async function PUT(req: Request) {
  const fonts = sanitizeFonts(await req.json());
  await saveFonts(fonts);
  return Response.json(fonts);
}
