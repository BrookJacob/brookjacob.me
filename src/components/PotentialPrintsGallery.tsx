/**
 * @file src/components/PotentialPrintsGallery.tsx
 * @description Interactive Voting Gallery Component for Upcoming Potential Prints.
 * 
 * Features:
 * - Multi-image preview toggle (Original Photo vs. Quantized Linocut Reduction Preview).
 * - Real-time aggregate vote updates powered by Firestore snapshots.
 * - Anonymous authentication (`signInAnonymously`) & Cloud Function voting (`voteOnPrint`).
 * - Responsive gallery grid with variant grouping, vote progress bars, and state indicators.
 */

import React, { useState, useEffect } from 'react';
import { BlurhashCanvas } from './BlurhashCanvas';
import {
  fetchPotentialPrints,
  partitionPotentialPrints,
  type PotentialPrint,
  type VotingGroup,
} from '../lib/potentialPrints';
import { voteOnPrint, subscribeToPrintVoteCount } from '../lib/voting';
import { InProductionPrintCard } from './InProductionPrintCard';

/**
 * Props for individual PotentialPrintCard subcomponent.
 */
interface PotentialPrintCardProps {
  print: PotentialPrint;
  onVoteComplete?: (hygraphId: string, voteType: 'want_print' | 'pass') => void;
}

/**
 * Individual Artwork Card for Potential Print Voting.
 */
