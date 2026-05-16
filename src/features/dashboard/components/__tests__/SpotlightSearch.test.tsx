import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithPager } from '@/test-utils/renderWithPager';
import SpotlightSearch from '../SpotlightSearch';

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

  it('closes modal when nav item selected', () => {
    renderWithPager(<SpotlightSearch />, 3);
    fireEvent.click(screen.getByTestId('spotlight-trigger'));
    fireEvent.click(screen.getByTestId('nav-item-0'));
    // Modal should close (trigger button reappears / modal gone)
    expect(screen.queryByTestId('nav-item-0')).not.toBeInTheDocument();
  });
});
