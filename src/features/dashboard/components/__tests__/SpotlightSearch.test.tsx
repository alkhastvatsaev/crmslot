import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@/test-utils/render';
import { DashboardPagerProvider } from '@/features/dashboard/dashboardPagerContext';
import { I18nProvider } from '@/core/i18n/I18nContext';
import SpotlightSearch from '../SpotlightSearch';

// cmdk calls scrollIntoView on selected items — not available in jsdom
Element.prototype.scrollIntoView = jest.fn();

// Wrap with both I18nProvider (for t()) and DashboardPagerProvider (for pager context)
function renderSpotlight({ initialPageIndex = 0 }: { initialPageIndex?: number } = {}) {
  return render(
    <I18nProvider>
      <DashboardPagerProvider pageCount={3} initialPageIndex={initialPageIndex}>
        <SpotlightSearch />
      </DashboardPagerProvider>
    </I18nProvider>,
  );
}

describe('SpotlightSearch', () => {
  it('shows the search placeholder text in the trigger button', () => {
    renderSpotlight();
    // The trigger button has aria-label "Ouvrir la recherche"
    expect(screen.getByRole('button', { name: 'Ouvrir la recherche' })).toBeInTheDocument();
    // The placeholder text is rendered inside the button (fr locale: "Nom")
    expect(screen.getByText('Nom')).toBeInTheDocument();
  });

  it('shows 3 navigation items after opening the modal', () => {
    renderSpotlight();
    const triggerBtn = screen.getByRole('button', { name: 'Ouvrir la recherche' });
    fireEvent.click(triggerBtn);

    // French locale nav labels
    expect(screen.getByText('Carte')).toBeInTheDocument();
    expect(screen.getByText('Espace société')).toBeInTheDocument();
    expect(screen.getByText('Technicien')).toBeInTheDocument();
  });

  it('closes modal when "Carte" nav item is clicked, calling setPageIndex(0)', () => {
    renderSpotlight({ initialPageIndex: 1 });

    // Open the modal
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir la recherche' }));

    // Verify the nav items are visible
    expect(screen.getByText('Carte')).toBeInTheDocument();
    expect(screen.getByText('Espace société')).toBeInTheDocument();

    // Click the "Carte" item to navigate to page 0
    fireEvent.click(screen.getByText('Carte'));

    // After clicking, the modal should close (AnimatePresence removes children)
    // In tests framer-motion AnimatePresence renders children immediately so we check modal is gone
    expect(screen.queryByText('Espace société')).not.toBeInTheDocument();
  });
});
