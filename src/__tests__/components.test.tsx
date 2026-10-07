import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/intelligence/EmptyState';
import { SectionHeader } from '@/components/intelligence/SectionHeader';
import { StatusIndicator } from '@/components/intelligence/StatusIndicator';
import { CategoryBadge } from '@/components/intelligence/CategoryBadge';
import { SourceBadge } from '@/components/intelligence/SourceBadge';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No items" description="Nothing collected yet" />);
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Nothing collected yet')).toBeInTheDocument();
  });

  it('renders an action element when provided', () => {
    render(
      <EmptyState
        title="Empty"
        description="No data"
        action={<button>Configure Sources</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Configure Sources' })).toBeInTheDocument();
  });

  it('does not render an action when not provided', () => {
    render(<EmptyState title="Empty" description="No data" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// SectionHeader
// ---------------------------------------------------------------------------

describe('SectionHeader', () => {
  it('renders the title', () => {
    render(<SectionHeader title="Today's Radar" />);
    expect(screen.getByText("Today's Radar")).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<SectionHeader title="Title" description="A helpful description" />);
    expect(screen.getByText('A helpful description')).toBeInTheDocument();
  });

  it('does not render description element when omitted', () => {
    const { container } = render(<SectionHeader title="Title" />);
    // Only the h2 should be in the header div
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('renders an action slot when provided', () => {
    render(<SectionHeader title="Title" action={<a href="/test">View all</a>} />);
    expect(screen.getByRole('link', { name: 'View all' })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// StatusIndicator
// ---------------------------------------------------------------------------

describe('StatusIndicator', () => {
  it('renders the label text', () => {
    render(<StatusIndicator status="idle" label="Database" />);
    expect(screen.getByText('Database')).toBeInTheDocument();
  });

  it('has role="status" for accessibility', () => {
    render(<StatusIndicator status="success" label="Sources" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  const statuses = ['idle', 'running', 'success', 'error', 'warning', 'offline'] as const;
  statuses.forEach((status) => {
    it(`renders without error for status="${status}"`, () => {
      const { unmount } = render(<StatusIndicator status={status} label={status} />);
      expect(screen.getByText(status)).toBeInTheDocument();
      unmount();
    });
  });
});

// ---------------------------------------------------------------------------
// CategoryBadge
// ---------------------------------------------------------------------------

describe('CategoryBadge', () => {
  it('renders AI News label for ai-news category', () => {
    render(<CategoryBadge category="ai-news" />);
    expect(screen.getByText('AI News')).toBeInTheDocument();
  });

  it('renders Safety label for safety-regulation category', () => {
    render(<CategoryBadge category="safety-regulation" />);
    expect(screen.getByText('Safety & Rules')).toBeInTheDocument();
  });

  it('renders all defined categories without throwing', () => {
    const categories = [
      'ai-news', 'ai-tools', 'models', 'research',
      'coding-agents', 'emerging-trends', 'career',
      'business', 'safety-regulation',
    ] as const;

    categories.forEach((cat) => {
      const { unmount } = render(<CategoryBadge category={cat} />);
      unmount();
    });
  });
});

// ---------------------------------------------------------------------------
// SourceBadge
// ---------------------------------------------------------------------------

describe('SourceBadge', () => {
  it('renders source name as plain text when no URL provided', () => {
    render(<SourceBadge name="arXiv" />);
    expect(screen.getByText('arXiv')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders as an external link when URL is provided', () => {
    render(<SourceBadge name="Hacker News" url="https://news.ycombinator.com" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://news.ycombinator.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has an accessible aria-label on the link', () => {
    render(<SourceBadge name="GitHub" url="https://github.com" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-label', expect.stringContaining('GitHub'));
  });
});

// ---------------------------------------------------------------------------
// cn utility
// ---------------------------------------------------------------------------

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2', 'py-2')).toBe('px-2 py-2');
  });

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'disabled', 'active')).toBe('base active');
  });

  it('handles undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });
});

// ---------------------------------------------------------------------------
// Phase B: HeroWelcomeBanner & Compact View Components
// ---------------------------------------------------------------------------

import { HeroWelcomeBanner } from '@/components/home/HeroWelcomeBanner';
import { CompactIntelligenceCard } from '@/components/intelligence/CompactIntelligenceCard';
import { IntelligenceStreamView } from '@/components/intelligence/IntelligenceStreamView';
import { IntelligenceItemWithSummary } from '@/lib/types';
import { fireEvent } from '@testing-library/react';

const mockItem: IntelligenceItemWithSummary = {
  id: 'test-item-1',
  sourceId: 'src-1',
  sourceName: 'arXiv Computer Vision',
  sourceUrl: 'https://arxiv.org',
  canonicalUrl: 'https://arxiv.org/abs/2604.12345',
  title: 'Sparse Attention Transformer Optimization at Scale',
  description: 'A study demonstrating 40% compute reduction on frontier models.',
  publishedAt: new Date().toISOString(),
  discoveredAt: new Date().toISOString(),
  contentType: 'paper',
  categories: ['research'],
  summary: {
    id: 'sum-1',
    itemId: 'test-item-1',
    content: 'Plain-English: Breakthrough method achieves 40% faster inference without loss.',
    model: 'claude-3-haiku',
    provider: 'anthropic',
    generatedAt: new Date().toISOString(),
    version: 1,
  },
};

describe('HeroWelcomeBanner', () => {
  it('renders executive headline and feature highlights', () => {
    render(<HeroWelcomeBanner isAuthenticated={false} />);
    expect(
      screen.getByText(/Cut through the noise. Understand the breakthroughs before the public./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Plain English Summaries/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified Citations/i)).toBeInTheDocument();
  });

  it('renders 1-click briefing CTA', () => {
    render(<HeroWelcomeBanner isAuthenticated={false} />);
    expect(screen.getByText(/Read Today's 5-Min Executive Briefing/i)).toBeInTheDocument();
  });

  it('renders permanent executive command surface without dismiss buttons', () => {
    render(<HeroWelcomeBanner isAuthenticated={true} />);
    expect(screen.getByText(/Surveillance Active/i)).toBeInTheDocument();
    expect(screen.getByText(/Explore Emerging Trends/i)).toBeInTheDocument();
    expect(screen.queryByTitle('Dismiss introduction')).not.toBeInTheDocument();
  });
});

describe('CompactIntelligenceCard', () => {
  it('renders item title and plain-english summary punchline', () => {
    render(<CompactIntelligenceCard item={mockItem} />);
    expect(screen.getByText('Sparse Attention Transformer Optimization at Scale')).toBeInTheDocument();
    expect(
      screen.getByText(/Plain-English: Breakthrough method achieves 40% faster inference without loss./i)
    ).toBeInTheDocument();
  });

  it('renders read button with target blank', () => {
    render(<CompactIntelligenceCard item={mockItem} />);
    const readBtn = screen.getByTitle('Read original source');
    expect(readBtn).toHaveAttribute('href', 'https://arxiv.org/abs/2604.12345');
    expect(readBtn).toHaveAttribute('target', '_blank');
  });

  it('triggers onBookmark callback when clicked', () => {
    let bookmarkedId = '';
    render(<CompactIntelligenceCard item={mockItem} onBookmark={(id) => { bookmarkedId = id; }} />);
    const bookmarkBtn = screen.getByTitle('Save bookmark');
    fireEvent.click(bookmarkBtn);
    expect(bookmarkedId).toBe('test-item-1');
  });
});

describe('IntelligenceStreamView', () => {
  it('renders controls and initial items', () => {
    render(<IntelligenceStreamView initialItems={[mockItem]} totalCount={1} />);
    expect(screen.getByText(/Latest Verified AI Developments/i)).toBeInTheDocument();
    expect(screen.getByText('Compact')).toBeInTheDocument();
    expect(screen.getByText('Expanded')).toBeInTheDocument();
    expect(screen.getByText('Sparse Attention Transformer Optimization at Scale')).toBeInTheDocument();
  });

  it('toggles between compact and expanded density', () => {
    render(<IntelligenceStreamView initialItems={[mockItem]} totalCount={1} />);
    const expandedBtn = screen.getByRole('button', { name: /expanded/i });
    fireEvent.click(expandedBtn);
    expect(screen.getByText('Sparse Attention Transformer Optimization at Scale')).toBeInTheDocument();
  });
  it('renders custom desk title and hides category filter when disabled', () => {
    render(
      <IntelligenceStreamView
        initialItems={[mockItem]}
        totalCount={1}
        title="Verified AI Tools Stream"
        description="Tools verified from official sources."
        showCategoryFilter={false}
        showFullStreamLink={false}
      />
    );
    expect(screen.getByText('Verified AI Tools Stream')).toBeInTheDocument();
    expect(screen.getByText('Tools verified from official sources.')).toBeInTheDocument();
    expect(screen.queryByText('All Intelligence')).not.toBeInTheDocument();
  });
});

import { ExecutiveBriefingSpotlight } from '@/components/intelligence/ExecutiveBriefingSpotlight';

describe('ExecutiveBriefingSpotlight', () => {
  it('renders briefing title and summary', () => {
    const mockBriefing = {
      id: 'briefing-1',
      briefing_date: '2026-10-06',
      title: 'State of Open Source AI Weights in Autumn 2026',
      summary: 'Frontier weights from European and Asian labs match proprietary performance on reasoning benchmarks.',
      content: '',
      item_count: 5,
      sections: [],
      created_at: new Date().toISOString(),
    };

    render(<ExecutiveBriefingSpotlight briefing={mockBriefing as any} />);
    expect(screen.getByText('5-Minute Executive Briefing')).toBeInTheDocument();
    expect(screen.getByText('State of Open Source AI Weights in Autumn 2026')).toBeInTheDocument();
    expect(screen.getByText(/Frontier weights from European and Asian labs/i)).toBeInTheDocument();
    expect(screen.getByText(/Delivered via email to Pro subscribers/i)).toBeInTheDocument();
  });

  it('renders null when briefing is null', () => {
    const { container } = render(<ExecutiveBriefingSpotlight briefing={null} />);
    expect(container.firstChild).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SavedStoriesClient Tests
// ---------------------------------------------------------------------------

import { SavedStoriesClient } from '@/components/bookmarks/SavedStoriesClient';

describe('SavedStoriesClient', () => {
  it('renders saved portfolio items and count', () => {
    render(
      <SavedStoriesClient
        initialBookmarkedItems={[mockItem]}
        initialSavedEntities={[]}
        isAuthenticated={true}
      />
    );
    expect(screen.getByText('Saved Intelligence Portfolio')).toBeInTheDocument();
    expect(screen.getByText('1 Saved')).toBeInTheDocument();
    expect(screen.getByText('Sparse Attention Transformer Optimization at Scale')).toBeInTheDocument();
    expect(screen.getByText('Cloud Synced to Account')).toBeInTheDocument();
  });

  it('renders preview mode badge when unauthenticated', () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    render(
      <SavedStoriesClient
        initialBookmarkedItems={[]}
        initialSavedEntities={[]}
        isAuthenticated={false}
      />
    );
    expect(screen.getByText('Browser Saved')).toBeInTheDocument();
    expect(screen.getByText(/Your saved reading list is currently empty/i)).toBeInTheDocument();
  });

  it('filters items by search query', () => {
    render(
      <SavedStoriesClient
        initialBookmarkedItems={[mockItem]}
        initialSavedEntities={[]}
        isAuthenticated={true}
      />
    );
    const searchInput = screen.getByPlaceholderText(/filter saved stories/i);
    fireEvent.change(searchInput, { target: { value: 'Sparse' } });
    expect(screen.getByText('Sparse Attention Transformer Optimization at Scale')).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'NonexistentKeyword' } });
    expect(screen.queryByText('Sparse Attention Transformer Optimization at Scale')).not.toBeInTheDocument();
  });
});


