import React from 'react';
import { render, screen } from '@/test-utils/render';
import DashboardKpiStrip from '../DashboardKpiStrip';

describe('DashboardKpiStrip', () => {
  it('renders 3 pills with correct counts', () => {
    render(<DashboardKpiStrip pending={2} inProgress={1} done={5} />);

    const pendingPill = screen.getByTestId('kpi-pending');
    const inProgressPill = screen.getByTestId('kpi-in-progress');
    const donePill = screen.getByTestId('kpi-done');

    expect(pendingPill).toBeInTheDocument();
    expect(inProgressPill).toBeInTheDocument();
    expect(donePill).toBeInTheDocument();

    expect(pendingPill).toHaveTextContent('2');
    expect(inProgressPill).toHaveTextContent('1');
    expect(donePill).toHaveTextContent('5');
  });

  it('shows 0 correctly (no crash when all are 0)', () => {
    render(<DashboardKpiStrip pending={0} inProgress={0} done={0} />);

    expect(screen.getByTestId('kpi-pending')).toHaveTextContent('0');
    expect(screen.getByTestId('kpi-in-progress')).toHaveTextContent('0');
    expect(screen.getByTestId('kpi-done')).toHaveTextContent('0');
  });

  it('matches snapshot for basic structure', () => {
    const { container } = render(<DashboardKpiStrip pending={3} inProgress={2} done={7} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