export const PotentialPrintCard: React.FC<PotentialPrintCardProps> = ({ print, onVoteComplete }) => {
  const [activeImageTab, setActiveImageTab] = useState<'original' | 'quantized'>('original');
  const [voteCount, setVoteCount] = useState<number>(print.voteCount || 0);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [userVotedType, setUserVotedType] = useState<'want_print' | 'pass' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  // Subscribe to real-time Firestore vote count updates
  useEffect(() => {
    const unsubscribe = subscribeToPrintVoteCount(print.id, (count) => {
      setVoteCount(count);
    });
    return () => unsubscribe();
  }, [print.id]);

  const hasQuantized = !!print.quantizedImage?.url;
  const currentAsset = activeImageTab === 'quantized' && hasQuantized
    ? print.quantizedImage
    : print.image;
  const currentImageUrl = currentAsset?.url;
  const currentBlurhash = currentAsset?.blurhash;

  const handleVote = async (type: 'want_print' | 'pass') => {
    if (isVoting || userVotedType) return;
    setIsVoting(true);
    setFeedbackMessage(null);
    setIsError(false);

    const result = await voteOnPrint(print.id, type, print.votingGroup || undefined);

    setIsVoting(false);

    if (result.success) {
      setUserVotedType(type);
      setFeedbackMessage(type === 'want_print' ? '✓ Vote recorded!' : 'Feedback saved');
      if (onVoteComplete) onVoteComplete(print.id, type);
    } else {
      if (result.alreadyVoted) {
        setUserVotedType('want_print');
      }
      setIsError(!result.alreadyVoted);
      setFeedbackMessage(result.message);
    }
  };

  return (
    <div className="bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
      {/* Image Preview Container */}
      <div className="relative group aspect-[4/5] bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
        {currentImageUrl ? (
          <BlurhashCanvas
            key={`${print.id}-${activeImageTab}`}
            src={currentImageUrl}
            alt={print.title}
            blurhash={currentBlurhash}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-paper-muted dark:text-carbon-muted text-xs font-mono">
            No Image Preview
          </div>
        )}

        {/* Quantized / Original Toggle Bar */}
        {hasQuantized && (
          <div className="absolute top-3 left-3 right-3 flex justify-center gap-1.5 p-1 bg-black/60 backdrop-blur-md rounded-lg z-10 text-xs font-mono">
            <button
              onClick={() => setActiveImageTab('original')}
              className={`px-2.5 py-1 rounded-md transition-all ${activeImageTab === 'original'
                ? 'bg-white text-neutral-900 font-semibold shadow-sm'
                : 'text-neutral-300 hover:text-white'
                }`}
            >
              Original Photo
            </button>
            <button
              onClick={() => setActiveImageTab('quantized')}
              className={`px-2.5 py-1 rounded-md transition-all ${activeImageTab === 'quantized'
                ? 'bg-paper-accent dark:bg-carbon-accent text-white font-semibold shadow-sm'
                : 'text-neutral-300 hover:text-white'
                }`}
            >
              Quantized Linocut
            </button>
          </div>
        )}

        {/* Live Vote Badge Overlay */}
        <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/75 backdrop-blur-md text-white rounded-md text-xs font-mono font-medium flex items-center gap-1.5">
          <span>{voteCount} {voteCount === 1 ? 'Vote' : 'Votes'}</span>
        </div>
      </div>

      {/* Content & Interactive Voting Section */}
      <div className="p-5 flex flex-col justify-between flex-grow">
        <div>
          {print.votingGroup && (
            <div className="mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper-border/50 dark:bg-carbon-border/50 text-paper-muted dark:text-carbon-muted">
                Study: {print.votingGroup}
              </span>
            </div>
          )}

          <h3 className="font-serif text-xl font-bold text-paper-text dark:text-carbon-text">
            {print.title}
          </h3>
        </div>

        {/* Action Buttons & Status Messages */}
        <div className="mt-2 pt-4 border-t border-paper-border/60 dark:border-carbon-border/60">
          {feedbackMessage && (
            <div
              className={`mb-3 p-2.5 text-xs font-mono rounded-md text-center ${isError
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                : 'bg-paper-accent/10 border border-paper-accent/30 text-paper-accent dark:text-carbon-accent'
                }`}
            >
              {feedbackMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleVote('want_print')}
              disabled={isVoting || !!userVotedType}
              className={`px-4 py-2.5 rounded-lg font-mono text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5 ${userVotedType === 'want_print'
                ? 'bg-paper-accent/80 dark:bg-carbon-accent/80 text-white cursor-default'
                : 'bg-paper-accent dark:bg-carbon-accent text-white hover:opacity-90 active:scale-95 disabled:opacity-50'
                }`}
            >
              {isVoting ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : userVotedType === 'want_print' ? (
                '✓ Voted'
              ) : (
                'Vote for Print'
              )}
            </button>

            <button
              onClick={() => handleVote('pass')}
              disabled={isVoting || !!userVotedType}
              className={`px-4 py-2.5 rounded-lg font-mono text-xs font-medium transition-all flex items-center justify-center ${userVotedType === 'pass'
                ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 cursor-default'
                : 'bg-paper-border/40 dark:bg-carbon-border/40 text-paper-text dark:text-carbon-text hover:bg-paper-border dark:hover:bg-carbon-border active:scale-95 disabled:opacity-50'
                }`}
            >
              {userVotedType === 'pass' ? 'Passed' : 'Pass'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface PotentialPrintsGalleryProps {
  /**
   * Pre-fetched potential prints data supplied statically from Astro build-time SSG.
   * Eliminates client-side Hygraph API requests.
   */
  initialPrints?: PotentialPrint[];
}

/**
 * Main PotentialPrintsGallery Container Component.
 * Supports static SSG pre-rendered prints, in-production spotlight showcase,
 * and automated retirement of concluded voting groups.
 */
export const PotentialPrintsGallery: React.FC<PotentialPrintsGalleryProps> = ({ initialPrints }) => {
  const [prints, setPrints] = useState<PotentialPrint[]>(initialPrints || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialPrints || initialPrints.length === 0);

  // Client-side fallback if not supplied at build time
  useEffect(() => {
    if (initialPrints && initialPrints.length > 0) {
      setPrints(initialPrints);
      setIsLoading(false);
      return;
    }

    async function loadPrints() {
      setIsLoading(true);
      const items = await fetchPotentialPrints();
      setPrints(items);
      setIsLoading(false);
    }
    loadPrints();
  }, [initialPrints]);

  if (isLoading) {
    return (
      <div className="py-12 text-center font-mono text-sm text-paper-muted dark:text-carbon-muted flex items-center justify-center gap-2">
        <span className="w-4 h-4 border-2 border-paper-accent dark:border-carbon-accent border-t-transparent rounded-full animate-spin"></span>
        Loading print concepts...
      </div>
    );
  }

  // Partition into In-Production spotlight item and Active Voting items
  const { inProductionPrint, activeVotingPrints } = partitionPotentialPrints(prints);

  const hasAnyContent = inProductionPrint !== null || activeVotingPrints.length > 0;

  if (!hasAnyContent) {
    return (
      <div className="py-12 px-6 rounded-xl border border-dashed border-paper-border dark:border-carbon-border text-center">
        <p className="font-serif text-lg text-paper-muted dark:text-carbon-muted">
          No upcoming print concepts right now. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-2">
      {/* Active Community Voting Candidates */}
      {activeVotingPrints.length > 0 ? (
        <section aria-label="Active Community Voting Candidates">
          {/* Context note if previous winner is in production */}


          <div className="mb-5">
            <h4 className="font-serif text-lg font-bold text-paper-text dark:text-carbon-text">
              Future Edition Concepts
            </h4>
            <p className="text-xs text-paper-muted dark:text-carbon-muted font-serif mt-0.5 max-w-xl">
              Vote on the compositions and color studies you would like to see carved next.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeVotingPrints.map((print) => (
              <PotentialPrintCard key={print.id} print={print} />
            ))}
          </div>
        </section>
      ) : inProductionPrint ? (
        <div className="py-8 px-6 rounded-xl border border-dashed border-paper-border dark:border-carbon-border text-center">
          <p className="font-serif text-base text-paper-muted dark:text-carbon-muted">
            The previous winner <strong className="text-paper-text dark:text-carbon-text font-semibold">{inProductionPrint.title}</strong> is currently on the carving block in the studio (featured as the first card in the gallery below). The next batch of candidate concepts will be posted here for voting soon!
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default PotentialPrintsGallery;
