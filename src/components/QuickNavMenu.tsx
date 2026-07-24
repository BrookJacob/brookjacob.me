/**
 * QuickNavMenu Component (Radix UI Dropdown Primitive)
 * 
 * Accessible dropdown menu primitive built with @radix-ui/react-dropdown-menu.
 * Dynamically renders links to the 2 latest software projects and 2 latest printmaking artworks.
 * 
 * @component
 */

import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export interface QuickNavItem {
  title: string;
  slug: string;
  yearOrTag?: string;
  url: string;
}

export interface QuickNavMenuProps {
  latestProjects?: QuickNavItem[];
  latestPrints?: QuickNavItem[];
}

const DEFAULT_PROJECTS: QuickNavItem[] = [
  {
    title: 'ABLE Roadmap',
    slug: 'able-roadmap',
    yearOrTag: 'SaaS',
    url: 'https://developer.brookjacob.studio/able-roadmap',
  },
  {
    title: 'Satori Trailheads',
    slug: 'satori-trailheads',
    yearOrTag: 'Platform',
    url: 'https://developer.brookjacob.studio/satori-trailheads',
  },
];

const DEFAULT_PRINTS: QuickNavItem[] = [
  {
    title: 'View from a Distance',
    slug: 'view-from-a-distance',
    yearOrTag: '2025',
    url: 'https://printmaker.brookjacob.studio/view-from-a-distance',
  },
  {
    title: 'Nora',
    slug: 'nora',
    yearOrTag: '2025',
    url: 'https://printmaker.brookjacob.studio/nora',
  },
];

export const QuickNavMenu: React.FC<QuickNavMenuProps> = ({
  latestProjects = DEFAULT_PROJECTS,
  latestPrints = DEFAULT_PRINTS,
}) => {
  const projectsToDisplay = latestProjects.length > 0 ? latestProjects.slice(0, 2) : DEFAULT_PROJECTS;
  const printsToDisplay = latestPrints.length > 0 ? latestPrints.slice(0, 2) : DEFAULT_PRINTS;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-paper-border dark:border-carbon-border bg-paper-bg dark:bg-carbon-bg text-paper-text dark:text-carbon-text hover:border-paper-accent dark:hover:border-carbon-accent transition-all focus-ring focus:outline-none cursor-pointer group"
          aria-label="Quick Jump Menu"
        >
          <span>Quick Jump</span>
          <svg
            className="w-3.5 h-3.5 opacity-70 transition-transform group-data-[state=open]:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[230px] bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border rounded-xl p-2 shadow-xl animate-in fade-in-80 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          sideOffset={6}
        >
          {/* Section 1: Latest Projects */}
          <DropdownMenu.Label className="px-2.5 py-1.5 text-[10px] uppercase font-mono font-semibold tracking-wider text-paper-muted dark:text-carbon-muted">
            Latest Projects
          </DropdownMenu.Label>

          {projectsToDisplay.map((project) => (
            <DropdownMenu.Item key={project.slug} asChild>
              <a
                href={project.url}
                className="flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg text-paper-text dark:text-carbon-text hover:bg-paper-border/30 dark:hover:bg-carbon-border/30 hover:text-paper-accent dark:hover:text-carbon-accent transition-colors outline-none cursor-pointer"
              >
                <span className="truncate max-w-[140px]">{project.title}</span>
                {project.yearOrTag && (
                  <span className="text-[10px] font-mono opacity-60 ml-2 shrink-0">{project.yearOrTag}</span>
                )}
              </a>
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="h-px bg-paper-border dark:bg-carbon-border my-1.5" />

          {/* Section 2: Latest Prints */}
          <DropdownMenu.Label className="px-2.5 py-1.5 text-[10px] uppercase font-mono font-semibold tracking-wider text-paper-muted dark:text-carbon-muted">
            Latest Prints
          </DropdownMenu.Label>

          {printsToDisplay.map((print) => (
            <DropdownMenu.Item key={print.slug} asChild>
              <a
                href={print.url}
                className="flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg text-paper-text dark:text-carbon-text hover:bg-paper-border/30 dark:hover:bg-carbon-border/30 hover:text-paper-accent dark:hover:text-carbon-accent transition-colors outline-none cursor-pointer"
              >
                <span className="truncate max-w-[140px]">{print.title}</span>
                {print.yearOrTag && (
                  <span className="text-[10px] font-mono opacity-60 ml-2 shrink-0">{print.yearOrTag}</span>
                )}
              </a>
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="h-px bg-paper-border dark:bg-carbon-border my-1.5" />

          {/* Section 3: Portal Index Link */}
          <DropdownMenu.Item asChild>
            <a
              href="https://brookjacob.studio"
              className="flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-lg text-paper-accent dark:text-carbon-accent hover:bg-paper-border/30 dark:hover:bg-carbon-border/30 transition-colors outline-none cursor-pointer"
            >
              <span>Root Portal</span>
              <span>&rarr;</span>
            </a>
          </DropdownMenu.Item>

          <DropdownMenu.Arrow className="fill-paper-border dark:fill-carbon-border" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default QuickNavMenu;
