import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { executeWithFallback } from "@/lib/ai-provider";

// Schéma pour les informations nutritionnelles extraites
const nutritionalInfoSchema = z.object({
  productName: z.string().describe("Le nom standardisé du produit alimentaire"),
  brandName: z.string().nullable().describe("La marque si mentionnée, sinon null"),
  calories: z.number().describe("Calories pour 100g/100ml en kcal"),
  proteins: z.number().describe("Protéines pour 100g/100ml en grammes"),
  carbs: z.number().describe("Glucides pour 100g/100ml en grammes"),
  fats: z.number().describe("Lipides pour 100g/100ml en grammes"),
  fibers: z.number().nullable().describe("Fibres pour 100g/100ml en grammes, null si inconnues"),
  confidence: z.enum(["high", "medium", "low"]).describe("Niveau de confiance dans les données"),
  source: z.string().describe("Source des informations (base de données nutritionnelles, estimations générales, etc.)"),
});

/**
 * API Route pour rechercher des informations nutritionnelles via AI (Groq)
 * Utilise structured outputs pour extraire des données nutritionnelles fiables
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
    }

    // Utiliser le système de fallback AI avec GPT-OSS 20B (Groq) en priorité
    const { result: object, usedProvider } = await executeWithFallback(
      async (model) => {
        const { object } = await generateObject({
          model,
          schema: nutritionalInfoSchema,
          prompt: `Tu es un expert en nutrition. Analyse le terme de recherche suivant et fournis les informations nutritionnelles pour 100g/100ml du produit.

Terme de recherche : "${query}"

Instructions importantes :
1. Si la quantité est mentionnée (ex: "200g de riz"), normalise pour 100g/100ml
2. Si c'est un aliment cuit/préparé, base-toi sur la forme mentionnée (ex: "riz cuit" vs "riz cru")
3. Utilise des valeurs moyennes réalistes basées sur des bases de données nutritionnelles (USDA, CIQUAL, etc.)
4. Pour les produits de marque, utilise les valeurs moyennes de cette catégorie de produits
5. Indique "high" confidence pour les aliments standards bien documentés
6. Indique "medium" pour les estimations basées sur des aliments similaires
7. Indique "low" pour les estimations très approximatives

Exemples de bonnes réponses :
- "une pomme" → Pomme fraîche, ~52 kcal, protéines: 0.3g, glucides: 14g, lipides: 0.2g, fibres: 2.4g
- "100g de poulet grillé" → Poulet grillé sans peau, ~165 kcal, protéines: 31g, glucides: 0g, lipides: 3.6g
- "yaourt nature" → Yaourt nature entier, ~61 kcal, protéines: 3.5g, glucides: 4.7g, lipides: 3.3g

Fournis des valeurs réalistes et précises.`,
        });
        return object;
      },
      {
        preferredProvider: "groq-gpt-oss",
        groqTimeoutMs: 30000, // 30 secondes
      }
    );

    console.log(`✅ Informations nutritionnelles générées avec ${usedProvider}`);

    // Formater la réponse dans le même format que Open Food Facts
    const product = {
      code: `ai-${Date.now()}`, // ID unique pour les résultats AI
      name: object.productName,
      brands: object.brandName || "",
      caloriesPer100g: object.calories,
      proteinsPer100g: object.proteins,
      carbsPer100g: object.carbs,
      fatPer100g: object.fats,
      fibersPer100g: object.fibers,
      imageUrl: null,
      source: "AI" as const,
      confidence: object.confidence,
      aiSource: `${object.source} (via ${usedProvider})`,
    };

    return NextResponse.json({ product });
  } catch (error) {
    console.error("AI nutrition search error:", error);

    // Gérer les erreurs spécifiques
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "AI service configuration error" },
          { status: 500 }
        );
      }
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Trop de requêtes, veuillez réessayer dans quelques secondes" },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to extract nutritional information via AI" },
      { status: 500 }
    );
  }
}
