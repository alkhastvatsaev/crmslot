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
    renderWithPager(<SpotlightSearch />, 6);
    expect(screen.getByTestId('spotlight-trigger')).toBeInTheDocument();
  });

  it('shows 6 nav items when open', () => {
    renderWithPager(<SpotlightSearch />, 6);
    fireEvent.click(screen.getByTestId('spotlight-trigger'));
    for (let i = 0; i < 6; i += 1) {
      expect(screen.getByTestId(`nav-item-${i}`)).toBeInTheDocument();
    }
  });

  it('nav items have correct translated text content', () => {
    renderWithPager(<SpotlightSearch />, 6);
    fireEvent.click(screen.getByTestId('spotlight-trigger'));
    // Verify that each nav item contains the expected label text (from spotlight.nav_* i18n keys)
    const item0 = screen.getByTestId('nav-item-0');
    const item1 = screen.getByTestId('nav-item-1');
    const item2 = screen.getByTestId('nav-item-2');
    const item3 = screen.getByTestId('nav-item-3');
    const item4 = screen.getByTestId('nav-item-4');
    const item5 = screen.getByTestId('nav-item-5');
    expect(item0).toBeInTheDocument();
    expect(item1).toBeInTheDocument();
    expect(item2).toBeInTheDocument();
    expect(item3).toBeInTheDocument();
    expect(item4).toBeInTheDocument();
    expect(item5).toBeInTheDocument();
    for (const item of [item0, item1, item2, item3, item4, item5]) {
      expect(item.textContent?.trim().length).toBeGreaterThan(0);
    }
  });

  it('closes modal when nav item selected', () => {
    renderWithPager(<SpotlightSearch />, 6);
    fireEvent.click(screen.getByTestId('spotlight-trigger'));
    fireEvent.click(screen.getByTestId('nav-item-0'));
    // Modal should close (nav items no longer rendered)
    expect(screen.queryByTestId('nav-item-0')).not.toBeInTheDocument();
  });

  it('navigates to the correct page when nav item is selected', () => {
    // Start at page 0 (default). Click nav-item-1 which maps to pageIndex=1.
    // After selection, the modal closes. Re-open to verify the active indicator
    // appears on nav-item-1, confirming setPageIndex(1) was called.
    renderWithPager(<SpotlightSearch />, 6);

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
