/**
 * Hygraph CMS GraphQL Client Utility
 * 
 * Interacts with the Hygraph GraphQL Content API during static build time.
 * Falls back cleanly to structured mock data when no HYGRAPH_ENDPOINT environment
 * variable is set, guaranteeing offline stability and smooth developer workflow.
 */

import { GraphQLClient } from 'graphql-request';
import type { Artwork, BlogPost, Project } from './types';

/**
 * Initializes GraphQL Client if endpoint is present.
 */
const endpoint = process.env.HYGRAPH_ENDPOINT || '';
const client = endpoint ? new GraphQLClient(endpoint) : null;

/**
 * Fallback static printmaking artwork collection.
 */
const MOCK_ARTWORKS: Artwork[] = [
  {
    id: 'art-1',
    slug: 'solitude-in-birch',
    title: 'Solitude in Birch',
    year: 2025,
    technique: 'Two-Color Reduction Linocut',
    paperStock: 'Rives BFK 280gsm (Natural White)',
    editionSize: '12 / 15',
    blockDimensions: '9" x 12" (22.8cm x 30.5cm)',
    processNotes: 'Carved across two reduction stages using Cranfield Caligo Safe Wash Oil-Based Inks. The first pass captures the muted twilight gray sky, while the second layer lays down rich charcoal ink for the silhouette of northern birches.',
    coverImage: {
      id: 'img-1',
      url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
      altText: 'Solitude in Birch two-color reduction linocut print',
      width: 1200,
      height: 1600,
    },
    featured: true,
  },
  {
    id: 'art-2',
    slug: 'tectonic-strata',
    title: 'Tectonic Strata No. 4',
    year: 2024,
    technique: 'Woodcut & Monotype Overlay',
    paperStock: 'Awagami Mulberry 70gsm',
    editionSize: '8 / 10',
    blockDimensions: '12" x 18" (30.5cm x 45.7cm)',
    processNotes: 'Printed from hand-gouge carved Baltic Birch plywood onto thin Mulberry paper. Features raw wood grain texture blended with burnt umber and terra-cotta monotype ink wiping.',
    coverImage: {
      id: 'img-2',
      url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&auto=format&fit=crop',
      altText: 'Tectonic Strata woodcut artwork print',
      width: 1200,
      height: 1600,
    },
    featured: true,
  },
  {
    id: 'art-3',
    slug: 'harbor-fog',
    title: 'Harbor Fog at Dawn',
    year: 2025,
    technique: 'Multi-Block Woodblock Print',
    paperStock: 'Hahnemühle Copperplate 300gsm',
    editionSize: '15 / 20',
    blockDimensions: '11" x 14" (27.9cm x 35.5cm)',
    processNotes: 'Three separate carved basswood keyblocks layered to produce atmospheric depth. Transparent extender added to slate blue ink to simulate dense coastal fog.',
    coverImage: {
      id: 'img-3',
      url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1200&auto=format&fit=crop',
      altText: 'Harbor Fog multi-block woodblock print',
      width: 1200,
      height: 1600,
    },
    featured: false,
  },
];

/**
 * Fallback static blog articles.
 */
const MOCK_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'bridging-linocut-and-type-systems',
    title: 'Bridging Relief Printmaking and Type-Safe System Architecture',
    publishedAt: '2026-03-15',
    excerpt: 'How the discipline of carving relief blocks mirrors building deterministic, immutable system architectures in TypeScript.',
    content: `
Relief printmaking requires forward commitment: once gouged away, wood or linoleum block material cannot be restored. Every cut is a structural decision.

In modern software development, adopting strict immutability and type safety demands a similar philosophical rigor. When building distributed web architectures, we design schemas and domain boundaries that prevent accidental mutations downstream.

### Key Parallels:
1. **The Block as Immutable Schema**: The carved block acts as a static contract.
2. **Ink Registration as State Synchronization**: Aligning multiple color passes cleanly resembles exact state rehydration across client-server boundaries.
3. **The Proofing Loop**: Test suites act as our proof prints, surfacing boundary errors early before deployment.
    `,
    category: 'essay',
    readTimeMinutes: 5,
    author: {
      name: 'Brook Jacob',
      title: 'Printmaker & Principal Systems Engineer',
      bio: 'Exploring tactile print techniques and web platform architecture.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    },
  },
  {
    id: 'post-2',
    slug: 'building-zero-runtime-design-systems',
    title: 'Building Zero-Runtime Design Systems with Tailwind CSS and Radix UI',
    publishedAt: '2026-02-10',
    excerpt: 'An in-depth look at crafting resilient, accessible design tokens without client-side CSS-in-JS performance bottlenecks.',
    content: `
Performance budget discipline begins with zero-runtime CSS strategies. By leveraging CSS custom properties paired with Tailwind design tokens and headless Radix primitives, we achieve uncompromised accessibility and instant render times.

\`\`\`tsx
// Example of unstyled Radix Dialog trigger with custom focus styles
<Dialog.Trigger className="focus-tactile px-4 py-2 border rounded-md">
  Inspect Artwork Details
</Dialog.Trigger>
\`\`\`
    `,
    category: 'software',
    readTimeMinutes: 7,
    author: {
      name: 'Brook Jacob',
      title: 'Printmaker & Principal Systems Engineer',
      bio: 'Exploring tactile print techniques and web platform architecture.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    },
  },
];

