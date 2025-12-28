"use client";

import { useState, useRef } from "react";
import { Upload, Link2, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UnsplashSearch } from "./unsplash-search";
import type { UnsplashPhoto } from "@/lib/types/vision-board";

interface ImagePickerProps {
  onSelect: (imageUrl: string, credit?: string) => void;
}

export function ImagePicker({ onSelect }: ImagePickerProps) {
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUnsplashSelect = (photo: UnsplashPhoto) => {
    const credit = `Photo by ${photo.user.name} on Unsplash`;
    onSelect(photo.urls.regular, credit);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onSelect(urlInput.trim());
      setUrlInput("");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.url) {
        onSelect(data.url);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Tabs defaultValue="unsplash" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="unsplash">Unsplash</TabsTrigger>
        <TabsTrigger value="url">URL</TabsTrigger>
        <TabsTrigger value="upload">Upload</TabsTrigger>
      </TabsList>

      <TabsContent value="unsplash" className="mt-4">
        <UnsplashSearch onSelect={handleUnsplashSelect} />
      </TabsContent>

      <TabsContent value="url" className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label>URL de l'image</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://exemple.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            />
            <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
              <Link2 className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Collez l'URL d'une image depuis n'importe quel site
          </p>
        </div>

        {urlInput && (
          <div className="relative aspect-video overflow-hidden rounded-md border">
            <img
              src={urlInput}
              alt="Aperçu"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext fill='%239ca3af' x='50%' y='50%' text-anchor='middle' dy='.3em'%3EImage invalide%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
        )}
      </TabsContent>

      <TabsContent value="upload" className="mt-4">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <Label
            htmlFor="file-upload"
            className="cursor-pointer text-center"
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Upload en cours...
              </div>
            ) : (
              <>
                <span className="font-semibold text-primary">
                  Cliquez pour uploader
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  JPG, PNG, GIF ou WebP (max 5 MB)
                </p>
              </>
            )}
          </Label>
        </div>
      </TabsContent>
    </Tabs>
  );
}
