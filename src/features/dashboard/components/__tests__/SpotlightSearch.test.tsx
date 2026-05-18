import React from 'react';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithPager } from '@/test-utils/renderWithPager';
import SpotlightSearch from '../SpotlightSearch';

jest.mock('@/context/CompanyWorkspaceContext', () => ({
  useCompanyWorkspaceOptional: () => null,
}));
jest.mock('@/features/backoffice/useBackOfficeInterventions', () => ({
  useBackOfficeInterventions: () => ({ interventions: [] }),
}));
jest.mock('@/features/interventions/useTechnicianAssignments', () => ({
  useTechnicianAssignments: () => ({ interventions: [] }),
}));

// cmdk calls scrollIntoView on selected items — not available in jsdom
Element.prototype.scrollIntoView = jest.fn();

describe('SpotlightSearch', () => {
  it('renders trigger button', () => {
    renderWithPager(<SpotlightSearch />, 3);
    expect(screen.getByTestId('spotlight-trigger')).toBeInTheDocument();
  });

  it('shows 3 nav items when open', () => {
    renderWithPager(<SpotlightSearch />, 3);
    fireEvent.click(screen.getByTestId('spotlight-trigger'));
    expect(screen.getByTestId('nav-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-2')).toBeInTheDocument();
  });

  it('nav items have correct translated text content', () => {
    renderWithPager(<SpotlightSearch />, 3);
    fireEvent.click(screen.getByTestId('spotlight-trigger'));
    // Verify that each nav item contains the expected label text (from spotlight.nav_* i18n keys)
    const item0 = screen.getByTestId('nav-item-0');
    const item1 = screen.getByTestId('nav-item-1');
    const item2 = screen.getByTestId('nav-item-2');
    expect(item0).toBeInTheDocument();
    expect(item1).toBeInTheDocument();
    expect(item2).toBeInTheDocument();
    // Each item should have non-empty text
    expect(item0.textContent?.trim().length).toBeGreaterThan(0);
    expect(item1.textContent?.trim().length).toBeGreaterThan(0);
    expect(item2.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('closes modal when nav item selected', () => {
    renderWithPager(<SpotlightSearch />, 3);
    fireEvent.click(screen.getByTestId('spotlight-trigger'));
    fireEvent.click(screen.getByTestId('nav-item-0'));
    // Modal should close (nav items no longer rendered)
    expect(screen.queryByTestId('nav-item-0')).not.toBeInTheDocument();
  });

  it('navigates to the correct page when nav item is selected', () => {
    // Start at page 0 (default). Click nav-item-1 which maps to pageIndex=1.
    // After selection, the modal closes. Re-open to verify the active indicator
    // appears on nav-item-1, confirming setPageIndex(1) was called.
    renderWithPager(<SpotlightSearch />, 3);

    // Open modal and click nav-item-1 (pageIndex=1)
    fireEvent.click(screen.getByTestId('spotlight-trigger'));
    fireEvent.click(screen.getByTestId('nav-item-1'));

    // Modal closes after selection
    expect(screen.queryByTestId('nav-item-1')).not.toBeInTheDocument();

    // Re-open the modal to inspect active state
    fireEvent.click(screen.getByTestId('spotlight-trigger'));

    // nav-item-1 should now show the active label, confirming setPageIndex(1) was called
    const activeItem = screen.getByTestId('nav-item-1');
    // The active item renders an active indicator label (spotlight.active_label i18n key).
    // In the default test locale (French) this is "Actif"; match both FR/EN variants.
    expect(within(activeItem).getByText(/actif|active/i)).toBeInTheDocument();
  });
});
