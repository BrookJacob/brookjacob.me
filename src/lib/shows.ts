import type { ExhibitionShow, ShowCategory } from './types';

/**
  * Defined exhibition schedule for Jacob Brook.
  * 
  * Dates are in standard ISO format 'YYYY-MM-DD'.
  * The site automatically evaluates current, upcoming, and past status
  * in the user's browser based on today's date.
  */
export const EXHIBITIONS: ExhibitionShow[] = [
  {
    id: 'saga-mini-gems26',
    title: 'Society of American Graphic Artists Mini-Gems Exhibition',
    venue: 'SAGA Gallery',
    location: '32 Union Sq E, Suite 1214, New York, NY 10003',
    startDate: '2026-12-05',
    endDate: '2027-01-09',
    reception: '',
    note: 'SAGA\'s Miniature Print Show',
    url: 'https://sagaprints.com/'
  }
];

/**
 * Determines the category of a show given a reference date.
 */
export function getShowStatus(show: ExhibitionShow, refDate: Date = new Date()): ShowCategory {
  // Use YYYY-MM-DD comparison for timezone safety
  const refYear = refDate.getFullYear();
  const refMonth = String(refDate.getMonth() + 1).padStart(2, '0');
  const refDay = String(refDate.getDate()).padStart(2, '0');
  const todayStr = `${refYear}-${refMonth}-${refDay}`;

  if (todayStr >= show.startDate && todayStr <= show.endDate) {
    return 'current';
  }
  if (todayStr < show.startDate) {
    return 'upcoming';
  }
  return 'past';
}

/**
 * Groups and sorts shows into Current, Upcoming, and Past buckets.
 */
export function groupShows(shows: ExhibitionShow[] = EXHIBITIONS, refDate: Date = new Date()) {
  const current: ExhibitionShow[] = [];
  const upcoming: ExhibitionShow[] = [];
  const past: ExhibitionShow[] = [];

  for (const show of shows) {
    const status = getShowStatus(show, refDate);
    if (status === 'current') {
      current.push(show);
    } else if (status === 'upcoming') {
      upcoming.push(show);
    } else {
      past.push(show);
    }
  }

  // Current: ending soonest first
  current.sort((a, b) => a.endDate.localeCompare(b.endDate));

  // Upcoming: starting soonest first
  upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate));

  // Past: ended most recently first
  past.sort((a, b) => b.endDate.localeCompare(a.endDate));

  return { current, upcoming, past };
}

/**
 * Formats an ISO date string or range into human-readable text.
 * e.g., "Oct 1 – Nov 8, 2026"
 */
export function formatDateRange(startDateStr: string, endDateStr: string): string {
  const startParts = startDateStr.split('-').map(Number);
  const endParts = endDateStr.split('-').map(Number);

  const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const startMonth = monthNames[start.getMonth()];
  const endMonth = monthNames[end.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} – ${endDay}, ${startYear}`;
    }
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${startYear}`;
  }

  return `${startMonth} ${startDay}, ${startYear} – ${endMonth} ${endDay}, ${endYear}`;
}
