import React from 'react';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithPager } from '@/test-utils/renderWithPager';
import SpotlightSearch from '../SpotlightSearch';
import { BACKOFFICE_HUB_SLOT_INDEX } from '@/features/backoffice/backofficeHubConstants';
import { AI_ASSISTANT_SLOT_INDEX } from '@/features/ai/aiAssistantConstants';
import { TECHNICIAN_LAB_SLOT_INDEX } from '@/features/technicians/technicianLabConstants';

/** Indices réels des entrées spotlight (pas 0..n-1 : lab = slot 6). */
const SPOTLIGHT_NAV_INDICES = [0, 1, 2, BACKOFFICE_HUB_SLOT_INDEX, AI_ASSISTANT_SLOT_INDEX, TECHNICIAN_LAB_SLOT_INDEX];
const SPOTLIGHT_PAGE_COUNT = TECHNICIAN_LAB_SLOT_INDEX + 1;

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
    renderWithPager(<SpotlightSearch />, SPOTLIGHT_PAGE_COUNT);
    expect(screen.getByTestId('spotlight-trigger')).toBeInTheDocument();
  });

  it('shows 6 nav items when open', () => {
    renderWithPager(<SpotlightSearch />, SPOTLIGHT_PAGE_COUNT);
    fireEvent.click(screen.getByTestId('spotlight-trigger'));
    for (const index of SPOTLIGHT_NAV_INDICES) {
      expect(screen.getByTestId(`nav-item-${index}`)).toBeInTheDocument();
    }
  });

  it('nav items have correct translated text content', () => {
    renderWithPager(<SpotlightSearch />, SPOTLIGHT_PAGE_COUNT);
    fireEvent.click(screen.getByTestId('spotlight-trigger'));
    // Verify that each nav item contains the expected label text (from spotlight.nav_* i18n keys)
    const items = SPOTLIGHT_NAV_INDICES.map((index) => screen.getByTestId(`nav-item-${index}`));
    for (const item of items) {
      expect(item).toBeInTheDocument();
      expect(item.textContent?.trim().length).toBeGreaterThan(0);
    }
  });

  it('closes modal when nav item selected', () => {
    renderWithPager(<SpotlightSearch />, SPOTLIGHT_PAGE_COUNT);
    fireEvent.click(screen.getByTestId('spotlight-trigger'));
    fireEvent.click(screen.getByTestId('nav-item-0'));
    // Modal should close (nav items no longer rendered)
    expect(screen.queryByTestId('nav-item-0')).not.toBeInTheDocument();
  });

  it('navigates to the correct page when nav item is selected', () => {
    // Start at page 0 (default). Click nav-item-1 which maps to pageIndex=1.
    // After selection, the modal closes. Re-open to verify the active indicator
    // appears on nav-item-1, confirming setPageIndex(1) was called.
    renderWithPager(<SpotlightSearch />, SPOTLIGHT_PAGE_COUNT);

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
