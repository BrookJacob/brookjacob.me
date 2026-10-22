import React, { useState, useMemo } from 'react';
import type { ExhibitionShow, ShowCategory } from '../lib/types';
import { EXHIBITIONS, groupShows, formatDateRange, getShowStatus } from '../lib/shows';

interface ExhibitionsListProps {
  initialShows?: ExhibitionShow[];
}

export const ExhibitionsList: React.FC<ExhibitionsListProps> = ({
  initialShows = EXHIBITIONS,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | ShowCategory>('all');

  // Evaluate grouping relative to current client date
  const { current, upcoming, past } = useMemo(() => {
    return groupShows(initialShows, new Date());
  }, [initialShows]);

  const filteredShows = useMemo(() => {
    if (selectedFilter === 'current') return current;
    if (selectedFilter === 'upcoming') return upcoming;
    if (selectedFilter === 'past') return past;
    return initialShows;
  }, [selectedFilter, current, upcoming, past, initialShows]);

  return (
    <section className="space-y-6 pt-10 border-t border-paper-border dark:border-carbon-border">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-paper-text dark:text-carbon-text mt-1">
            Shows
          </h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-paper-border/30 dark:bg-carbon-border/30 rounded-xl text-xs font-mono">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${selectedFilter === 'all'
              ? 'bg-paper-bg dark:bg-carbon-bg text-paper-text dark:text-carbon-text font-semibold shadow-xs'
              : 'text-paper-muted dark:text-carbon-muted hover:text-paper-text dark:hover:text-carbon-text'
              }`}
          >
            All ({initialShows.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('current')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${selectedFilter === 'current'
              ? 'bg-paper-bg dark:bg-carbon-bg text-paper-text dark:text-carbon-text font-semibold shadow-xs'
              : 'text-paper-muted dark:text-carbon-muted hover:text-paper-text dark:hover:text-carbon-text'
              }`}
          >
            {current.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
            Current ({current.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('upcoming')}
            className={`px-3 py-1.5 rounded-lg transition-all ${selectedFilter === 'upcoming'
              ? 'bg-paper-bg dark:bg-carbon-bg text-paper-text dark:text-carbon-text font-semibold shadow-xs'
              : 'text-paper-muted dark:text-carbon-muted hover:text-paper-text dark:hover:text-carbon-text'
              }`}
          >
            Upcoming ({upcoming.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('past')}
            className={`px-3 py-1.5 rounded-lg transition-all ${selectedFilter === 'past'
              ? 'bg-paper-bg dark:bg-carbon-bg text-paper-text dark:text-carbon-text font-semibold shadow-xs'
              : 'text-paper-muted dark:text-carbon-muted hover:text-paper-text dark:hover:text-carbon-text'
              }`}
          >
            Past ({past.length})
          </button>
        </div>
      </div>

      {/* Shows Feed */}
      {selectedFilter === 'all' ? (
        // Stacked View when "All" is active
        <div className="space-y-8">
          {/* Current Shows */}
          {current.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs uppercase tracking-wider font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Currently on View
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {current.map((show) => (
                  <ShowCard key={show.id} show={show} status="current" />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Shows */}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-wider font-mono font-bold text-paper-accent dark:text-carbon-accent">
                Upcoming Exhibitions
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {upcoming.map((show) => (
                  <ShowCard key={show.id} show={show} status="upcoming" />
                ))}
              </div>
            </div>
          )}

          {/* Past Shows */}
          {past.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-wider font-mono font-bold text-paper-muted dark:text-carbon-muted">
                Selected Past Shows & Archive
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {past.map((show) => (
                  <ShowCard key={show.id} show={show} status="past" />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Single Filtered List
        <div className="space-y-3">
          {filteredShows.length > 0 ? (
            filteredShows.map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                status={getShowStatus(show, new Date())}
              />
            ))
          ) : (
            <div className="p-8 text-center rounded-xl border border-paper-border/60 dark:border-carbon-border/60 bg-paper-border/10 dark:bg-carbon-border/10">
              <p className="font-serif text-sm text-paper-muted dark:text-carbon-muted">
                No {selectedFilter} exhibitions listed at this time.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

interface ShowCardProps {
  show: ExhibitionShow;
  status: ShowCategory;
}

const ShowCard: React.FC<ShowCardProps> = ({ show, status }) => {
  const isCurrent = status === 'current';

  return (
    <div
      className={`p-5 rounded-xl border transition-all ${isCurrent
        ? 'bg-paper-accent/5 dark:bg-carbon-accent/5 border-emerald-500/40 dark:border-emerald-400/40 shadow-xs'
        : 'bg-paper-bg dark:bg-carbon-bg border-paper-border dark:border-carbon-border hover:border-paper-accent/50 dark:hover:border-carbon-accent/50'
        }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="space-y-1">
          {/* Status / Note Badge */}
          <div className="flex items-center gap-2">
            {isCurrent && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                On View Now
              </span>
            )}
            {show.note && (
              <span className="text-[11px] font-mono text-paper-muted dark:text-carbon-muted">
                {show.note}
              </span>
            )}
          </div>

          {/* Show Title */}
          <h4 className="font-serif text-lg font-bold text-paper-text dark:text-carbon-text">
            {show.url ? (
              <a
                href={show.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-paper-accent dark:hover:text-carbon-accent transition-colors underline decoration-paper-border hover:decoration-paper-accent"
              >
                {show.title} &rarr;
              </a>
            ) : (
              show.title
            )}
          </h4>

          {/* Venue & Location */}
          <p className="font-serif text-sm text-paper-muted dark:text-carbon-muted">
            {show.venue} · <span className="font-sans text-xs">{show.location}</span>
          </p>

          {/* Opening Reception callout */}
          {show.reception && (
            <p className="text-xs font-mono text-paper-accent dark:text-carbon-accent pt-1">
              {show.reception}
            </p>
          )}
        </div>

        {/* Date Range Badge */}
        <div className="sm:text-right shrink-0">
          <span className="inline-block px-2.5 py-1 rounded bg-paper-border/30 dark:bg-carbon-border/30 font-mono text-xs text-paper-text dark:text-carbon-text font-medium">
            {formatDateRange(show.startDate, show.endDate)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExhibitionsList;
