import { NextRequest, NextResponse } from "next/server";
import ky from "ky";

/**
 * API Route pour rechercher des produits alimentaires via Open Food Facts
 * Proxy pour éviter les problèmes CORS
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
  }

  try {
    const response = await ky
      .get("https://world.openfoodfacts.org/cgi/search.pl", {
        searchParams: {
          search_terms: query,
          search_simple: "1",
          action: "process",
          json: "1",
          page_size: "20",
          fields: "product_name,brands,nutriments,code,image_small_url",
        },
        timeout: 10000, // 10 secondes
      })
      .json<any>();

    console.log("Open Food Facts response:", {
      count: response.count,
      page_size: response.page_size,
      productsCount: response.products?.length || 0,
    });

    // Normaliser les données pour notre application
    const products = (response.products || []).map((product: any) => ({
      code: product.code || "",
      name: product.product_name || "Produit sans nom",
      brands: product.brands || "",
      quantity: product.quantity || null,
      caloriesPer100g: product.nutriments?.["energy-kcal_100g"] || 0,
      proteinsPer100g: product.nutriments?.proteins_100g || 0,
      carbsPer100g: product.nutriments?.carbohydrates_100g || 0,
      fatPer100g: product.nutriments?.fat_100g || 0,
      fibersPer100g: product.nutriments?.fiber_100g || null,
      imageUrl: product.image_small_url || null,
      source: "OpenFoodFacts" as const,
    }));

    console.log("Normalized products count:", products.length);

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Open Food Facts API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products from Open Food Facts" },
      { status: 500 }
    );
  }
}
