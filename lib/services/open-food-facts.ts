import ky from "ky";

const BASE_URL = "https://world.openfoodfacts.org/api/v2";

export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands?: string;
  nutriments: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
  };
  image_url?: string;
  quantity?: string;
}

export interface OpenFoodFactsSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: OpenFoodFactsProduct[];
}

export interface NormalizedProduct {
  barcode: string;
  name: string;
  brand?: string;
  calories: number; // kcal pour 100g
  proteins?: number; // g pour 100g
  carbs?: number; // g pour 100g
  fats?: number; // g pour 100g
  fibers?: number; // g pour 100g
  imageUrl?: string;
  quantity?: string;
}

/**
 * Recherche des produits alimentaires sur Open Food Facts
 *
 * @param query - Terme de recherche
 * @param pageSize - Nombre de résultats par page
 * @returns Liste de produits
 */
export async function searchProducts(
  query: string,
  pageSize: number = 20
): Promise<NormalizedProduct[]> {
  try {
    const response = await ky
      .get(`${BASE_URL}/search`, {
        searchParams: {
          search_terms: query,
          page_size: pageSize,
          fields:
            "code,product_name,brands,nutriments,image_url,quantity",
        },
        timeout: 10000,
      })
      .json<OpenFoodFactsSearchResponse>();

    return response.products
      .filter((p) => p.nutriments?.["energy-kcal_100g"] !== undefined)
      .map(normalizeProduct);
  } catch (error) {
    console.error("Error searching Open Food Facts:", error);
    throw new Error("Erreur lors de la recherche de produits alimentaires");
  }
}

/**
 * Récupère les détails d'un produit par son code-barre
 *
 * @param barcode - Code-barre du produit
 * @returns Produit normalisé
 */
export async function getProductByBarcode(
  barcode: string
): Promise<NormalizedProduct | null> {
  try {
    const response = await ky
      .get(`${BASE_URL}/product/${barcode}`, {
        searchParams: {
          fields:
            "code,product_name,brands,nutriments,image_url,quantity",
        },
        timeout: 10000,
      })
      .json<{ product: OpenFoodFactsProduct }>();

    if (!response.product) {
      return null;
    }

    return normalizeProduct(response.product);
  } catch (error) {
    console.error("Error fetching product from Open Food Facts:", error);
    return null;
  }
}

/**
 * Normalise un produit Open Food Facts
 */
function normalizeProduct(product: OpenFoodFactsProduct): NormalizedProduct {
  return {
    barcode: product.code,
    name: product.product_name || "Produit inconnu",
    brand: product.brands,
    calories: product.nutriments["energy-kcal_100g"] || 0,
    proteins: product.nutriments.proteins_100g,
    carbs: product.nutriments.carbohydrates_100g,
    fats: product.nutriments.fat_100g,
    fibers: product.nutriments.fiber_100g,
    imageUrl: product.image_url,
    quantity: product.quantity,
  };
}
