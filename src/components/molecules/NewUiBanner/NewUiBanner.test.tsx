import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NewUiBanner from './NewUiBanner';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) =>
			({ 'newUiBanner.message': 'A new Flexprice console is here.', 'newUiBanner.action': 'Take me to the new UI' })[key] ?? key,
	}),
}));

describe('NewUiBanner', () => {
	afterEach(() => vi.unstubAllEnvs());

	it('links to the new console when its URL is set', () => {
		vi.stubEnv('VITE_NEW_CONSOLE_URL', 'https://app.flexprice.io');
		render(<NewUiBanner />);
		expect(screen.getByRole('link', { name: /Take me to the new UI/ })).toHaveAttribute('href', 'https://app.flexprice.io');
	});

	it('renders nothing when the URL is unset', () => {
		vi.stubEnv('VITE_NEW_CONSOLE_URL', '');
		const { container } = render(<NewUiBanner />);
		expect(container).toBeEmptyDOMElement();
	});
});
