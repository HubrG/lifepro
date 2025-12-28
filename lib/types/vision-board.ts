import type { VisionBoard, VisionBoardItem } from "@prisma/client";

// Vision Board avec ses items
export type VisionBoardWithItems = VisionBoard & {
  items: VisionBoardItem[];
  _count?: {
    items: number;
  };
};

// Résumé d'un board pour les listes
export interface VisionBoardSummary {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  isDefault: boolean;
  itemCount: number;
  updatedAt: Date;
}

// Types Unsplash API
export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  links: {
    download_location: string;
  };
}

export interface UnsplashSearchResult {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}
