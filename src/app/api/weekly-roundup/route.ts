import { NextResponse } from "next/server";
import { getWeeklyRoundup } from "../../../../lib/getWeeklyRoundup";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") ?? undefined;
    const region = url.searchParams.get("region") ?? undefined;
    const section = url.searchParams.get("section") ?? undefined;
    const source = url.searchParams.get("source") ?? undefined;

    const country = region === "in" || (category && /indian/i.test(category)) ? "in" : undefined;
    const roundupSection = section === "indian-tadka" ? "indian-tadka" : "general";

    const articles = await getWeeklyRoundup({
      category: category ?? undefined,
      country,
      section: roundupSection,
      source,
    });

    return NextResponse.json(articles, {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=172800, stale-while-revalidate=172800",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 500 });
  }
}
