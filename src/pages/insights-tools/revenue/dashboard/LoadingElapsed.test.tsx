import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { act, screen } from '@testing-library/react';
import { renderWithProviders } from '../reports/testUtils';
import LoadingElapsed from './LoadingElapsed';

describe('LoadingElapsed', () => {
	afterEach(() => vi.useRealTimers());

	it('shows elapsed seconds only after one second', () => {
		vi.useFakeTimers();
		renderWithProviders(<LoadingElapsed />);
		act(() => vi.advanceTimersByTime(900));
		expect(screen.queryByText(/still loading/)).not.toBeInTheDocument();
		act(() => vi.advanceTimersByTime(1600));
		expect(screen.getByText('2.5 seconds, still loading')).toBeInTheDocument();
	});
});
