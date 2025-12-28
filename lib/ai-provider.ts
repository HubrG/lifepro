/**
 * AI Provider avec système de fallback intelligent pour LifePro
 *
 * Architecture :
 * 1. Groq + GPT-OSS 20B (primaire) - GRATUIT, ultra-rapide, structured outputs natif
 * 2. Gemini 2.5 Flash-Lite (secondaire) - GRATUIT, backup haute qualité
 * 3. OpenAI GPT-4o mini (tertiaire) - Payant, fallback de secours garanti
 *
 * Free Tier Limits :
 * - Groq GPT-OSS 20B : 30 req/min, 14,400 req/jour, structured outputs natif (json_schema)
 * - Gemini 2.5 Flash-Lite : 15 req/min, 1,000 req/jour, 250K tokens/min
 */
import "server-only";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

// Imports conditionnels pour éviter les erreurs si packages pas installés
let groq: typeof import("@ai-sdk/groq").groq | null = null;
let google: typeof import("@ai-sdk/google").google | null = null;

try {
  const groqModule = await import("@ai-sdk/groq");
  groq = groqModule.groq;
} catch (error) {
  console.warn(
    "⚠️ @ai-sdk/groq not installed. Install with: pnpm add @ai-sdk/groq"
  );
}

try {
  const googleModule = await import("@ai-sdk/google");
  google = googleModule.google;
} catch (error) {
  console.warn(
    "⚠️ @ai-sdk/google not installed. Install with: pnpm add @ai-sdk/google"
  );
}

export type AIProvider = "groq-gpt-oss" | "gemini-flash-lite" | "openai-gpt4o-mini";

interface ProviderConfig {
  name: AIProvider;
  model: LanguageModel;
  available: boolean;
  cost: "free" | "paid";
  quality: "excellent" | "good";
  speed: "ultra-fast" | "fast" | "standard";
}

/**
 * Récupère la configuration des providers disponibles
 * Ordre de priorité : Groq GPT-OSS > Gemini > OpenAI
 */
function getAvailableProviders(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];

  // 1. Groq + GPT-OSS 20B (PRIORITAIRE - supporte json_schema)
  if (groq && process.env.GROQ_API_KEY) {
    providers.push({
      name: "groq-gpt-oss",
      model: groq("openai/gpt-oss-20b"),
      available: true,
      cost: "free",
      quality: "excellent",
      speed: "ultra-fast",
    });
  }

  // 2. Gemini 2.5 Flash-Lite (BACKUP GRATUIT)
  if (google && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    providers.push({
      name: "gemini-flash-lite",
      model: google("gemini-2.5-flash-lite"),
      available: true,
      cost: "free",
      quality: "excellent",
      speed: "fast",
    });
  }

  // 3. OpenAI GPT-4o mini (FALLBACK GARANTI)
  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: "openai-gpt4o-mini",
      model: openai("gpt-4o-mini"),
      available: true,
      cost: "paid",
      quality: "good",
      speed: "standard",
    });
  }

  return providers;
}

/**
 * Sélectionne le meilleur provider disponible
 * Priorité : gratuit > qualité > vitesse
 */
export function getBestAIProvider(): {
  provider: AIProvider;
  model: LanguageModel;
} {
  const providers = getAvailableProviders();

  if (providers.length === 0) {
    throw new Error(
      "Aucun provider AI disponible. Vérifiez vos clés API (GROQ_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, ou OPENAI_API_KEY)"
    );
  }

  // Retourner le premier provider disponible (déjà trié par priorité)
  const selectedProvider = providers[0];

  console.log(
    `✅ AI Provider sélectionné : ${selectedProvider.name} (${selectedProvider.cost}, ${selectedProvider.quality}, ${selectedProvider.speed})`
  );

  return {
    provider: selectedProvider.name,
    model: selectedProvider.model,
  };
}

/**
 * Récupère un provider spécifique ou le meilleur disponible
 */
export function getAIProvider(preferredProvider?: AIProvider): {
  provider: AIProvider;
  model: LanguageModel;
} {
  if (preferredProvider) {
    const providers = getAvailableProviders();
    const provider = providers.find((p) => p.name === preferredProvider);

    if (provider) {
      return {
        provider: provider.name,
        model: provider.model,
      };
    }

    console.warn(
      `⚠️ Provider préféré '${preferredProvider}' non disponible. Fallback au meilleur provider.`
    );
  }

  return getBestAIProvider();
}

interface ExecuteOptions {
  /** Provider préféré à essayer en premier */
  preferredProvider?: AIProvider;
  /** Timeout en ms pour Groq (défaut: 30000ms = 30s). Mettre à 0 pour désactiver. */
  groqTimeoutMs?: number;
}

/**
 * Exécute une opération AI avec retry automatique sur les providers alternatifs
 * @param operation - L'opération à exécuter avec le modèle
 * @param options - Options de configuration (provider préféré, timeout)
 */
export async function executeWithFallback<T>(
  operation: (model: LanguageModel) => Promise<T>,
  options?: AIProvider | ExecuteOptions
): Promise<{ result: T; usedProvider: AIProvider }> {
  // Rétrocompatibilité : si options est une string, c'est le provider préféré
  const opts: ExecuteOptions =
    typeof options === "string" ? { preferredProvider: options } : options || {};

  const { preferredProvider, groqTimeoutMs = 30000 } = opts;

  const providers = getAvailableProviders();

  // Si un provider préféré est spécifié, le mettre en premier
  if (preferredProvider) {
    const preferredIndex = providers.findIndex((p) => p.name === preferredProvider);
    if (preferredIndex > 0) {
      const [preferred] = providers.splice(preferredIndex, 1);
      providers.unshift(preferred);
    }
  }

  let lastError: Error | null = null;

  // Tenter chaque provider dans l'ordre
  for (const provider of providers) {
    try {
      console.log(`🔄 Tentative avec ${provider.name}...`);

      // Timeout optionnel pour Groq (par défaut 30s, 0 = désactivé)
      if (provider.name === "groq-gpt-oss" && groqTimeoutMs > 0) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error(`Groq timeout (${groqTimeoutMs}ms)`)),
            groqTimeoutMs
          );
        });

        const result = await Promise.race([operation(provider.model), timeoutPromise]);

        console.log(`✅ Succès avec ${provider.name}`);
        return {
          result,
          usedProvider: provider.name,
        };
      }

      // Pas de timeout pour les autres providers
      const result = await operation(provider.model);
      console.log(`✅ Succès avec ${provider.name}`);
      return {
        result,
        usedProvider: provider.name,
      };
    } catch (error) {
      console.error(`❌ Échec avec ${provider.name}:`, error);
      lastError = error as Error;

      // Si ce n'est pas le dernier provider, continuer avec le suivant
      if (provider !== providers[providers.length - 1]) {
        console.log(`🔄 Fallback vers le provider suivant...`);
        continue;
      }
    }
  }

  // Tous les providers ont échoué
  throw new Error(
    `Tous les providers AI ont échoué. Dernière erreur : ${lastError?.message}`
  );
}