/**
 * Fallback static software projects.
 */
const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    slug: 'hygraph-astro-monorepo',
    title: 'Multi-Domain Astro Portfolio & CMS Core',
    description: 'High-performance SSG portfolio monorepo bridging printmaking artwork with technical dev logs.',
    longDescription: 'Engineered with Astro SSG, Radix UI dialog primitives, Tailwind CSS design system tokens, and automated deployment via GitHub Actions repository dispatches to Firebase Hosting.',
    techStack: ['Astro', 'TypeScript', 'React', 'Tailwind CSS', 'Radix UI', 'Firebase'],
    githubUrl: 'https://github.com/brookjacob/brookjacob.me',
    liveUrl: 'https://brookjacob.me',
    featured: true,
    coverImage: {
      id: 'img-p1',
      url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop',
      altText: 'Monorepo code preview',
    },
  },
  {
    id: 'proj-2',
    slug: 'chroma-print-tool',
    title: 'ChromaProof: Ink Mixing & Registration Helper',
    description: 'Web utility for calculating ink opacity, extender ratios, and registration offsets for linocut artists.',
    longDescription: 'Built with React and Canvas API to visually simulate CMYK layer blend modes prior to gouging keyblocks.',
    techStack: ['React', 'TypeScript', 'Canvas API', 'Tailwind CSS'],
    githubUrl: 'https://github.com/brookjacob/chromaproof',
    liveUrl: 'https://code.brookjacob.me',
    featured: true,
    coverImage: {
      id: 'img-p2',
      url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200&auto=format&fit=crop',
      altText: 'ChromaProof interface mockup',
    },
  },
];

/**
 * Fetches all printmaking artworks from Hygraph CMS or fallback static store.
 * 
 * @returns {Promise<Artwork[]>} Array of artwork entities.
 */
export async function getAllArtworks(): Promise<Artwork[]> {
  // Use CMS client when endpoint credentials are provided
  if (client) {
    try {
      const query = `
        query GetArtworks {
          artworks(orderBy: year_DESC) {
            id
            slug
            title
            year
            technique
            paperStock
            editionSize
            blockDimensions
            processNotes
            featured
            coverImage {
              id
              url
              width
              height
            }
          }
        }
      `;
      const data = await client.request<{ artworks: Artwork[] }>(query);
      return data.artworks;
    } catch (error) {
      console.warn('Hygraph CMS query error, falling back to mock artworks:', error);
    }
  }
  return MOCK_ARTWORKS;
}

/**
 * Fetches a single artwork by slug from Hygraph CMS or fallback static store.
 * 
 * @param {string} slug - Unique URL slug of artwork.
 * @returns {Promise<Artwork | null>} Artwork entity or null if not found.
 */
export async function getArtworkBySlug(slug: string): Promise<Artwork | null> {
  const artworks = await getAllArtworks();
  return artworks.find((art) => art.slug === slug) || null;
}

/**
 * Fetches all blog posts from Hygraph CMS or fallback static store.
 * 
 * @returns {Promise<BlogPost[]>} Array of blog post entities.
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  if (client) {
    try {
      const query = `
        query GetPosts {
          posts(orderBy: publishedAt_DESC) {
            id
            slug
            title
            publishedAt
            excerpt
            content
            category
            readTimeMinutes
            author {
              name
              title
              bio
              avatarUrl
            }
          }
        }
      `;
      const data = await client.request<{ posts: BlogPost[] }>(query);
      return data.posts;
    } catch (error) {
      console.warn('Hygraph CMS query error, falling back to mock blog posts:', error);
    }
  }
  return MOCK_POSTS;
}

/**
 * Fetches a single blog post by slug.
 * 
 * @param {string} slug - Unique URL slug of article.
 * @returns {Promise<BlogPost | null>} Blog post entity or null.
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllBlogPosts();
  return posts.find((post) => post.slug === slug) || null;
}

/**
 * Fetches all software development projects from Hygraph CMS or fallback static store.
 * 
 * @returns {Promise<Project[]>} Array of project entities.
 */
export async function getAllProjects(): Promise<Project[]> {
  if (client) {
    try {
      const query = `
        query GetProjects {
          projects {
            id
            slug
            title
            description
            longDescription
            techStack
            githubUrl
            liveUrl
            featured
            coverImage {
              id
              url
            }
          }
        }
      `;
      const data = await client.request<{ projects: Project[] }>(query);
      return data.projects;
    } catch (error) {
      console.warn('Hygraph CMS query error, falling back to mock projects:', error);
    }
  }
  return MOCK_PROJECTS;
}

/**
 * Fetches a single software project by slug.
 * 
 * @param {string} slug - Unique URL slug of project.
 * @returns {Promise<Project | null>} Project entity or null.
 */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await getAllProjects();
  return projects.find((p) => p.slug === slug) || null;
}
