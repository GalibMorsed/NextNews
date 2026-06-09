import { NextResponse } from "next/server";
import { getBreakingNews } from "../../../../lib/getBreakingNews";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category")?.trim() || undefined;
    const region = url.searchParams.get("region")?.trim() || undefined;
    const country =
      region === "in" || region === "india"
        ? "in"
        : url.searchParams.get("country")?.trim() || "in";

    const articles = await getBreakingNews({
      category,
      country,
    });

    return NextResponse.json(
      { articles },
      {
        headers: {
          "Cache-Control":
            "public, max-age=0, s-maxage=600, stale-while-revalidate=900",
        },
      },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ articles: [] }, { status: 500 });
  }
}
