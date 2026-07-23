/**
 * Monorepo Type Definitions
 * 
 * Provides TypeScript interfaces for artworks, blog posts, software projects,
 * museum metadata placards, and GraphQL CMS responses.
 */

/**
 * Image asset entity structured from Hygraph CMS or fallback assets.
 */
export interface CMSImage {
  id: string;
  url: string;
  width?: number;
  height?: number;
  altText?: string;
}

/**
 * Printmaking Artwork domain model.
 */
export interface Artwork {
  id: string;
  slug: string;
  title: string;
  year: number;
  technique: string;
  paperStock: string;
  editionSize: string;
  blockDimensions: string;
  processNotes: string;
  coverImage: CMSImage;
  featured?: boolean;
}

/**
 * Blog Article Post domain model.
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
 * Author profile metadata interface.
 */
export interface Author {
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
}

/**
 * Museum Placard metadata payload format for printmaking detail views.
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
