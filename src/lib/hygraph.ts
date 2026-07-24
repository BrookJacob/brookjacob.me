/**
 * Hygraph CMS GraphQL Client & Data Fetching Utility
 * 
 * Fetches live data from Hygraph Content API (models: `Print`, `Article`, `Asset`).
 * Automatically normalizes slugs, maps Hygraph fields to UI component models,
 * and provides fallbacks if endpoint credentials are missing or offline.
 */

import { GraphQLClient } from 'graphql-request';
import type { Artwork, BlogPost, Project, Print, Article } from './types';

/**
 * Reads Hygraph endpoint from environment configuration.
 */
const endpoint = process.env.HYGRAPH_ENDPOINT || 'https://us-west-2.cdn.hygraph.com/content/cmleb20kj014707w90z5k39wb/master';
const client = new GraphQLClient(endpoint);

/**
 * Fallback static projects if Hygraph contains no software entries.
 */
const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    slug: 'able-roadmap',
    title: 'ABLE — Daily Momentum Coach & Life Roadmap Workspace',
    description: 'All-in-one daily momentum workspace helping users manage schedules, organize tasks, build healthy habits, track finances, and leverage AI workspace coaching.',
    longDescription: 'Engineered as a full-stack SaaS platform featuring gamified habit tracking, digital passport badges, interactive courses, AI coaching assistant, and integrated budgeting/banking tools.',
    techStack: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'AI Chat', 'SaaS Architecture'],
    liveUrl: 'https://ableroadmap.com',
    featured: true,
  },
  {
    id: 'proj-2',
    slug: 'satori-trailheads',
    title: 'Satori Trailheads — Mentored Experiential Adventure Platform',
    description: 'Web platform powering mentored outdoor leadership experiences, custom trailheads, and developmental pathways for youth and young adults.',
    longDescription: 'Interactive web platform providing program discovery, custom pathway planning, video hero media integration, and inquiry management for wilderness leadership programs.',
    techStack: ['React', 'TypeScript', 'Netlify', 'Tailwind CSS', 'Video Media API'],
    liveUrl: 'https://satoritrailheads.com',
    featured: true,
  },
  {
    id: 'proj-3',
    slug: 'hygraph-astro-monorepo',
    title: 'Multi-Domain Astro Portfolio & CMS Monorepo Core',
    description: 'High-performance SSG portfolio monorepo bridging printmaking artwork with technical dev logs.',
    longDescription: 'Engineered with Astro SSG, Radix UI dialog primitives, Tailwind CSS design system tokens, and automated deployment via GitHub Actions repository dispatches to Firebase Hosting.',
    techStack: ['Astro', 'TypeScript', 'React', 'Tailwind CSS', 'Radix UI', 'Firebase'],
    githubUrl: 'https://github.com/brookjacob/brookjacob.me',
    liveUrl: 'https://brookjacob.studio',
    featured: true,
  },
];

/**
 * Sanitizes Hygraph slugs by stripping leading domain prefixes (e.g. 'prints/woman' -> 'woman').
 * 
 * @param {string} rawSlug - Raw slug stored in CMS.
 * @returns {string} Normalized clean URL slug.
 */
