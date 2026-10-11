/**
 * @file src/lib/potentialPrints.ts
 * @description Hygraph CMS Query Handler & Grouping Logic for Potential Prints (Community Voting System).
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
 * PotentialPrint entity representing an upcoming artwork design under community voting.
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
  inProduction?: boolean;
  productionNote?: string | null;
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
 * Result of partitioning prints into active voting vs in-production items.
 */
export interface PartitionedPrints {
  inProductionPrint: PotentialPrint | null;
  activeVotingPrints: PotentialPrint[];
  concludedGroup: string | null;
}

/**
 * Primary GraphQL Query to fetch active PotentialPrint entries including inProduction status.
 * Fetches items that are either actively open for votes or currently in production.
 */
const GET_POTENTIAL_PRINTS_WITH_PRODUCTION = gql`
  query GetPotentialPrintsWithProduction {
    potentialPrints(first: 100, where: { OR: [{ isActive: true }, { inProduction: true }] }) {
      id
      title
      isActive
      inProduction
      productionNote
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
 * Fallback GraphQL Query to fetch PotentialPrint entries without `inProduction` fields
 * (used if `inProduction` has not yet been added to the Hygraph schema).
 */
const GET_POTENTIAL_PRINTS_BASIC = gql`
  query GetPotentialPrintsBasic {
    potentialPrints(first: 100) {
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
    prints(first: 100, where: { display: true }) {
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
 * Formats and applies CDN optimization to image assets on potential prints.
 */
function formatPotentialPrintEntries(prints: PotentialPrint[]): PotentialPrint[] {
  return prints.map((p) => ({
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

/**
 * Fetches `PotentialPrint` entries from Hygraph CMS.
 * Resiliently handles schemas with or without `inProduction` fields.
 * 
 * @async
 * @returns {Promise<PotentialPrint[]>} Array of potential prints.
 */
export async function fetchPotentialPrints(): Promise<PotentialPrint[]> {
  // 1. Attempt query with `inProduction` fields
  try {
    const data = await client.request<{ potentialPrints: PotentialPrint[] }>(GET_POTENTIAL_PRINTS_WITH_PRODUCTION);
    if (data && Array.isArray(data.potentialPrints)) {
      return formatPotentialPrintEntries(data.potentialPrints);
    }
  } catch (prodError) {
    // If inProduction field is not yet in Hygraph schema, fall back to basic query
    try {
      const basicData = await client.request<{ potentialPrints: PotentialPrint[] }>(GET_POTENTIAL_PRINTS_BASIC);
      if (basicData && Array.isArray(basicData.potentialPrints)) {
        return formatPotentialPrintEntries(basicData.potentialPrints);
      }
    } catch (basicError) {
      console.warn('[potentialPrints] Primary and basic potentialPrints queries encountered errors, falling back to prints:', basicError);
    }
  }

  // 2. Fallback to regular Print model if PotentialPrint model doesn't exist
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
 * Partitions potential prints into the active "In Production" spotlight print
 * and the active candidate prints currently open for community voting.
 * 
 * AUTOMATED LIFECYCLE RULE:
 * If an in-production print belongs to a `votingGroup`, that entire group
 * is treated as concluded. All other prints in that group are automatically
 * excluded from the active voting list, removing the need to manually set
 * `isActive: false` on losing candidates.
 * 
 * @param {PotentialPrint[]} prints - Array of all potential prints.
 * @returns {PartitionedPrints} Partitioned result containing inProductionPrint, activeVotingPrints, and concludedGroup.
 */
export function partitionPotentialPrints(prints: PotentialPrint[]): PartitionedPrints {
  const inProductionPrint = prints.find((p) => p.inProduction === true) || null;
  const concludedGroup = inProductionPrint?.votingGroup ? inProductionPrint.votingGroup.trim() : null;

  const activeVotingPrints = prints.filter((p) => {
    // 1. Exclude the in-production print (it gets rendered in the spotlight card)
    if (p.inProduction === true) return false;

    // 2. Exclude manually deactivated prints
    if (p.isActive === false) return false;

    // 3. Auto-retire any other candidate from the same voting group as the winner
    if (concludedGroup && p.votingGroup && p.votingGroup.trim() === concludedGroup) {
      return false;
    }

    return true;
  });

  return {
    inProductionPrint,
    activeVotingPrints,
    concludedGroup,
  };
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
