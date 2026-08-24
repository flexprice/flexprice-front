import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import SectionHeader from './SectionHeader';

describe('SectionHeader', () => {
	it('does not wrap a compound title in a paragraph (invalid <div> inside <p>)', () => {
		render(
			<SectionHeader
				title={
					<div data-testid='heading-row'>
						<span>Feature name</span>
						<button type='button'>Copy ID</button>
					</div>
				}
			/>,
		);

		expect(screen.getByTestId('heading-row').closest('p')).toBeNull();
		expect(screen.getByRole('button', { name: 'Copy ID' })).toBeInTheDocument();
	});
});
