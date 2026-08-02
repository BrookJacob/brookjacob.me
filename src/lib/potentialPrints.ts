/**
 * @file src/lib/potentialPrints.ts
 * @description Hygraph CMS Query Handler & Grouping Logic for Potential Prints (Demand-Gauge System).
 * 
 * Supports multi-image concepts (unquantized photo + quantized reduction linocut preview + gallery assets),
 * variant grouping helpers, and Firestore real-time vote count merging.
 */

import { GraphQLClient, gql } from 'graphql-request';
import { getEnvVar } from './env';
import { getOptimizedCdnUrl } from './hygraph';

/**
 * Hygraph Content API endpoint read from environment configuration.
 */
const HYGRAPH_ENDPOINT = import.meta.env.PUBLIC_HYGRAPH_ENDPOINT || import.meta.env.HYGRAPH_ENDPOINT || 'https://us-west-2.cdn.hygraph.com/content/cmleb20kj014707w90z5k39wb/master';
const client = new GraphQLClient(HYGRAPH_ENDPOINT);

/**
 * Asset details from Hygraph image field.
 */
export interface HygraphImageAsset {
  url: string;
  width?: number;
  height?: number;
  blurhash?: string;
}

/**
 * PotentialPrint entity representing an upcoming artwork design under demand-gauge voting.
 * Supports both quantized and unquantized image assets for side-by-side or tabbed comparison.
 */
export interface PotentialPrint {
  id: string;
  title: string;
  image: HygraphImageAsset;
  quantizedImage?: HygraphImageAsset | null;
  galleryImages?: HygraphImageAsset[];
  isActive: boolean;
  votingGroup?: string | null;
  voteCount?: number;
}

/**
 * Grouped representation of potential prints under a unified voting slug.
 */
export interface VotingGroup {
  slug: string;
  prints: PotentialPrint[];
  totalVotes: number;
}

/**
 * GraphQL Query to fetch active PotentialPrint entries from Hygraph, including quantized assets.
 */
const GET_POTENTIAL_PRINTS = gql`
  query GetPotentialPrints {
    potentialPrints(where: { isActive: true }) {
      id
      title
      isActive
      votingGroup
      image {
        url
        width
        height
        blurhash
      }
      quantizedImage {
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
    }
  }
`;

/**
 * Fallback GraphQL Query to fetch Print entries if PotentialPrint content type is not yet published in Hygraph schema.
 */
const GET_FALLBACK_PRINTS = gql`
  query GetFallbackPrints {
    prints(where: { display: true }) {
      id
      title
      display
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
    }
  }
`;

/**
 * Fetches all active `PotentialPrint` entries from Hygraph CMS.
 * 
 * @async
 * @returns {Promise<PotentialPrint[]>} Array of active potential prints.
 */
export async function fetchPotentialPrints(): Promise<PotentialPrint[]> {
  try {
    const data = await client.request<{ potentialPrints: PotentialPrint[] }>(GET_POTENTIAL_PRINTS);
    if (data && Array.isArray(data.potentialPrints)) {
      return data.potentialPrints
        .filter((print) => print.isActive !== false)
        .map((p) => ({
          ...p,
          image: p.image ? {
            ...p.image,
            url: getOptimizedCdnUrl(p.image.url, 800, 80),
          } : p.image,
          quantizedImage: p.quantizedImage ? {
            ...p.quantizedImage,
            url: getOptimizedCdnUrl(p.quantizedImage.url, 800, 80),
          } : p.quantizedImage,
          galleryImages: (p.galleryImages || []).map((img) => ({
            ...img,
            url: getOptimizedCdnUrl(img.url, 800, 80),
          })),
        }));
    }
  } catch (error) {
    console.warn('[potentialPrints] Primary query for `potentialPrints` encountered error, using fallback:', error);
    try {
      const fallbackData = await client.request<{ prints: any[] }>(GET_FALLBACK_PRINTS);
      if (fallbackData && Array.isArray(fallbackData.prints)) {
        return fallbackData.prints.map((p) => ({
          id: p.id,
          title: p.title,
          image: {
            url: getOptimizedCdnUrl(p.mainImage?.url || '', 800, 80),
            width: p.mainImage?.width || 800,
            height: p.mainImage?.height || 1000,
            blurhash: p.mainImage?.blurhash,
          },
          quantizedImage: p.galleryImages?.[0] ? {
            url: getOptimizedCdnUrl(p.galleryImages[0].url, 800, 80),
            width: p.galleryImages[0].width || 800,
            height: p.galleryImages[0].height || 1000,
            blurhash: p.galleryImages[0].blurhash,
          } : null,
          galleryImages: (p.galleryImages || []).map((img: any) => ({
            ...img,
            url: getOptimizedCdnUrl(img.url, 800, 80),
          })),
          isActive: p.display !== false,
          votingGroup: null,
          voteCount: 0,
        }));
      }
    } catch (fallbackError) {
      console.warn('[potentialPrints] Fallback query for `prints` also encountered error:', fallbackError);
    }
  }
  return [];
}

/**
 * Groups an array of `PotentialPrint` items by their `votingGroup` slug.
 * Prints without a `votingGroup` are kept as standalone entries in the array.
 * 
 * @param {PotentialPrint[]} prints - Array of potential prints.
 * @returns {VotingGroup[]} Array of grouped voting options.
 */
export function groupPotentialPrintsByVotingGroup(prints: PotentialPrint[]): VotingGroup[] {
  const groupsMap = new Map<string, PotentialPrint[]>();

  for (const print of prints) {
    const groupKey = print.votingGroup ? print.votingGroup.trim() : print.id;
    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, []);
    }
    groupsMap.get(groupKey)!.push(print);
  }

  const result: VotingGroup[] = [];
  for (const [slug, groupPrints] of groupsMap.entries()) {
    const totalVotes = groupPrints.reduce((sum, p) => sum + (p.voteCount || 0), 0);
    result.push({
      slug,
      prints: groupPrints,
      totalVotes,
    });
  }

  return result;
}

/**
 * Merges raw Hygraph artwork entries with live Firestore aggregate vote counts.
 * 
 * @param {PotentialPrint[]} prints - Array of Hygraph artwork metadata.
 * @param {Record<string, number>} firestoreVoteCounts - Map of hygraphId -> voteCount from Firestore.
 * @returns {PotentialPrint[]} Updated potential prints with populated `voteCount`.
 */
export function mergePrintsWithVoteCounts(
  prints: PotentialPrint[],
  firestoreVoteCounts: Record<string, number>
): PotentialPrint[] {
  return prints.map((print) => ({
    ...print,
    voteCount: firestoreVoteCounts[print.id] ?? print.voteCount ?? 0,
  }));
}
