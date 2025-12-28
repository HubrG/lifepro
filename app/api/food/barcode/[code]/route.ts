import { NextRequest, NextResponse } from "next/server";
import ky from "ky";

/**
 * API Route pour rechercher un produit par code-barre via Open Food Facts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code || !/^\d{8,13}$/.test(code)) {
    return NextResponse.json(
      { error: "Code-barre invalide (doit contenir 8-13 chiffres)" },
      { status: 400 }
    );
  }

  try {
    const response = await ky
      .get(`https://world.openfoodfacts.org/api/v2/product/${code}`, {
        timeout: 10000,
      })
      .json<any>();

    console.log("Open Food Facts barcode response:", {
      code,
      status: response.status,
      found: response.status === 1,
    });

    if (response.status !== 1 || !response.product) {
      return NextResponse.json(
        { error: "Produit non trouvé pour ce code-barre" },
        { status: 404 }
      );
    }

    const product = response.product;

    // Normaliser les données
    const normalizedProduct = {
      code: product.code || code,
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
    };

    return NextResponse.json({ product: normalizedProduct });
  } catch (error) {
    console.error("Open Food Facts barcode API error:", error);
    return NextResponse.json(
      { error: "Échec de la recherche par code-barre" },
      { status: 500 }
    );
  }
}
