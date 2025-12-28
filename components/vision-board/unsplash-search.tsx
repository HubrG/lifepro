"use client";

import { useState, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UnsplashPhoto, UnsplashSearchResult } from "@/lib/types/vision-board";

interface UnsplashSearchProps {
  onSelect: (photo: UnsplashPhoto) => void;
}

export function UnsplashSearch({ onSelect }: UnsplashSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnsplashPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/unsplash/search?query=${encodeURIComponent(query)}&per_page=20`
      );
      const data: UnsplashSearchResult = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Error searching Unsplash:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Rechercher des images..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {results.map((photo) => (
              <button
                key={photo.id}
                onClick={() => onSelect(photo)}
                className="relative aspect-video overflow-hidden rounded-md border hover:ring-2 hover:ring-primary transition-all"
              >
                <img
                  src={photo.urls.small}
                  alt={photo.alt_description || "Image Unsplash"}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-[10px] text-white truncate">
                    {photo.user.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : hasSearched ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>Aucun résultat pour "{query}"</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Search className="h-8 w-8 mb-2" />
            <p>Recherchez des images inspirantes</p>
          </div>
        )}
      </ScrollArea>

      <p className="text-xs text-muted-foreground text-center">
        Images fournies par Unsplash
      </p>
    </div>
  );
}
