import { NextRequest, NextResponse } from "next/server";
import { searchUnsplashPhotos } from "@/lib/services/unsplash";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "20");

  if (!query) {
    return NextResponse.json(
      { error: "Le paramètre 'query' est requis" },
      { status: 400 }
    );
  }

  try {
    const results = await searchUnsplashPhotos(query, page, perPage);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Unsplash search error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche d'images" },
      { status: 500 }
    );
  }
}
