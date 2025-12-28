import type { UnsplashPhoto, UnsplashSearchResult } from "@/lib/types/vision-board";

const UNSPLASH_BASE_URL = "https://api.unsplash.com";

/**
 * Rechercher des photos sur Unsplash
 */
export async function searchUnsplashPhotos(
  query: string,
  page: number = 1,
  perPage: number = 20
): Promise<UnsplashSearchResult> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    throw new Error("UNSPLASH_ACCESS_KEY non configurée");
  }

  const url = new URL(`${UNSPLASH_BASE_URL}/search/photos`);
  url.searchParams.set("query", query);
  url.searchParams.set("page", page.toString());
  url.searchParams.set("per_page", perPage.toString());
  url.searchParams.set("orientation", "landscape");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Récupérer des photos aléatoires
 */
export async function getRandomUnsplashPhotos(
  count: number = 10,
  query?: string
): Promise<UnsplashPhoto[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    throw new Error("UNSPLASH_ACCESS_KEY non configurée");
  }

  const url = new URL(`${UNSPLASH_BASE_URL}/photos/random`);
  url.searchParams.set("count", count.toString());
  url.searchParams.set("orientation", "landscape");
  if (query) {
    url.searchParams.set("query", query);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Tracker un téléchargement (requis par les guidelines Unsplash)
 */
export async function trackUnsplashDownload(downloadLocation: string): Promise<void> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    return;
  }

  try {
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });
  } catch (error) {
    // Ne pas bloquer si le tracking échoue
    console.error("Error tracking Unsplash download:", error);
  }
}

/**
 * Formater le crédit pour l'attribution Unsplash
 */
export function formatUnsplashCredit(photo: UnsplashPhoto): string {
  return `Photo by ${photo.user.name} on Unsplash`;
}

/**
 * Obtenir l'URL optimale pour l'affichage
 */
export function getOptimalImageUrl(
  photo: UnsplashPhoto,
  size: "small" | "regular" | "full" = "regular"
): string {
  return photo.urls[size];
}
