/**
 * Hygraph CMS Domain Type Definitions
 * 
 * Defines TypeScript interfaces matching Hygraph CMS models (`Print`, `Article`, `Asset`).
 */

/**
 * Image Asset interface from Hygraph Asset model.
 */
export interface CMSImage {
  id?: string;
  url: string;
  width?: number;
  height?: number;
  altText?: string;
  blurhash?: string;
}

/**
 * Print Model matching Hygraph 'Print' schema.
 */
export interface Print {
  id: string;
  slug: string;
  title: string;
  year: number;
  editionTotal: number;
  description?: string | null;
  price?: number | null;
  paperDimensions?: string | null;
  imageDimensions?: string | null;
  display?: boolean;
  printStatus?: string;
  mainImage: CMSImage;
}

/**
 * Legacy/UI compatibility alias for Print artwork entities.
 */
export interface Artwork extends Print {
  technique?: string;
  paperStock?: string;
  editionSize?: string;
  blockDimensions?: string;
  processNotes?: string;
  coverImage: CMSImage;
}

/**
 * Article Model matching Hygraph 'Article' schema.
 */
export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: {
    html?: string;
    markdown?: string;
    text?: string;
  };
  repoUrl?: string | null;
  techStack?: string[] | null;
  publishedAt?: string;
  coverImage?: CMSImage | null;
}

/**
 * Legacy/UI compatibility alias for Article post entities.
 */
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  publishedAt: string;
  excerpt: string;
  content: string;
  category: 'printmaking' | 'software' | 'essay';
  readTimeMinutes: number;
  repoUrl?: string | null;
  techStack?: string[] | null;
  author: Author;
  coverImage?: CMSImage;
}

/**
 * Software Engineering Project domain model.
 */
export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  techStack: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured?: boolean;
  coverImage?: CMSImage;
}

/**
 * Author profile metadata.
 */
export interface Author {
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
}

/**
 * Museum Placard metadata payload format for artwork detail views.
 */
export interface MuseumPlacardData {
  title: string;
  year: number;
  technique: string;
  paperStock: string;
  editionSize: string;
  blockDimensions: string;
  processNotes: string;
}
