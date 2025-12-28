import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Client S3 configuré pour Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "extypis-storage";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

/**
 * Générer un nom de fichier unique
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop() || "jpg";
  return `vision-board/${timestamp}-${randomString}.${extension}`;
}

/**
 * Upload un fichier vers R2
 */
export async function uploadToR2(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const key = generateFileName(fileName);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Retourner l'URL publique
  return `${PUBLIC_URL}/${key}`;
}

/**
 * Supprimer un fichier de R2
 */
export async function deleteFromR2(fileUrl: string): Promise<void> {
  // Extraire la clé de l'URL
  const key = fileUrl.replace(`${PUBLIC_URL}/`, "");

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Valider le type de fichier
 */
export function isValidImageType(contentType: string): boolean {
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  return validTypes.includes(contentType);
}

/**
 * Taille maximale en bytes (5 MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
