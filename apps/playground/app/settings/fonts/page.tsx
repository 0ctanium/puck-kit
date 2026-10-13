import { loadFonts } from "@/lib/fonts";
import { FontSettings } from "./FontSettings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fonts · Puck Kit Playground" };

export default async function FontsPage({ searchParams }: { searchParams: Promise<{ return?: string }> }) {
  const { return: back } = await searchParams;
  // Only allow returning to a local path.
  const returnTo = back && /^\/[a-z0-9/_-]*$/i.test(back) ? back : "/edit/home";
  return <FontSettings initialFonts={await loadFonts()} returnTo={returnTo} />;
}