function normalizeSlug(rawSlug: string): string {
  return rawSlug.replace(/^prints\//, '').replace(/^\/+/, '');
}

/**
 * Maps raw Hygraph `Print` model into UI-compatible `Artwork` structure.
 * 
 * @param {Print} print - Raw Hygraph Print entity.
 * @returns {Artwork} Transformed artwork object with normalized slug and placard metadata.
 */
function mapPrintToArtwork(print: Print): Artwork {
  const cleanSlug = normalizeSlug(print.slug);
  const coverImage = {
    id: print.mainImage?.url || print.id,
    url: print.mainImage?.url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
    width: print.mainImage?.width || 1200,
    height: print.mainImage?.height || 1600,
    altText: print.title,
    blurhash: print.mainImage?.blurhash || undefined,
  };

  const galleryImages = (print.galleryImages || [])
    .filter((img) => img && typeof img.url === 'string' && img.url.length > 0)
    .map((img) => ({
      id: img.url,
      url: img.url,
      width: img.width || 1200,
      height: img.height || 1600,
      altText: print.title,
      blurhash: img.blurhash || undefined,
    }));

  const processImages = (print.processImages || [])
    .filter((img) => img && typeof img.url === 'string' && img.url.length > 0)
    .map((img) => ({
      id: img.url,
      url: img.url,
      width: img.width || 1200,
      height: img.height || 1600,
      altText: print.title,
      blurhash: img.blurhash || undefined,
    }));

  return {
    ...print,
    slug: cleanSlug,
    coverImage,
    galleryImages,
    processImages,
    technique: 'Reduction Linocut Print',
    paperStock: print.paperDimensions ? `Custom Rag (${print.paperDimensions})` : 'Fine Art Cotton Rag Paper',
    editionSize: `${print.editionTotal}`,
    blockDimensions: print.imageDimensions || 'Hand-carved Linoleum Block',
    processNotes: print.description || '',
  };
}

/**
 * Fetches all Print entities from Hygraph CMS.
 * Filters for displayed prints if `display` attribute is present.
 * 
 * @returns {Promise<Artwork[]>} Array of artwork items.
 */
export async function getAllArtworks(): Promise<Artwork[]> {
  try {
    const query = `
      query GetPrints {
        prints(orderBy: year_DESC) {
          id
          title
          slug
          year
          editionTotal
          description
          price
          paperDimensions
          imageDimensions
          display
          printStatus
          mainImage {
            url
            width
            height
            blurhash
          }
          galleryImages {
            url
            width
            height
            blurhash
          }
          processImages {
            url
            width
            height
            blurhash
          }
        }
      }
    `;
    const data = await client.request<{ prints: Print[] }>(query);
    if (data && data.prints && data.prints.length > 0) {
      // Filter displayed prints or show all if display flag is null/true
      return data.prints
        .filter((p) => p.display !== false)
        .map(mapPrintToArtwork);
    }
  } catch (error) {
    console.warn('Hygraph CMS query for prints encountered an error:', error);
  }
  return [];
}

/**
 * Fetches a single artwork by normalized slug from Hygraph CMS.
 * 
 * @param {string} slug - Clean URL slug.
 * @returns {Promise<Artwork | null>} Artwork entity or null.
 */
export async function getArtworkBySlug(slug: string): Promise<Artwork | null> {
  const artworks = await getAllArtworks();
  return artworks.find((art) => art.slug === slug || normalizeSlug(art.slug) === slug) || null;
}

/**
 * Fetches all Article entities from Hygraph CMS.
 * 
 * @returns {Promise<BlogPost[]>} Array of blog posts.
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const query = `
      query GetArticles {
        articles(orderBy: publishedAt_DESC) {
          id
          title
          slug
          excerpt
          content {
            html
            markdown
            text
          }
          repoUrl
          techStack
          publishedAt
          coverImage {
            url
          }
        }
      }
    `;
    const data = await client.request<{ articles: Article[] }>(query);
    if (data && data.articles && data.articles.length > 0) {
      return data.articles.map((art) => ({
        id: art.id,
        slug: normalizeSlug(art.slug),
        title: art.title,
        publishedAt: art.publishedAt ? new Date(art.publishedAt).toISOString().split('T')[0] : '2026-03-15',
        excerpt: art.excerpt || 'Technical write-up and studio notes.',
        content: art.content?.markdown || art.content?.html || art.content?.text || '',
        category: art.repoUrl ? 'software' : 'essay',
        readTimeMinutes: 5,
        repoUrl: art.repoUrl,
        techStack: art.techStack,
        author: {
          name: 'Jacob Brook',
          title: 'Printmaker & Full-Stack Web Developer',
          bio: 'Crafting multi-layer relief prints and building web applications.',
          avatarUrl: '/avatar.jpg',
        },
        coverImage: art.coverImage ? { url: art.coverImage.url } : undefined,
      }));
    }
  } catch (error) {
    console.warn('Hygraph CMS query for articles encountered an error:', error);
  }

  // Return empty array if no articles are published in CMS yet
  return [];
}

/**
 * Fetches a single blog post by slug.
 * 
 * @param {string} slug - Clean URL slug.
 * @returns {Promise<BlogPost | null>} Blog post entity or null.
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllBlogPosts();
  return posts.find((post) => post.slug === slug) || null;
}

/**
 * Fetches all software engineering projects derived from Hygraph Articles (with repoUrl)
 * or fallback projects.
 * 
 * @returns {Promise<Project[]>} Array of software projects.
 */
export async function getAllProjects(): Promise<Project[]> {
  const posts = await getAllBlogPosts();
  const repoArticles = posts.filter((p) => p.repoUrl);

  if (repoArticles.length > 0) {
    return repoArticles.map((art) => ({
      id: art.id,
      slug: art.slug,
      title: art.title,
      description: art.excerpt,
      longDescription: art.content,
      techStack: art.techStack || ['TypeScript', 'Astro', 'React'],
      githubUrl: art.repoUrl || undefined,
      liveUrl: 'https://developer.brookjacob.studio',
      featured: true,
    }));
  }

  return MOCK_PROJECTS;
}

/**
 * Fetches a single project by slug.
 * 
 * @param {string} slug - Project slug.
 * @returns {Promise<Project | null>} Project object or null.
 */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await getAllProjects();
  return projects.find((p) => p.slug === slug) || null;
}
